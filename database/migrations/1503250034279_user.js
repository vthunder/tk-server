'use strict'

const Schema = use('Schema')

class UserSchema extends Schema {
  up () {
    this.create('users', (table) => {
      table.increments()
      table.string('name', 80).notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('password', 60).notNullable()
      table.string('account_status', 60)
      table.string('stripe_id').unique()
      table.string('previous_stripe_ids').defaultTo('[]')
      table.bool('is_member').defaultTo(0)
      table.datetime('last_member_check')
      table.date('free_membership_start')
      table.date('free_membership_end')
      table.string('free_membership_type').defaultTo('')
      table.string('qr_token')
      table.timestamps()
    })
  }

  down () {
    this.drop('users')
  }
}

module.exports = UserSchema
