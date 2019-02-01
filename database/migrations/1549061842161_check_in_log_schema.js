'use strict'

const Schema = use('Schema')

class CheckInLogSchema extends Schema {
  up () {
    this.create('check_in_logs', (table) => {
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
