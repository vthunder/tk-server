const _ = use('lodash')
const Config = use('Adonis/Src/Config')
const GraphQLError = use('Adonis/Addons/GraphQLError')
const Stripe = use('TK/Stripe')
const Token = use('TK/Token')
const Pass = use('App/Models/Pass')

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

// 1. Copy parent attributes to sku order items
// 2. Ensure parent is always a string (as per graphql schema)
// 3. Remove wrapper object around invoice line items
function fixChargeItems(array) {
  let ret = []
  for (let obj of array) {
    const invoiceData = _.get(obj, 'invoice.lines.data')
    if (invoiceData) _.set(obj, 'invoice.lines', invoiceData)

    if (obj.order && obj.order.items) {
      let items = []
      for (let item of obj.order.items) {
        item.attributes = keyValMap(_.get(item, 'parent.attributes', {}));
        item.parent = _.get(item, 'parent.id');
        items.push(item)
      }
      obj.order.items = items
    }

    ret.push(obj)
  }
  return ret
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
      const orders = await Stripe.orders.list({ customer: user.stripe_id })
      return keyValMapArray(orders.data, ['metadata'])
    },
    customer_charges: async (_, args, { auth }) => {
      const user = await auth.getUser()
      let charges = await Stripe.charges.list({
        customer: user.stripe_id,
        expand: ['data.invoice', 'data.order', 'data.order.items.parent'],
      })

      charges = keyValMapArray(charges.data, ['metadata'])
      charges = fixChargeItems(charges)

      return charges
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

      user.last_member_check = '1970-01-01 00:00:00' // force refetch on next pageload
      await user.save()

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

      if (orderObj.status === 'paid') {
        orderObj.items
          .filter(i => i.type === 'sku')
          .forEach(async (i) => {
            const skuObj = await Stripe.skus.retrieve(i.parent)

            let units = 1
            if (skuObj.attributes && skuObj.attributes['bundled-units']) {
              units = skuObj.attributes['bundled-units']
            }

            const prodObj = await Stripe.products.retrieve(skuObj.product)
            if (prodObj.name === 'Day pass') {
              for (let n = 0; n < units; n++) {
                await Pass.create({
                  token: Token.generate(),
                  order_id: orderObj.id,
                  user_id: user.id,
                })
              }
            } else {
              console.log(`Unknown product: "${prodObj.name}", needs to be tracked!`)
            }
          });
      }

      orderObj.metadata = keyValMap(orderObj.metadata)

      return orderObj
    },
  },
}