'use strict'

const Schema = use('Schema')

class BookingsSchema extends Schema {
  up () {
    this.create('bookings', (table) => {
      table.increments()
      table.integer('user_id').unsigned().index()
      table.foreign('user_id').references('id').on('users').onDelete('cascade')
      table.string('email')
      table.integer('calendar_event_id').unsigned().index()
      table.foreign('calendar_event_id').references('id').on('calendar_events').onDelete('cascade')
      table.timestamps()
    })
  }

  down () {
    this.drop('bookings')
  }
}

module.exports = BookingsSchema
