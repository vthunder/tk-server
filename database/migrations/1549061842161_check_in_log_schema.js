'use strict'

const Schema = use('Schema')

class CheckInLogSchema extends Schema {
  up () {
    this.create('check_in_logs', (table) => {
      table.string('name')
      table.string('email')
      table.string('user_type')
      table.boolean('subscribe_to_list')
      table.string('qr_data')
      table.increments()
      table.timestamps()
    })
  }

  down () {
    this.drop('check_in_logs')
  }
}

module.exports = CheckInLogSchema
