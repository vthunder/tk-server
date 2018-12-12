'use strict'

const Schema = use('Schema')

class GiftCertificatesSchema extends Schema {
  up () {
    this.create('gift_certificates', (table) => {
      table.increments()
      table.string('status').defaultTo('new')
      table.string('email')
      table.integer('user_id')
      table.integer('amount')
      table.integer('coupon_id')
      table.string('order_id')
      table.timestamps()
    })
  }

  down () {
    this.drop('gift_certificates')
  }
}

module.exports = GiftCertificatesSchema
