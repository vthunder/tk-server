'use strict'

const Schema = use('Schema')

class TastingStationInfoSchema extends Schema {
  up () {
    this.create('tasting_station_infos', (table) => {
      table.increments()
      table.string('date')
      table.integer('station')
      table.string('generic_name')
      table.string('survey_url')
      table.timestamps()
    })
  }

  down () {
    this.drop('tasting_station_infos')
  }
}

module.exports = TastingStationInfoSchema
