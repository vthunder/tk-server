'use strict'

const Schema = use('Schema')

class CalendarEventMastersSchema extends Schema {
  up () {
    this.create('calendar_event_masters', (table) => {
      table.increments()
      table.string('sku_id')
      table.boolean('featured').defaultsTo(false)
      table.boolean('calendar_hide')
      table.string('title', 254).notNullable()
      table.string('slug', 254).notNullable()
      table.string('image_header', 254).defaultsTo('/images/default-class-header.jpg')
      table.boolean('is_all_day').defaultsTo(false)
      table.float('duration')
      table.text('description')
      table.string('category', 80).notNullable().defaultsTo('class') // class, meetup, talk, private
      table.integer('price')
      table.integer('member_price')
      table.integer('max_size').defaultsTo(10)
      table.string('ext_book_text')
      table.string('ext_book_url')
      table.string('ext_member_discount_code')
      table.text('sidebar_pre_text')
      table.text('sidebar_post_text')
      table.boolean('show_interested').defaultsTo(true)
      table.timestamps()
    })
    this.alter('calendar_events', (table) => {
      table.integer('master_id').unsigned().index()
      table.foreign('master_id').references('id').on('calendar_event_masters').onDelete('cascade')
    })
  }

  down () {
    this.alter('calendar_events', (table) => {
      table.dropForeign('master_id')
      table.dropColumn('master_id')
    })
    this.drop('calendar_event_masters')
  }
}

module.exports = CalendarEventMastersSchema
