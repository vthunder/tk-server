const moment = use('moment')
const GraphQLError = use('Adonis/Addons/GraphQLError')
const Config = use('Adonis/Src/Config')
const Mailchimp = use('TK/Mailchimp')
const CalendarEvent = use('App/Models/CalendarEvent')
const Product = use('App/Models/Product')
const Pass = use('App/Models/Pass')
const CouponToken = use('App/Models/CouponToken')
const KV = use('TK/KeyVal')
const Token = use('TK/Token')

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
    create_coupon_token: async (_, { type }, { auth }) => {
      const user = await auth.getUser()
      if (!user.can('create_coupon_tokens')) return 'Permission denied'
      if (!type.match(/(ks_month|ks_year|staff)/)) return 'Bad coupon type'

      const coupon = await CouponToken.create({
        type,
        token: Token.generate()
      })
      return coupon.token
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
