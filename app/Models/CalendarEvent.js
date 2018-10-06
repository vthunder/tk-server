'use strict'

const Stripe = use('TK/Stripe')
const Model = use('Model')
const moment = use('moment')

class CalendarEvent extends Model {
  // camelcase props for json -> graphql api
  static get computed() {
    return ['all_day', 'end'];
  }

  static get computed() {
    return ['sku', 'member_sku']
  }

  getSku() {
    try {
      return this._sku
      // return await Stripe.skus.retrieve(this.sku_id)
    } catch (e) {
      return null
    }
  }

  getMemberSku() {
    try {
      return this._member_sku
      // return await Stripe.skus.retrieve(this.member_sku_id)
    } catch (e) {
      return null
    }
  }

  async fetch_skus() {
    try {
      this._sku = await Stripe.skus.retrieve(this.sku_id)
      this._member_sku = await Stripe.skus.retrieve(this.member_sku_id)
    } catch (e) {
      this._sku = null
    }
  }

  getAllDay() {
    return this.is_all_day
  }

  getStart() {
    return moment(this.start).format('YYYY-MM-DD HH:mm:ss')
  }

  getEnd() {
    if (this.is_all_day) {
      return null
    } else {
      return moment(this.start)
        .add(this.duration, 'hours')
        .format('YYYY-MM-DD HH:mm:ss')
    }
  }
}

module.exports = CalendarEvent
