'use strict'

const Schema = use('Schema')

class OrdersSchema extends Schema {
  up () {
    this.create('orders', (table) => {
      table.increments()
      table.integer('user_id').unsigned().index()
      table.foreign('user_id').references('id').on('users').onDelete('cascade')
      table.integer('item_subtotal').notNullable()
      table.integer('shipping').notNullable()
      table.integer('handling').notNullable()
      table.integer('tax').notNullable()
      table.integer('adjustment')
      table.integer('total').notNullable()
      table.text('comment')
      table.timestamps()
    })
  }

  down () {
    this.drop('orders')
  }
}

module.exports = OrdersSchema
