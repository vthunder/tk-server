'use strict'

const Model = use('Model')
const moment = use('moment')

class Product extends Model {
  categories () {
    return this.belongsToMany('App/Models/Category')
  }

  getCreatedAt() {
    return moment(this.created_at).format('YYYY-MM-DD HH:mm:ss');
  }

  getUpdatedAt() {
    return moment(this.updated_at).format('YYYY-MM-DD HH:mm:ss');
  }
}

module.exports = Product
