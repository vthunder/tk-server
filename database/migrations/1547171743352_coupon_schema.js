'use strict'

const Schema = use('Schema')

class CouponSchema extends Schema {
  up () {
    this.create('coupons', (table) => {
      table.increments()
      table.string('code').notNullable()
      table.integer('amount_off')
      table.float('percent_off')
      table.string('duration')
      table.integer('duration_in_months')
      table.integer('max_redemptions')
      table.string('name')
      table.date('redeem_by')
      table.integer('times_redeemed')
      table.boolean('valid')
      table.text('conditions')
      table.timestamps()
    })
  }

  down () {
    this.drop('coupons')
  }
}

module.exports = CouponSchema
