'use strict'

const Model = use('Model')

class Coupon extends Model {
  async checkValidity() {
    this.valid = true // fixme
    await this.save()
  }
  async calculateAmount(subtotal) {
    await this.checkValidity()
    if (this.valid) {
      if (this.amount_off) return this.amount_off
      if (this.percent_off) return Math.round(subtotal * this.percent_off)
    }
    return 0
  }
}

module.exports = Coupon
