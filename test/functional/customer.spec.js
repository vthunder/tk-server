'use strict'

const { test, before, after } = use('Test/Suite')('Orders & Payments')
const apollo = use('TK/ApolloApiClient')
const unauthedApollo = use('TK/UnauthedApolloApiClient')
const gql = require('graphql-tag');

test('mutation: get_or_create_customer', async ({ assert }) => {
  try {
    const ret = await apollo.mutate({
      mutation: gql`
        mutation($source: String) {
          get_or_create_customer(source: $source) {
            id
            account_balance
            created
            currency
            default_source
            delinquent
            description
            email
            invoice_prefix
            livemode
            metadata {
              key
              value
            }
            sources {
              id
              brand
              last4
              exp_month
              exp_year
            }
          }
        }
      `,
      variables: {
        source: "tok_visa"
      }
    })
    const customer = ret.data.get_or_create_customer
    assert.isOk(customer.id)
    assert.equal(customer.account_balance, 0)
    assert.isOk(customer.created)
//    assert.equal(customer.currency, 'usd')
    assert.isOk(customer.default_source)
    assert.equal(customer.delinquent, false)
    assert.equal(customer.description, 'dan@example.com')
    assert.equal(customer.email, 'dan@example.com')
    assert.isOk(customer.invoice_prefix)
    assert.equal(customer.livemode, false)
    assert.equal(customer.metadata.length, 0)
    assert.equal(customer.sources.length, 1)
    assert.isOk(customer.sources[0].id)
    assert.equal(customer.sources[0].brand, 'Visa')
    assert.equal(customer.sources[0].last4, '4242')
    assert.isOk(customer.sources[0].exp_month)
    assert.isOk(customer.sources[0].exp_year)
    assert.equal(customer.sources[0].__typename, 'Source')
    assert.equal(customer.__typename, 'Customer')
  } catch (e) {
    console.log(e)
    console.log(e.networkError.result.errors)
  }
}).timeout(0)

test('mutation: get_or_create_customer (existing, switch cards)', async ({ assert }) => {
  try {
    const ret = await apollo.mutate({
      mutation: gql`
        mutation($source: String) {
          get_or_create_customer(source: $source) {
            id
            account_balance
            created
            currency
            default_source
            delinquent
            description
            email
            invoice_prefix
            livemode
            metadata {
              key
              value
            }
            sources {
              id
              brand
              last4
              exp_month
              exp_year
            }
          }
        }
      `,
      variables: {
        source: "tok_mastercard"
      }
    })
    const customer = ret.data.get_or_create_customer
    assert.isOk(customer.id)
    assert.equal(customer.account_balance, 0)
    assert.isOk(customer.created)
//    assert.equal(customer.currency, 'usd')
    assert.isOk(customer.default_source)
    assert.equal(customer.delinquent, false)
    assert.equal(customer.description, 'dan@example.com')
    assert.equal(customer.email, 'dan@example.com')
    assert.isOk(customer.invoice_prefix)
    assert.equal(customer.livemode, false)
    assert.equal(customer.metadata.length, 0)
    assert.equal(customer.sources.length, 1)
    assert.isOk(customer.sources[0].id)
    assert.equal(customer.sources[0].brand, 'MasterCard')
    assert.equal(customer.sources[0].last4, '4444')
    assert.isOk(customer.sources[0].exp_month)
    assert.isOk(customer.sources[0].exp_year)
    assert.equal(customer.sources[0].__typename, 'Source')
    assert.equal(customer.__typename, 'Customer')
  } catch (e) {
    console.log(e)
    console.log(e.networkError.result.errors)
  }
}).timeout(0)

test('mutation: update_customer', async ({ assert }) => {
  try {
    const ret = await apollo.mutate({
      mutation: gql`
        mutation($source: String) {
          update_customer(source: $source) {
            id
            account_balance
            created
            currency
            default_source
            delinquent
            description
            email
            invoice_prefix
            livemode
            metadata {
              key
              value
            }
            sources {
              id
              brand
              last4
              exp_month
              exp_year
            }
          }
        }
      `,
      variables: {
        source: "tok_visa"
      }
    })
    const customer = ret.data.update_customer
    assert.isOk(customer.id)
    assert.equal(customer.account_balance, 0)
    assert.isOk(customer.created)
//    assert.equal(customer.currency, 'usd')
    assert.isOk(customer.default_source)
    assert.equal(customer.delinquent, false)
    assert.equal(customer.description, 'dan@example.com')
    assert.equal(customer.email, 'dan@example.com')
    assert.isOk(customer.invoice_prefix)
    assert.equal(customer.livemode, false)
    assert.equal(customer.metadata.length, 0)
    assert.equal(customer.sources.length, 1)
    assert.isOk(customer.sources[0].id)
    assert.equal(customer.sources[0].brand, 'Visa')
    assert.equal(customer.sources[0].last4, '4242')
    assert.isOk(customer.sources[0].exp_month)
    assert.isOk(customer.sources[0].exp_year)
    assert.equal(customer.sources[0].__typename, 'Source')
    assert.equal(customer.__typename, 'Customer')
  } catch (e) {
    console.log(e)
    console.log(e.networkError.result.errors)
  }
}).timeout(0)

