'use strict'

const Schema = use('Schema')

class CalendarEventsSchema extends Schema {
  up () {
    this.create('calendar_events', (table) => {
      table.increments()
      table.string('title', 254).notNullable()
      table.boolean('is_all_day').defaultsTo(false)
      table.datetime('start').notNullable()
      table.float('duration')
      table.text('description')
      table.string('category', 80).notNullable().defaultsTo('class') // class, meetup, talk, private
      table.integer('price').defaultsTo(0)
      table.integer('member_price')
      table.timestamps()
    })
  }

  down () {
    this.drop('calendar_events')
  }
}

module.exports = CalendarEventsSchema
