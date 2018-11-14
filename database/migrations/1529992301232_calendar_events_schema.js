'use strict'

const Schema = use('Schema')

class CalendarEventsSchema extends Schema {
  up () {
    this.create('calendar_events', (table) => {
      table.increments()
      table.string('sku_id')
      table.string('member_sku_id')
      table.string('title', 254).notNullable()
      table.string('header_image', 254).defaultsTo('/images/default-class-header.jpg')
      table.boolean('is_all_day').defaultsTo(false)
      table.datetime('start').notNullable()
      table.float('duration')
      table.text('description')
      table.string('category', 80).notNullable().defaultsTo('class') // class, meetup, talk, private
      table.integer('price')
      table.integer('member_price')
      table.string('ext_book_url')
      table.string('ext_member_discount_code')
      table.integer('max_size').defaultsTo(20)
      table.timestamps()
    })
  }

  down () {
    this.drop('calendar_events')
  }
}

module.exports = CalendarEventsSchema