test('mutation: create_subscription', async ({ assert }) => {
  try {
    const ret = await apollo.mutate({
      mutation: gql`
        mutation($plans: [String]) {
          create_subscription(plans: $plans) {
            id
            billing_cycle_anchor
            cancel_at_period_end
            canceled_at
            created
            current_period_end
            current_period_start
            customer
            ended_at
            livemode
            metadata {
              key
              value
            }
            plan {
              id
              active
              amount
              currency
              interval
              interval
              livemode
              metadata {
                key
                value
              }
              nickname
              product
            }
            quantity
            start
            status
            tax_percent
          }
        }
      `,
      variables: {
        "plans": ["plan_DW2iwbIRy1XJQp"]
      }
    })
    assert.isOk(ret.data.create_subscription.id)
    assert.isOk(ret.data.create_subscription.billing_cycle_anchor)
    assert.equal(ret.data.create_subscription.cancel_at_period_end, false)
    assert.equal(ret.data.create_subscription.canceled_at, null)
    assert.isOk(ret.data.create_subscription.created)
    assert.isOk(ret.data.create_subscription.current_period_end)
    assert.isOk(ret.data.create_subscription.current_period_start)
    assert.isOk(ret.data.create_subscription.customer)
    assert.equal(ret.data.create_subscription.ended_at, null)
    assert.equal(ret.data.create_subscription.livemode, false)
    assert.equal(ret.data.create_subscription.metadata.length, 0)
    assert.isOk(ret.data.create_subscription.plan.id)
    assert.equal(ret.data.create_subscription.plan.active, true)
    assert.equal(ret.data.create_subscription.plan.amount, 15000)
//    assert.equal(ret.data.create_subscription.plan.currency, 'usd')
    assert.equal(ret.data.create_subscription.plan.interval, 'month')
    assert.equal(ret.data.create_subscription.plan.livemode, false)
    assert.equal(ret.data.create_subscription.plan.metadata.length, 3)
    assert.equal(ret.data.create_subscription.plan.nickname, 'Monthly membership')
    assert.isOk(ret.data.create_subscription.plan.product)
    assert.equal(ret.data.create_subscription.plan.__typename, 'Plan')
    assert.equal(ret.data.create_subscription.quantity, 1)
    assert.isOk(ret.data.create_subscription.start)
    assert.equal(ret.data.create_subscription.status, 'active')
    assert.equal(ret.data.create_subscription.tax_percent, null)
    assert.equal(ret.data.create_subscription.__typename, 'Subscription')
  } catch (e) {
    console.log(e)
    console.log(e.networkError.result.errors)
  }
}).timeout(0)

let orderId
test('mutation: create_order', async ({ assert }) => {
  try {
    const ret = await apollo.mutate({
      mutation: gql`
        mutation($skus: [String]) {
          create_order(skus: $skus) {
            id
            amount
            amount_returned
            charge
            currency
            customer
            email
            items {
              amount
              currency
              description
              parent
              quantity
              type
            }
            livemode
            metadata {
              key
              value
            }
            status
          }
        }
        `,
      variables: {
        skus: ['member-5']
      }
    })
    assert.isOk(ret.data.create_order.id)
    orderId = ret.data.create_order.id
    assert.equal(ret.data.create_order.amount, 12500)
    assert.isNotOk(ret.data.create_order.amount_returned)
    assert.isNotOk(ret.data.create_order.charge)
    assert.equal(ret.data.create_order.currency, 'usd')
    assert.isOk(ret.data.create_order.customer)
    assert.equal(ret.data.create_order.email, 'dan@example.com')
    assert.equal(ret.data.create_order.items.length, 3)
    assert.equal(ret.data.create_order.items[0].amount, 12500)
    assert.equal(ret.data.create_order.items[0].currency, 'usd')
    assert.equal(ret.data.create_order.items[0].description, 'Day pass')
    assert.equal(ret.data.create_order.items[0].parent, 'member-5')
    assert.equal(ret.data.create_order.items[0].quantity, 1)
    assert.equal(ret.data.create_order.items[0].type, 'sku')
    assert.equal(ret.data.create_order.items[0].__typename, 'OrderLineItem')
    assert.equal(ret.data.create_order.items[1].amount, 0)
    assert.equal(ret.data.create_order.items[1].currency, 'usd')
    assert.equal(ret.data.create_order.items[1].description, 'Taxes (included)')
    assert.isNotOk(ret.data.create_order.items[1].parent)
    assert.isNotOk(ret.data.create_order.items[1].quantity)
    assert.equal(ret.data.create_order.items[1].type, 'tax')
    assert.equal(ret.data.create_order.items[1].__typename, 'OrderLineItem')
    assert.equal(ret.data.create_order.items[2].amount, 0)
    assert.equal(ret.data.create_order.items[2].currency, 'usd')
    assert.equal(ret.data.create_order.items[2].description, 'Free shipping')
    assert.equal(ret.data.create_order.items[2].parent, 'ship_free-shipping')
    assert.isNotOk(ret.data.create_order.items[2].quantity)
    assert.equal(ret.data.create_order.items[2].type, 'shipping')
    assert.equal(ret.data.create_order.items[2].__typename, 'OrderLineItem')
    assert.equal(ret.data.create_order.livemode, false)
    assert.equal(ret.data.create_order.metadata.length, 0)
    assert.equal(ret.data.create_order.status, 'created')
    assert.equal(ret.data.create_order.__typename, 'Order')
  } catch (e) {
    console.log(e)
    console.log(e.networkError.result.errors)
  }
}).timeout(0)

