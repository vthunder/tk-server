'use strict'

const Schema = use('Schema')

class OrdersSchema extends Schema {
  up () {
    this.create('orders', (table) => {
      table.increments()
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
