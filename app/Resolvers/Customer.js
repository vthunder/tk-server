const GraphQLError = use('Adonis/Addons/GraphQLError')
const Stripe = use('TK/Stripe')
const _ = use('lodash')

// note: auth.getUser() implicitly checks Authorization header, throws otherwise

function keyValMapArray(array, attributes) {
  let ret = []
  for (let obj of array) {
    for (let attr of attributes) {
      _.set(obj, attr, keyValMap(_.get(obj, attr)))
    }
    ret.push(obj)
  }
  return ret
}
function keyValMap(object) {
  return Object.keys(object).map(k => ({ key: k, value: object[k] }))
}

module.exports = {
  Query: {
    customer: async (_, args, { auth }) => {
      const user = await auth.getUser()
      let customer = await Stripe.customers.retrieve(user.stripe_id)
      customer.metadata = keyValMap(customer.metadata)
      customer.sources = customer.sources.data.map(s => {
        s.metadata = keyValMap(s.metadata)
        return s
      })
      return customer
    },
    customer_payment_sources: async (_, args, { auth }) => {
      const user = await auth.getUser()
      if (!user.stripe_id) return null
      const ret = await Stripe.customers.retrieve(user.stripe_id)
      return ret.sources.data
    },
    customer_subscriptions: async (_, args, { auth }) => {
      const user = await auth.getUser()
      const subs = await Stripe.subscriptions.list({ customer: user.stripe_id })
      return keyValMapArray(subs.data, ['metadata', 'plan.metadata'])
    },
    customer_orders: async (_, args, { auth }) => {
      const user = await auth.getUser()
      return await Stripe.orders.retrieve(user.stripe_id)
    },
  },
  Mutation: {
    get_or_create_customer: async (_, { source }, { auth }) => {
      const user = await auth.getUser()
      let customer

      if (user.stripe_id) {
        customer = await Stripe.customers.retrieve(user.stripe_id)
      } else {
        const customers = await Stripe.customers.list({ email: user.email, limit: 1 })
        if (customers.data.length > 0) {
          console.warn(`Warning: existing Stripe customer has email: ${user.email}`)
          customer = customers.data[0]
          if (source) {
            customer = await Stripe.customers.update(customers.data[0].id, { source })
          }
        } else {
          customer = await Stripe.customers.create({
            email: user.email,
            description: user.email,
            source,
          })
        }
      }

      user.stripe_id = customer.id
      await user.save()

      customer.metadata = keyValMap(customer.metadata)
      customer.sources = customer.sources.data.map(s => {
        s.metadata = keyValMap(s.metadata)
        return s
      })

      return customer
    },
    update_customer: async (_, { source }, { auth }) => {
      const user = await auth.getUser()
      const customer = await Stripe.customers.update(user.stripe_id, { source })
      customer.metadata = keyValMap(customer.metadata)
      customer.sources = customer.sources.data.map(s => {
        s.metadata = keyValMap(s.metadata)
        return s
      })
      return customer
    },
    delete_customer: async (_, args, { auth }) => {
      const user = await auth.getUser()
      if (!user.can('delete_users')) throw new GraphQLError('Not allowed to delete users')
      // TODO: allow passing in user to delete
      await Stripe.customers.del(user.stripe_id)
      return 'ok'
    },
    create_subscription: async (_, { plans }, { auth }) => {
      const user = await auth.getUser()
      const sub = await Stripe.subscriptions.create({
        customer: user.stripe_id,
        items: plans.map(p => ({ plan: p }))
      })
      sub.metadata = keyValMap(sub.metadata)
      sub.plan.metadata = keyValMap(sub.plan.metadata)
      return sub
    },
    create_order: async (_, { skus }, { auth }) => {
      const user = await auth.getUser()
      const order = await Stripe.orders.create({
        customer: user.stripe_id,
        currency: 'usd',
        items: skus.map(s => ({ parent: s }))
      })
      order.metadata = keyValMap(order.metadata)
      return order
    },
    pay_order: async (_, { order, source }, { auth }) => {
      const user = await auth.getUser()
      let orderObj

      if (user.stripe_id) {
        if (source) {
          await Stripe.customers.update(user.stripe_id, { source: source })
        }
        orderObj = await Stripe.orders.pay(order, { customer: user.stripe_id })
      } else {
        orderObj = await Stripe.orders.pay(order, { source })
      }

      orderObj.metadata = keyValMap(orderObj.metadata)

      return orderObj
    },
    list_orders: async (_, args, { auth }) => {
      const user = await auth.getUser()
      return (await Stripe.orders.list({ customer: this.stripe_id })).data
    },
  },
}
