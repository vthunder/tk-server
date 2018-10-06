const GraphQLError = use('Adonis/Addons/GraphQLError')
const Config = use('Adonis/Src/Config')
const Mailchimp = use('TK/Mailchimp')
const CalendarEvent = use('App/Models/CalendarEvent')
const Product = use('App/Models/Product')
const KV = use('TK/KeyVal')

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
  },
}
