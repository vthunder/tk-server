'use strict'

const Schema = use('Schema')

class OrderItemsSchema extends Schema {
  up () {
    this.create('order_items', (table) => {
      table.increments()
      table.integer('order_id').unsigned().index()
      table.foreign('order_id').references('id').on('orders').onDelete('cascade')
      table.integer('product_id').unsigned().index()
      table.foreign('product_id').references('id').on('products').onDelete('restrict')
      table.integer('qty').notNullable().defaultsTo(1)
      table.timestamps()
    })
  }

  down () {
    this.drop('order_items')
  }
}

module.exports = OrderItemsSchema
