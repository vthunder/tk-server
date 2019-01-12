'use strict'

const Schema = use('Schema')

class CalendarEventsSchema extends Schema {
  up () {
    this.create('calendar_events', (table) => {
      table.increments()
      table.string('status').defaultTo('open').notNullable()
      table.boolean('calendar_hide')
      table.string('sku_id')
      table.string('member_discount_id')
      table.string('title', 254)
      table.string('slug', 254)
      table.string('image_header', 254)
      table.boolean('is_all_day')
      table.datetime('start').notNullable()
      table.float('duration')
      table.text('description')
      table.string('category', 80) // class, meetup, talk, private
      table.integer('price')
      table.integer('member_price')
      table.string('ext_book_text')
      table.string('ext_book_url')
      table.string('ext_member_discount_code')
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
