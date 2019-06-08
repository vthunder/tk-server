'use strict'

const Schema = use('Schema')

class CalendarEventsSchema extends Schema {
  up () {
    this.create('calendar_events', (table) => {
      table.increments()
      table.string('status').defaultTo('open').notNullable()
      table.string('category', 80) // class, meetup, talk, private
      table.datetime('start').notNullable()
      table.float('duration')
      table.string('title', 254)
      table.string('slug', 254)
      table.string('image_header', 254)
      table.text('description')
      table.text('memo')
      table.boolean('is_all_day')
      table.string('sku_id')
      table.integer('price')
      table.integer('member_price')
      table.string('book_event_label')
      table.string('ext_book_url')
      table.string('ext_member_discount_code')
      table.boolean('calendar_hide')
      table.boolean('show_interested').defaultsTo(true)
      table.integer('max_size')
      table.timestamps()
    })
  }

  down () {
    this.drop('calendar_events')
  }
}

module.exports = CalendarEventsSchema
