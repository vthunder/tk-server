'use strict'

const Model = use('Model')
const Stripe = use('TK/Stripe')

class Order extends Model {
  static get computed() {
    return ['items'];
  }

  user () {
    return this.belongsTo('App/Models/User')
  }

  items () {
    return this.hasMany('App/Models/OrderItem')
  }

  charges () {
    return this.hasMany('App/Models/Charge')
  }

  async _createChargeLog({ id, status, error }) {
    return await this.charges().create({ amount: this.total,
                                   status: status,
                                   error: error,
                                   method: 'stripe',
                                   stripe_id: id })
  }

  async _createCharge(meta) {
    let ret;
    try {
      ret = await Stripe.charges.create(meta)
    } catch (e) {
      ret = { status: 'failed', error: err }
    }
    await this._createChargeLog(ret)
    return ret
  }

  async charge(user, payment_source) {
    let chargeReq = { amount: this.total, currency: 'usd' }

    if (payment_source.token) {
      if (!payment_source.save_source) {
        // one-time payment without saving source - do it and return
        return await this._createCharge({ source: payment_source.token, ...chargeReq })

      }
      try {
        if (user.stripe_id) {
          // Stripe customer already exists, add payment source
          await user.addStripeSource(payment_source.token)

        } else {
          // Create new Stripe customer and save source
          await user.createStripeId(payment_source.token)
        }
      } catch (e) {
        return { status: 'failed', error: e }
      }
    }

    // We're charging the user's saved card (just added or otherwise)
    // so make sure we have a saved Stripe customer ID and charge it

    if (!user.stripe_id) throw 'No Stripe ID set for this user'
    return await this._createCharge({ customer: user.stripe_id, ...chargeReq })
  }
}

module.exports = Order
