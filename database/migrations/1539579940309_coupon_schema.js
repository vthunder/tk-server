'use strict'

const Schema = use('Schema')

class CouponTokenSchema extends Schema {
  up () {
    this.create('coupon_tokens', (table) => {
      table.increments()
      table.string('type').notNullable().defaultTo('monthly_member') // or yearly_member
      table.string('token').notNullable()
      table.string('status').notNullable().defaultTo('new') // or used
      table.integer('claimed_by')
      table.timestamps()
    })
  }

  down () {
    this.drop('coupon_tokens')
  }
}

module.exports = CouponTokenSchema
