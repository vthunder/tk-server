'use strict'

const Schema = use('Schema')

class QrTokenSchema extends Schema {
  up () {
    this.create('qr_tokens', (table) => {
      table.increments()
      table.string('token')
      table.string('type')
      table.integer('user_id')
      table.integer('purchased_by_user_id')
      table.string('purchased_by_email')
      table.timestamps()
    })
  }

  down () {
    this.drop('qr_tokens')
  }
}

module.exports = QrTokenSchema
