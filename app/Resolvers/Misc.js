const Persona = use('Persona')
const GraphQLError = use('Adonis/Addons/GraphQLError')
const Config = use('Adonis/Src/Config')
const Mailchimp = use('TK/Mailchimp')

const CalendarEvent = use('App/Models/CalendarEvent')
const Category = use('App/Models/Category')
const CreditCard = use('App/Models/CreditCard')
const Order = use('App/Models/Order')
const OrderItem = use('App/Models/OrderItem')
const Product = use('App/Models/Product')
const Subscription = use('App/Models/Subscription')
const Token = use('App/Models/Token')
const User = use('App/Models/User')

// note: auth.getUser() implicitly checks Authorization header, throws otherwise

module.exports = {
  Query: {
    ping: () => { return "pong" },
    products: async () => {
      const products = await Product.all();
      return products.toJSON();
    },
    membership_info: async (_, { type }) => {
      const product = await Product.query().where({
        subscription_name: 'membership',
        subscription_period: type,
      }).fetch()
      return product.first().toJSON();
    },
    calendar_event: async (_, { id }) => {
      const event = await CalendarEvent.find(id);
      return event.toJSON();
    },
    calendar_events: async () => {
      const events = await CalendarEvent.all();
      return events.toJSON();
    },
    saved_cards: async (_, args, { auth }) => {
      const user = await auth.getUser()
      return user.creditCards()
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
