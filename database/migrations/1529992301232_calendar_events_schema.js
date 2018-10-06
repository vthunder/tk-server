'use strict'

const Schema = use('Schema')

class CalendarEventsSchema extends Schema {
  up () {
    this.create('calendar_events', (table) => {
      table.increments()
      table.string('sku_id')
      table.string('member_sku_id')
      table.string('title', 254).notNullable()
      table.boolean('is_all_day').defaultsTo(false)
      table.datetime('start').notNullable()
      table.float('duration')
      table.text('description')
      table.string('category', 80).notNullable().defaultsTo('class') // class, meetup, talk, private
      table.timestamps()
    })
  }

  down () {
    this.drop('calendar_events')
  }
}

module.exports = CalendarEventsSchema
