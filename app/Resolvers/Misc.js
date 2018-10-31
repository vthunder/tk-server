const moment = use('moment')
const GraphQLError = use('Adonis/Addons/GraphQLError')
const Config = use('Adonis/Src/Config')
const Mailchimp = use('TK/Mailchimp')
const CalendarAPI = use('TK/GoogleCalendarAPI')
const CalendarEvent = use('App/Models/CalendarEvent')
const Product = use('App/Models/Product')
const Pass = use('App/Models/Pass')
const CouponToken = use('App/Models/CouponToken')
const KV = use('TK/KeyVal')
const Token = use('TK/Token')
const Mail = use('Mail')

// note: auth.getUser() implicitly checks Authorization header, throws otherwise

module.exports = {
  Query: {
    ping: () => { return "pong" },
    products: async () => {
      const products = await Product.all();
      return products.toJSON();
    },
    calendar_event: async (_, { id }) => {
      const event = await CalendarEvent.find(id);
      await event.fetch_skus()
      const ret = await event.toJSON()
      return KV.mapObject(ret, ['sku.attributes', 'sku.metadata',
                                'member_sku.attributes', 'member_sku.metadata'])
    },
    calendar_events: async () => {
      const events = await CalendarEvent.all();
      return events.toJSON();
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
  },
  Mutation: {
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
      const user = await auth.getUser()
      if (!user.can('create_coupon_tokens')) return 'Permission denied'
      if (!type.match(/(staff|ks_daypasses|ks_month|ks_year|ks_class)/))
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
      const user = await auth.getUser()
      if (!user.can('create_coupon_tokens')) return 'Permission denied'
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
      const user = await auth.getUser()
      const coupon = await CouponToken.findBy('token', token)
      if (!coupon) return 'Invalid coupon code'
      if (coupon.status !== 'new') return 'Coupon already used'

      // 1 month of membership
      if (coupon.type.match(/(staff|ks_month)/)) {
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

      // 2 day passes (all coupon types including 'ks_daypasses')
      await user.passes().create({ token: Token.generate() })
      await user.passes().create({ token: Token.generate() })

      coupon.status = 'used'
      coupon.claimed_by = user.id
      await coupon.save()

      return 'OK'
    },
  },
}
