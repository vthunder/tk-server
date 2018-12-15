const moment = use('moment')
const GraphQLError = use('Adonis/Addons/GraphQLError')
const Config = use('Adonis/Src/Config')
const Mailchimp = use('TK/Mailchimp')
const CalendarAPI = use('TK/GoogleCalendarAPI')
const CalendarEvent = use('App/Models/CalendarEvent')
const CalendarEventMaster = use('App/Models/CalendarEventMaster')
const Product = use('App/Models/Product')
const CouponToken = use('App/Models/CouponToken')
const KV = use('TK/KeyVal')
const Token = use('TK/Token')
const Mail = use('Mail')
const Auth = use('TK/Auth')

module.exports = {
  Query: {
    ping: () => { return "pong" },
    products: async () => {
      const products = await Product.all();
      return products.toJSON();
    },
    calendar_event: async (_, { id }, { auth }) => {
      const user = await Auth.getUser(auth)
      const event = await CalendarEvent.find(id);
      await event.fetch_skus()
      if (!(user && (user.is_member || user.has_free_membership()))) {
        event.ext_member_discount_code = ''
      }
      const ret = await event.toJSON()
      return KV.mapObject(ret, ['sku.attributes', 'sku.metadata',
                                'member_sku.attributes', 'member_sku.metadata'])
    },
    calendar_events: async (_, {}, { auth }) => {
      const user = await Auth.getUser(auth)
      let events = (await CalendarEvent.all()).toJSON()
      let masters = (await CalendarEventMaster.all()).toJSON()
      if (!(user && (user.is_member || user.has_free_membership()))) {
        events = events.map((e) => {
          e.ext_member_discount_code = ''
          return e
        })
        masters = masters.map((e) => {
          e.ext_member_discount_code = ''
          return e
        })
      }
      return { events, masters }
    },
    google_calendar_events: async () => {
      try {
        const id = Config.get('app.googleapi.calendarId.primary')
        const events = await CalendarAPI.Events.list(id, {
          timeMin: moment().subtract(1, 'months').format('YYYY-MM-DDTHH:mm:ssZ'),
          timeMax: moment().add(2, 'months').format('YYYY-MM-DDTHH:mm:ssZ'),
          singleEvents: 'true',
          orderBy: 'startTime',
        })
        return events.map((e) => {
          return {
//            id: e.id,
            title: e.summary,
            start: moment(e.start.dateTime).format(),
            end: moment(e.end.dateTime).format(),
            all_day: false,
          }
        })
      } catch (e) {
        console.log(e)
      }
    },
    gift_certificate_balance: async (_, {}, { auth }) => {
      const user = await Auth.requireUser(auth)
      const certs = await CouponToken.query()
            .where('claimed_by', '=', user.id)
            .andWhere('type', '=', 'gift_cert')
      return certs.reduce((acc, c) => acc + c.amount_remaining, 0)
    },
  },
  Mutation: {
    create_calendar_event: async (_, { event_data }, { auth }) => {
      const user = await Auth.requireUser(auth)
      const perms = await user.getPermissions()
      if (!perms.includes('create_calendar_event')) return new GraphQLError('Permission denied')

      const event = await CalendarEvent.create({
        title: event_data.title,
        category: event_data.category,
        start: event_data.date + ' ' + event_data.time,
        duration: event_data.duration,
        description: event_data.description,
        sku_id: event_data.sku_id,
        member_sku_id: event_data.member_sku_id,
      })
      return 'OK'
    },
    mailing_list_signup: async (_, { name, email, list }) => {
      list = Config.get('mail.mailchimp.defaultList', list)
      const listId = Config.get(`mail.mailchimp.listIds.${list}`)
      try {
        await Mailchimp.post(`/lists/${listId}/members`, {
          email_address: email,
          status: 'pending',
        })
      } catch (e) {
        throw new GraphQLError(e.title);
      }
      return 'OK'
    },
    create_coupon_token: async (_, { type, count }, { auth }) => {
      const user = await Auth.requireUser(auth)
      const perms = await user.getPermissions()
      if (!perms.includes('create_coupon_tokens')) return new GraphQLError('Permission denied')
      if (!type.match(/(staff|ks_daypasses|ks_month|ks_year|ks_class|daypass)/))
        return 'Bad coupon type'

      return [...Array(count)].map(async (_, i) => {
        const coupon = await CouponToken.create({
          type,
          token: Token.generate()
        })
        return coupon.token
      })
    },
    send_coupon_tokens: async (_, { type, emails }, { auth }) => {
      const user = await Auth.requireUser(auth)
      const perms = await user.getPermissions()
      if (!perms.includes('create_coupon_tokens')) return new GraphQLError('Permission denied')
      if (!type.match(/(staff|ks_daypasses|ks_month|ks_year|ks_class)/))
        return 'Bad coupon type'

      emails.split(/[ ,]+/).map(async (email) => {
        const coupon = await CouponToken.create({
          type,
          token: Token.generate()
        })

        let template = 'emails.coupon_staff'
        if (type.match(/^ks_(month|year)/)) template = 'emails.coupon_ks'
        if (type.match(/^ks_(daypasses|class)/)) template = 'emails.coupon_ks_passes'

        await Mail.send(template, { token: coupon.token }, (message) => {
          message
            .to(email)
            .from('hello@tinkerkitchen.org')
            .subject('Your Tinker Kitchen reward is here!')
        })
        coupon.sent_to = email
        await coupon.save()
      })

      return 'OK'
    },
    use_coupon_token: async (_, { token }, { auth }) => {
      const user = await Auth.requireUser(auth)
      const coupon = await CouponToken.findBy('token', token)
      if (!coupon) return 'Invalid coupon code'
      if (coupon.status !== 'new') return 'Coupon already used'

      // 1 month of membership
      if (coupon.type.match(/(staff|ks_month|ks_monthonly)/)) {
        await user.give_free_membership('month', coupon.type)
      }

      // 1 year of membership
      if (coupon.type === 'ks_year') {
        await user.give_free_membership('year', coupon.type)
      }

      // 1 class
      if (coupon.type === 'ks_class') {
        await user.passes().create({ token: Token.generate(), type: 'class' })
      }

      // 2 day passes (all KS coupon types)
      if (coupon.type.match(/ks_(month|year|class|daypasses)/)) {
        await user.passes().create({ token: Token.generate() })
        await user.passes().create({ token: Token.generate() })
      }

      // Non-KS coupons

      // 1 day pass
      if (coupon.type === 'daypass') {
        await user.passes().create({ token: Token.generate() })
      }

      if (coupon.type === 'gift_cert') {
        // OK, just set status/claimed_by below
      }

      coupon.status = 'used'
      coupon.claimed_by = user.id
      await coupon.save()

      return { status: 'OK', type: coupon.type }
    },
  },
}
