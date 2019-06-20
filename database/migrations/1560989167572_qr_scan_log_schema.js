'use strict'

const Schema = use('Schema')

class QrScanLogSchema extends Schema {
  up () {
    this.create('qr_scan_logs', (table) => {
      table.increments()
      table.string('qr_data')
      table.string('qr_token_id')
      table.string('qr_token_status')
      table.timestamps()
    })
  }

  down () {
    this.drop('qr_scan_logs')
  }
}

module.exports = QrScanLogSchema
