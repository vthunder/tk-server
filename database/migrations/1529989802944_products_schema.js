'use strict'

const Schema = use('Schema')

class ProductsSchema extends Schema {
  up () {
    this.create('products', (table) => {
      table.increments()
      table.string('title', 254).notNullable()
      table.text('description'),
      table.string('billing_description', 254),
      table.integer('price'), // in cents
      table.integer('member_price'), // discounted price in cents
      table.integer('bundled_units').defaultTo(1),
      table.string('unit').defaultTo('item'), // e.g., 'month', 'pass'
      table.boolean('is_subscription').defaultTo(false),
      table.string('subscription_period'), // 'monthly', 'yearly'
      table.string('subscription_name'), // internal name, e.g. 'membership'
      table.string('subscription_plan'), // specific Stripe plan name
      table.timestamps()
    })
  }

  down () {
    this.drop('products')
  }
}

module.exports = ProductsSchema
