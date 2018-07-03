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
    calendarEvents: async () => {
      const events = await CalendarEvent.all();
      return events.toJSON();
    },
  },
  Mutation: {
    mailingListSignup: async (_, { name, email }) => {
      const list = Config.get('mail.mailchimp.defaultList')
      try {
        await Mailchimp.post(`/lists/${list}/members`, {
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