test('mutation: pay_order', async ({ assert }) => {
  try {
    const ret = await apollo.mutate({
      mutation: gql`
        mutation($order: String!) {
          pay_order(order: $order) {
            id
            amount
            amount_returned
            charge
            currency
            customer
            email
            items {
              amount
              currency
              description
              parent
              quantity
              type
            }
            livemode
            metadata {
              key
              value
            }
            status
          }
        }
        `,
      variables: {
        order: orderId
      }
    })
    assert.equal(ret.data.pay_order.id, orderId)
    assert.equal(ret.data.pay_order.amount, 12500)
    assert.isNotOk(ret.data.pay_order.amount_returned)
    assert.isOk(ret.data.pay_order.charge)
    assert.equal(ret.data.pay_order.currency, 'usd')
    assert.isOk(ret.data.pay_order.customer)
    assert.equal(ret.data.pay_order.email, 'dan@example.com')
    assert.equal(ret.data.pay_order.items.length, 3)
    assert.equal(ret.data.pay_order.items[0].amount, 12500)
    assert.equal(ret.data.pay_order.items[0].currency, 'usd')
    assert.equal(ret.data.pay_order.items[0].description, 'Day pass')
    assert.equal(ret.data.pay_order.items[0].parent, 'member-5')
    assert.equal(ret.data.pay_order.items[0].quantity, 1)
    assert.equal(ret.data.pay_order.items[0].type, 'sku')
    assert.equal(ret.data.pay_order.items[0].__typename, 'OrderLineItem')
    assert.equal(ret.data.pay_order.items[1].amount, 0)
    assert.equal(ret.data.pay_order.items[1].currency, 'usd')
    assert.equal(ret.data.pay_order.items[1].description, 'Taxes (included)')
    assert.isNotOk(ret.data.pay_order.items[1].parent)
    assert.isNotOk(ret.data.pay_order.items[1].quantity)
    assert.equal(ret.data.pay_order.items[1].type, 'tax')
    assert.equal(ret.data.pay_order.items[1].__typename, 'OrderLineItem')
    assert.equal(ret.data.pay_order.items[2].amount, 0)
    assert.equal(ret.data.pay_order.items[2].currency, 'usd')
    assert.equal(ret.data.pay_order.items[2].description, 'Free shipping')
    assert.equal(ret.data.pay_order.items[2].parent, 'ship_free-shipping')
    assert.isNotOk(ret.data.pay_order.items[2].quantity)
    assert.equal(ret.data.pay_order.items[2].type, 'shipping')
    assert.equal(ret.data.pay_order.items[2].__typename, 'OrderLineItem')
    assert.equal(ret.data.pay_order.livemode, false)
    assert.equal(ret.data.pay_order.metadata.length, 0)
    assert.equal(ret.data.pay_order.status, 'paid')
    assert.equal(ret.data.pay_order.__typename, 'Order')
  } catch (e) {
    console.log(e)
    console.log(e.networkError.result.errors)
  }
}).timeout(0)

test('mutation: delete_customer', async ({ assert }) => {
  try {
    const ret = await apollo.mutate({ mutation: gql`mutation { delete_customer }` })
    assert.equal(ret.data.delete_customer, 'ok')
  } catch (e) {
    console.log(e)
    console.log(e.networkError.result.errors)
  }
}).timeout(0)
