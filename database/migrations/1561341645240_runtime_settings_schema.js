'use strict'

const Schema = use('Schema')

class RuntimeSettingsSchema extends Schema {
  up () {
    this.create('runtime_settings', (table) => {
      table.increments()
      table.string('key')
      table.string('val')
      table.timestamps()
    })
  }

  down () {
    this.drop('runtime_settings')
  }
}

module.exports = RuntimeSettingsSchema
