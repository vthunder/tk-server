'use strict'

const Schema = use('Schema')

class PassesSchema extends Schema {
  up () {
    this.create('passes', (table) => {
      table.increments()
      table.string('token').unique()
      table.string('type').defaultsTo('day_pass') // or 'class'
      table.string('order_id') // Stripe object ID
      table.integer('user_id').unsigned().index()
      table.foreign('user_id').references('id').on('users').onDelete('cascade')
      table.string('email')
      table.string('status').defaultsTo('new') // 'used' once consumed
      table.text('memo')
      table.timestamps()
    })
  }

  down () {
    this.drop('passes')
  }
}

module.exports = PassesSchema
