'use strict'

const Schema = use('Schema')

class UserAgreedTermsSchema extends Schema {
  up () {
    this.create('user_agreed_terms', (table) => {
      table.increments()
      table.string('name')
      table.string('email')
      table.integer('user_id')
      table.string('terms_name')
      table.datetime('agreed_timestamp')
      table.timestamps()
    })
  }

  down () {
    this.drop('user_agreed_terms')
  }
}

module.exports = UserAgreedTermsSchema
