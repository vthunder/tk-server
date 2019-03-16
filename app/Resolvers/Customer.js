const _ = use('lodash')
const moment = use('moment')
const Mail = use('Mail')
const Config = use('Adonis/Src/Config')
const GraphQLError = use('Adonis/Addons/GraphQLError')
const Pass = use('App/Models/Pass')
const Booking = use('App/Models/Booking')
const CouponToken = use('App/Models/CouponToken')
const Coupon = use('App/Models/Coupon')
const Token = use('TK/Token')
const Stripe = use('TK/Stripe')
const KV = use('TK/KeyVal')
const Auth = use('TK/Auth')

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
        item.attributes = KV.mapField(_.get(item, 'parent.attributes', {}));
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
      const user = await Auth.requireUser(auth)
      let customer = await Stripe.customers.retrieve(user.stripe_id)
      customer.metadata = KV.mapField(customer.metadata)
      customer.sources = customer.sources.data.map(s => {
        s.metadata = KV.mapField(s.metadata)
        return s
      })
      return customer
    },
    customer_payment_sources: async (_, args, { auth }) => {
      const user = await Auth.getUser(auth)
      if (!user || !user.stripe_id) return []
      const ret = await Stripe.customers.retrieve(user.stripe_id)
      return ret.sources.data
    },
    customer_subscriptions: async (_, args, { auth }) => {
      const user = await Auth.requireUser(auth)
      if (!user.stripe_id) return []
      const subs = await Stripe.subscriptions.list({ customer: user.stripe_id })
      return KV.mapArray(subs.data, ['metadata', 'plan.metadata'])
    },
    customer_orders: async (_, args, { auth }) => {
      const user = await Auth.requireUser(auth)
      if (!user.stripe_id) return []
      const orders = await Stripe.orders.list({ customer: user.stripe_id })
      return KV.mapArray(orders.data, ['metadata'])
    },
    customer_charges: async (_, args, { auth }) => {
      const user = await Auth.requireUser(auth)
      if (!user.stripe_id) return []
      let charges = await Stripe.charges.list({
        customer: user.stripe_id,
        expand: ['data.invoice', 'data.order', 'data.order.items.parent'],
      })

      charges = KV.mapArray(charges.data, ['metadata'])
      charges = fixChargeItems(charges)

      return charges
    },
  },
  Mutation: {
    get_or_create_customer: async (_, { source }, { auth }) => {
      const user = await Auth.requireUser(auth)
      let customer

      if (user.stripe_id) {
        customer = await Stripe.customers.retrieve(user.stripe_id)
      } else {
        const customers = await Stripe.customers.list({ email: user.email, limit: 1 })
        if (customers.data.length > 0) {
          console.warn(`Warning: existing Stripe customer has email: ${user.email}`)
          customer = customers.data[0]
        } else {
          customer = await Stripe.customers.create({
            email: user.email,
            description: user.email,
            source,
          })
        }
      }

      if (source) {
        customer = await Stripe.customers.update(customer.id, { source })
      }

      user.stripe_id = customer.id
      await user.save()

      customer.metadata = KV.mapField(customer.metadata)
      customer.sources = customer.sources.data.map(s => {
        s.metadata = KV.mapField(s.metadata)
        return s
      })

      return customer
    },
    update_customer: async (_, { source }, { auth }) => {
      const user = await Auth.requireUser(auth)
      const customer = await Stripe.customers.update(user.stripe_id, { source })
      customer.metadata = KV.mapField(customer.metadata)
      customer.sources = customer.sources.data.map(s => {
        s.metadata = KV.mapField(s.metadata)
        return s
      })
      return customer
    },
    delete_customer: async (_, args, { auth }) => {
      const user = await Auth.requireUser(auth)
      if (!user.can('delete_users')) throw new GraphQLError('Not allowed to delete users')
      // TODO: allow passing in user to delete
      await Stripe.customers.del(user.stripe_id)
      return 'ok'
    },
    create_subscription: async (_, { plans, code }, { auth }) => {
      const user = await Auth.requireUser(auth)

      user.last_member_check = '1970-01-01 00:00:00' // force refetch on next pageload
      await user.save()

      let coupon, trial_end
      if (code === 'KS_CONVERT') {
        if (plans[0] === Config.get('app.membership.plan.monthly')) {
          coupon = Config.get('app.membership.discount.backer_monthly')
        }
        if (plans[0] === Config.get('app.membership.plan.yearly')) {
          coupon = Config.get('app.membership.discount.backer_yearly')
        }
        if (plans.length > 1) throw 'Cannot process more than one subscription at a time'
        trial_end = moment(user.free_membership_end).format('X')
      }

      const sub = await Stripe.subscriptions.create({
        customer: user.stripe_id,
        items: plans.map(p => ({ plan: p })),
        coupon,
        trial_end,
      })

      sub.metadata = KV.mapField(sub.metadata)
      sub.plan.metadata = KV.mapField(sub.plan.metadata)

      return sub
    },
    create_order: async (_, { items, coupon_code }, { auth }) => {
      const user = await Auth.getUser(auth)
      let member = false
      let subtotal = 0
      let member_discounts = 0
      const discount = { amount: 0, description: '' }
      const order_args = {
        currency: 'usd',
        items: items.map(i => ({ parent: i.sku, quantity: i.quantity }))
      }

      if (user) {
        await user.stripe_check()
        if (user.stripe_id) order_args.customer = user.stripe_id
        member = user.is_member || user.has_free_membership()
      }

      for (const i of items) {
        const sku = await Stripe.skus.retrieve(i.sku)
        subtotal += sku.price * i.quantity
        if (member) {
          const product = await Stripe.products.retrieve(sku.product)
          if (product.metadata.member_discount) {
            if (product.metadata.event_id) {
              // max 1x discount per event
              member_discounts += parseInt(product.metadata.member_discount, 10)
            } else {
              member_discounts += parseInt(product.metadata.member_discount, 10) * i.quantity
            }
          }
        }
      }
      if (coupon_code) {
        const tk_coupon = await Coupon.findBy('code', coupon_code)
        discount.amount = await tk_coupon.calculateAmount(subtotal)
        discount.description = tk_coupon.name
      }

      if (member_discounts) {
        discount.amount += member_discounts
        if (coupon_code) discount.description = `Member discounts + coupon: ${discount.description}`
        else discount.description = 'Member discounts'
      }

      if (discount.amount) {
        const coupon = await Stripe.coupons.create({
          amount_off: discount.amount,
          currency: 'usd',
          duration: 'once',
          name: discount.description,
        })
        order_args.coupon = coupon.id
      }

      const order = await Stripe.orders.create(order_args)
      order.metadata = KV.mapField(order.metadata)
      return order
    },
    pay_order: async (_, { order, source, email }, { auth }) => {
      const user = await Auth.getUser(auth)
      let orderObj

      if (user && user.stripe_id) {
        if (source) {
          await Stripe.customers.update(user.stripe_id, { source: source })
        }
        orderObj = await Stripe.orders.pay(order, { customer: user.stripe_id })
      } else {
        email = user? user.email : email
        orderObj = await Stripe.orders.pay(order, { source, email })
      }

      // Hack to add an email to the charge itself, triggering a receipt to be sent
      await Stripe.charges
        .update(orderObj.charge,
                { receipt_email: user? user.email : email })

      if (orderObj.status === 'paid') {
        orderObj.items
          .filter(i => i.type === 'sku')
          .forEach(async (i) => {
            const skuObj = await Stripe.skus.retrieve(i.parent)

            let units = (i.quantity || 1)
            if (skuObj.attributes && skuObj.attributes['bundled-units']) {
              units = units * skuObj.attributes['bundled-units']
            }

            const prodObj = await Stripe.products.retrieve(skuObj.product)
            if (prodObj.name === 'Day Pass') {
              for (let n = 0; n < units; n++) {
                const passOpts = {
                  token: Token.generate(),
                  order_id: orderObj.id,
                }
                if (email) passOpts.email = email
                if (user) passOpts.user_id = user.id
                await Pass.create(passOpts)
              }
            } else if (prodObj.metadata.event_id) {
              for (let n = 0; n < units; n++) {
                const bookingOpts = {
                  calendar_event_id: prodObj.metadata.event_id,
                  stripe_sku_id: skuObj.id,
                  stripe_sku_date: skuObj.attributes.date,
                }
                if (email) bookingOpts.email = email
                if (user) bookingOpts.user_id = user.id
                await Booking.create(bookingOpts)
              }
              await Mail.send(
                'emails.event_booked',
                { user, product: prodObj, units },
                (message) => {
                  message
                    .to(email)
                    .from('hello@tinkerkitchen.org')
                    .subject('Your Tinker Kitchen Event Booking')
                })
            } else if (prodObj.name === 'Gift Certificate') {
              for (let n = 0; n < units; n++) {
                const certOpts = {
                  type: 'gift_cert',
                  token: Token.generate(),
                  amount: skuObj.price,
                  amount_remaining: skuObj.price,
                  order_id: orderObj.id,
                }
                if (email) certOpts.sent_to = email
                if (user) certOpts.user_id = user.id
                await CouponToken.create(certOpts)
              }
            } else {
              console.log(`Unknown product: "${prodObj.name}", needs to be tracked!`)
            }
          });

        await Mail.send(
          'emails.admin_new_order',
          { user, order: orderObj },
          (message) => {
            message
              .to('hello@tinkerkitchen.org')
              .from('hello@tinkerkitchen.org')
              .subject('New Order')
          })
      }

      orderObj.metadata = KV.mapField(orderObj.metadata)

      return orderObj
    },
  },
}
