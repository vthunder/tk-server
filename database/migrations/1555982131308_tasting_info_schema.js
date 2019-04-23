'use strict'

const Schema = use('Schema')

class TastingInfoSchema extends Schema {
  up () {
    this.create('tasting_infos', (table) => {
      table.string('date')
      table.integer('station')
      table.integer('product_code')
      table.string('product_name')
      table.increments()
      table.timestamps()
    })
  }

  down () {
    this.drop('tasting_infos')
  }
}

module.exports = TastingInfoSchema
