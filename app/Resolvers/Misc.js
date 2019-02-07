const moment = use('moment')
const Bottleneck = use('bottleneck')
const GraphQLError = use('Adonis/Addons/GraphQLError')
const Config = use('Adonis/Src/Config')
const Mailchimp = use('TK/Mailchimp')
const CalendarAPI = use('TK/GoogleCalendarAPI')
const CalendarEvent = use('App/Models/CalendarEvent')
const CalendarEventMaster = use('App/Models/CalendarEventMaster')
const CheckInLog = use('App/Models/CheckInLog')
const ClassInterest = use('App/Models/ClassInterest')
const Product = use('App/Models/Product')
const CouponToken = use('App/Models/CouponToken')
const Coupon = use('App/Models/Coupon')
const User = use('App/Models/User')
const KV = use('TK/KeyVal')
const Token = use('TK/Token')
const Mail = use('Mail')
const Auth = use('TK/Auth')
const PubSub = use('TK/PubSub')
const QR = use('TK/QR')

const limiter = new Bottleneck({
  reservoir: 10, // initial value
  reservoirRefreshAmount: 10,
  reservoirRefreshInterval: 60 * 1000, // must be divisible by 250
  highWater: 0,
  strategy: Bottleneck.strategy.LEAK,
  maxConcurrent: 1,
  minTime: 333,
});

module.exports = {
  Query: {
    ping: () => { return "pong" },
    products: async () => {
      const products = await Product.all();
      return products.toJSON();
    },
    calendar_event: async (_, { id }, { auth }) => {
      const event = await CalendarEvent.findOrFail(id)
      await event.load_master()

      const user = await Auth.getUser(auth)
      if (!(user && (user.is_member || user.has_free_membership()))) {
        event.ext_member_discount_code = ''
      }

      return event.toJSON()
    },
    calendar_master: async (_, { id, slug }, { auth }) => {
      if (!(id || slug)) return new GraphQLError('One of id, slug is required')

      let master
      if (id) master = await CalendarEventMaster.findOrFail(id)
      if (!id && slug) master = await CalendarEventMaster.findByOrFail('slug', slug)

      const user = await Auth.getUser(auth)
      if (!(user && (user.is_member || user.has_free_membership()))) {
        master.ext_member_discount_code = ''
      }
      await master.load_events()
      return master.toJSON()
    },
    calendar_events: async (_, {}, { auth }) => {
      const user = await Auth.getUser(auth)
      let events = await CalendarEvent.all()
      const masters = await CalendarEventMaster.all()
      const default_master_id = Config.get('app.default_event_master_id')

      for (let n = 0; n < events.rows.length; n++) {
        const id = events.rows[n].master_id || default_master_id
        const master = masters.rows.filter(m => m.id === id)
        events.rows[n].master = master[0]
      }
      events = events.toJSON()
      if (!(user && (user.is_member || user.has_free_membership()))) {
        events = events.map((e) => {
          e.ext_member_discount_code = ''
          return e
        })
      }
      return events
    },
    calendar_event_masters: async (_, {}, { auth }) => {
      const user = await Auth.getUser(auth)
      let masters = await CalendarEventMaster.all()
      for (let n = 0; n < masters.rows.length; n++) {
        await masters.rows[n].load_events()
      }
      masters = masters.toJSON()
      if (!(user && (user.is_member || user.has_free_membership()))) {
        masters = masters.map((e) => {
          e.ext_member_discount_code = ''
          return e
        })
      }
      return masters
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
      const user = await Auth.getUser(auth)
      if (!user) return 0
      const certs = await CouponToken.query()
            .where('claimed_by', '=', user.id)
            .andWhere('type', '=', 'gift_cert')
      return certs.reduce((acc, c) => acc + c.amount_remaining, 0)
    },
    get_cart_coupon: async (_, { code }, { auth }) => {
      const user = await Auth.getUser(auth)
      const coupon = await Coupon.findBy('code', code)
      if (!coupon) return { valid: false }
      await coupon.checkValidity()
      return coupon;
    },
    get_latest_qr_scan: async (_, {}, {}) => {
      const checkin = await CheckInLog.last()
      return await QR.parse(User, CouponToken, checkin.qr_data)
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
      if (!type.match(/(staff|ks_daypasses|ks_month|ks_year|ks_class|daypass|month)/))
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
      if (!type.match(/(staff|ks_daypasses|ks_month|ks_year|ks_class|month)/))
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
      if (!coupon) return { status: 'invalid' }
      if (coupon.status !== 'new') return { status: 'used' }

      // 1 month of membership
      if (coupon.type.match(/(staff|month|ks_month|ks_monthonly)/)) {
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

    class_interest: async (_, { email, master_id }, {}) => {
      const master = await CalendarEventMaster.find(master_id)
      await ClassInterest.create({ email, master_id, class: master.title })
      return 'OK'
    },

    check_in_qr_scan: async (_, { qr_data }, {}) => {
      return await limiter.schedule(async () => {
        CheckInLog.create({ qr_data })
        const qr_info = await QR.parse(User, CouponToken, qr_data)
        PubSub.publish('QR_SCANNED', { new_qr_scan: qr_info })
      });
    },
  },
  Subscription: {
    new_qr_scan: {
      subscribe: () => PubSub.asyncIterator('QR_SCANNED'),
    },
  },
}
