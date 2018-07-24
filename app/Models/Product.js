'use strict'

const Model = use('Model')
const moment = use('moment')

class Product extends Model {
  categories () {
    return this.belongsToMany('App/Models/Category')
  }

  static get computed() {
    return ['member_discount_available', 'list_unit_price', 'member_unit_price']
  }

  getMemberDiscountAvailable() {
    if (this.member_price &&
        this.member_price !== this.price) {
      return true
    }
    return false
  }

  _formatPrice(cents) {
    let dollars = (cents / 100) / this.bundled_units
    return dollars.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  }

  getListUnitPrice() {
    return this._formatPrice(this.price)
  }

  getMemberUnitPrice() {
    return this._formatPrice(this.member_price ? this.member_price : this.price)
  }

  getCreatedAt() {
    return moment(this.created_at).format('YYYY-MM-DD HH:mm:ss');
  }

  getUpdatedAt() {
    return moment(this.updated_at).format('YYYY-MM-DD HH:mm:ss');
  }
}

module.exports = Product
