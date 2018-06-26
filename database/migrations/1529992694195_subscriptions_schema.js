'use strict'

const Schema = use('Schema')

class SubscriptionsSchema extends Schema {
  up () {
    this.create('subscriptions', (table) => {
      table.increments()
      table.integer('user_id').unsigned().index()
      table.foreign('user_id').references('id').on('users').onDelete('restrict')
      table.string('name').notNullable()
      table.string('stripe_id').notNullable()
      table.string('stripe_plan').notNullable()
      table.integer('qty').notNullable()
      table.date('trial_ends_at')
      table.date('ends_at')
      table.timestamps()
    })
  }

  down () {
    this.drop('subscriptions')
  }
}

module.exports = SubscriptionsSchema
