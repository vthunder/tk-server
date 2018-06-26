'use strict'

const Model = use('Model')

class Category extends Model {
  products () {
    return this.belongsToMany('App/Models/Product')
  }
}

module.exports = Category
