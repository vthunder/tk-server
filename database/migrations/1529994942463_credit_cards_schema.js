'use strict'

const Schema = use('Schema')

class CreditCardsSchema extends Schema {
  up () {
    this.create('credit_cards', (table) => {
      table.increments()
      table.integer('user_id').unsigned().index()
      table.foreign('user_id').references('id').on('users').onDelete('cascade')
      table.string('stripe_id')
      table.string('brand')
      table.string('last_four')
      table.integer('exp_month')
      table.integer('exp_year')
      table.timestamps()
    })
  }

  down () {
    this.drop('credit_cards')
  }
}

module.exports = CreditCardsSchema
