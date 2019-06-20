const moment = use('moment')
const md5 = use('md5')
const Bottleneck = use('bottleneck')
const GraphQLError = use('Adonis/Addons/GraphQLError')
const Config = use('Adonis/Src/Config')
const Mailchimp = use('TK/Mailchimp')
const CalendarAPI = use('TK/GoogleCalendarAPI')
const CalendarEvent = use('App/Models/CalendarEvent')
const CalendarEventMaster = use('App/Models/CalendarEventMaster')
const CheckInLog = use('App/Models/CheckInLog')
const UserAgreedTerm = use('App/Models/UserAgreedTerm')
const ClassInterest = use('App/Models/ClassInterest')
const TastingStationInfo = use('App/Models/TastingStationInfo')
const Product = use('App/Models/Product')
const CouponToken = use('App/Models/CouponToken')
const Coupon = use('App/Models/Coupon')
const User = use('App/Models/User')
const QrToken = use('App/Models/QrToken')
const QrScanLog = use('App/Models/QrScanLog')
const KV = use('TK/KeyVal')
const Token = use('TK/Token')
const Mail = use('Mail')
const Auth = use('TK/Auth')
const PubSub = use('TK/PubSub')

const limiter = new Bottleneck({
  reservoir: 10, // initial value
  reservoirRefreshAmount: 10,
  reservoirRefreshInterval: 60 * 1000, // must be divisible by 250
  highWater: 0,
  strategy: Bottleneck.strategy.LEAK,
  maxConcurrent: 1,
  minTime: 333,
})

module.exports = {
  Query: {
    ping: () => { return "pong" },
    products: async () => {
      const products = await Product.all()
      return products.toJSON()
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
    calendar_events: async (_, { id, slug }, { auth }) => {
      const user = await Auth.getUser(auth)
      let events

      if (id || slug) {
        // retrieve only events belonging to a master
        let master
        if (id) master = await CalendarEventMaster.findOrFail(id)
        if (!id && slug) master = await CalendarEventMaster.findByOrFail('slug', slug)
        events = await master.events().fetch()
      } else {
        // retrieve all events
        events = await CalendarEvent.all()
      }

      for (let n = 0; n < events.rows.length; n++) {
        await events.rows[n].load_master()
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
            .fetch()
      return certs.rows.reduce((acc, c) => acc + c.amount_remaining, 0)
    },
    get_cart_coupon: async (_, { code }, { auth }) => {
      const user = await Auth.getUser(auth)
      const coupon = await Coupon.findBy('code', code)
      if (!coupon) return { valid: false }
      await coupon.checkValidity()
      return coupon
    },
    get_legal_terms: async (_, { name, email }, {}) => {
      // TODO: Configure/augment this list by letting user pick which
      // event they are checking in for
      const required = [
        'Liability_Waiver_and_Media_Release_2018_11_10.pdf',
        // 'Kitchentown Tasting Event Agreement - rbc 2019-03-04.pdf',
      ]
      let terms = []
      for (let t of required) {
        const ret = await UserAgreedTerm.query().where({ name, email, terms_name: t }).fetch()
        if (!ret.rows.length) terms.push(t)
      }
      return terms
    },
    tasting_info: async (_, { date, station }, {}) => {
      const stations = await TastingStationInfo.query()
            .where('date', '=', date)
            .andWhere('station', '=', station)
            .fetch()
      if (!(stations.rows && stations.rows.length)) return
      await stations.rows[0].load_products()
      return stations.rows[0].toJSON()
    },
    mailing_list_check: async (_, { email, list }) => {
      const email_hash = md5(email.toLowerCase())
      list = Config.get('mail.mailchimp.defaultList', list)
      const listId = Config.get(`mail.mailchimp.listIds.${list}`)
      try {
        await Mailchimp.get(`/lists/${listId}/members/${email_hash}`)
      } catch (e) {
        return false
      }
      return true
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
    create_calendar_hold: async (_, { event_data }, { auth }) => {
      const user = await Auth.getUser(auth)
      let loggedInEmail = user ? user.email : null
      let email = event_data.email || loggedInEmail

      const data = {
        datetime: `${event_data.date} @ ${event_data.time} (for 5h)`,
        category: event_data.category,
        contact: `${event_data.name} <${email}>`,
        size: event_data.size,
        diners: event_data.diners,
        cooks: event_data.cooks,
        class_info: event_data.class_info,
      }
      const event = await CalendarEvent.create({
        title: 'Temp Hold',
        category: 'held',
        start: event_data.date + ' ' + event_data.time,
        duration: event_data.duration,
        memo: `Event Hold

Type: ${data.category}
On: ${data.datetime}
Contact: ${data.contact}

Size: ${data.size}
Diners: ${data.diners}
Cooks: ${data.cooks}

ClassInfo: ${data.class_info}
`,
      })

      await Mail.send('emails.event_hold_created_admin', { data }, (message) => {
        message
          .to('hello@tinkerkitchen.org')
          .from('hello@tinkerkitchen.org')
          .subject('New Event Hold')
      })

      if (email) {
        await Mail.send('emails.event_hold_created_customer', { data }, (message) => {
          message
            .to(email)
            .from('hello@tinkerkitchen.org')
            .subject('Event Hold Added')
        })
      }

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
        throw new GraphQLError(e.title)
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
      const found = qr_data.match('https:\/\/tinkerkitchen.org\/qr\/token\/(.*)$')
      if (found && found[1]) {
        const qr_token = await QrToken.findBy('token', found[1])
        await qr_token.load()
        await QrScanLog.create({ qr_data,
                                 qr_token_id: qr_token.id,
                                 qr_token_status: qr_token.status })
        return qr_token.toJSON()
      }
      return new GraphQLError('QR code not found')
    },

    checkin: async (_, { data }, {}) => {
      await CheckInLog.create({
        name: data.name,
        child_name: data.child_name,
        email: data.email,
        user_type: data.user_type,
        subscribe_to_list: data.subscribe_to_list,
      })
      for (let t of data.agreed_terms) {
        await UserAgreedTerm.create({
          name: data.name,
          child_name: data.child_name,
          email: data.email,
          terms_name: t.terms_name,
          agreed_timestamp: t.agreed_timestamp,
        })
      }
      await Mail.send('emails.check_in', { data }, (message) => {
        message
          .to(data.email)
          .from('hello@tinkerkitchen.org')
          .subject('You checked in at Tinker Kitchen')
      })
    },
  },
}
