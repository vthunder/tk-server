'use strict'

const Schema = use('Schema')

class ClassInterestSchema extends Schema {
  up () {
    this.create('class_interests', (table) => {
      table.increments()
      table.string('email')
      table.integer('master_id')
      table.string('class')
      table.timestamps()
    })
  }

  down () {
    this.drop('class_interests')
  }
}

module.exports = ClassInterestSchema
