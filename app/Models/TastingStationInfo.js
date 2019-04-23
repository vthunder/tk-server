'use strict'

const Model = use('Model')
const TastingInfo = use('App/Models/TastingInfo')

class TastingStationInfo extends Model {
  static get computed() {
    return ['products']
  }

  async load_products() {
    this._products = []
    const products = await TastingInfo.query()
          .where('date', '=', this.date)
          .andWhere('station', '=', this.station)
          .fetch()
    if (!products.rows) return
    this._products = products.rows.map((p) => ({
      product_code: p.product_code,
      product_name: p.product_name,
    }))
  }

  getProducts() {
    return this._products || []
  }
}

module.exports = TastingStationInfo
