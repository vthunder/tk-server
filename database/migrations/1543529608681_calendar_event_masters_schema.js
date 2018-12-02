'use strict'

const Schema = use('Schema')

class CalendarEventMastersSchema extends Schema {
  up () {
    this.create('calendar_event_masters', (table) => {
      table.increments()
      table.string('sku_id')
      table.string('member_sku_id')
      table.string('member_discount_id')
      table.string('title', 254).notNullable()
      table.string('header_image', 254).defaultsTo('/images/default-class-header.jpg')
      table.boolean('is_all_day').defaultsTo(false)
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
    this.alter('calendar_events', (table) => {
      table.integer('calendar_event_master_id').unsigned().index()
      table.foreign('calendar_event_master_id').references('id').on('calendar_event_masters').onDelete('cascade')
    })
  }

  down () {
    this.alter('calendar_events', (table) => {
      table.dropForeign('calendar_event_master_id')
      table.dropColumn('calendar_event_master_id')
    })
    this.drop('calendar_event_masters')
  }
}

module.exports = CalendarEventMastersSchema
