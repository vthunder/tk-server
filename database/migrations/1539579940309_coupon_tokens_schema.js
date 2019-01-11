'use strict'

const Schema = use('Schema')

class CouponTokenSchema extends Schema {
  up () {
    this.create('coupon_tokens', (table) => {
      table.increments()
      table.string('type').notNullable().defaultTo('ks_month') // or ks_year, staff, ...
      table.string('token').notNullable()
      table.string('status').notNullable().defaultTo('new') // or used
      table.integer('user_id')
      table.integer('claimed_by')
      table.string('sent_to')
      table.integer('amount')
      table.integer('amount_remaining')
      table.string('order_id')
      table.timestamps()
    })
  }

  down () {
    this.drop('coupon_tokens')
  }
}

module.exports = CouponTokenSchema
