'use strict'

const Model = use('Model')

class OrderItem extends Model {
  order () {
    return this.belongsTo('App/Models/Order')
  }
  product () {
    return this.belongsTo('App/Models/Product')
  }
}

module.exports = OrderItem
