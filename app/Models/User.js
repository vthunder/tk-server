'use strict'

const Model = use('Model')
const Stripe = use('TK/Stripe')

class User extends Model {
  static boot () {
    super.boot()
    this.addHook('beforeSave', 'UserHook.hashPassword')
  }

  static get dates () {
    return super.dates.concat(['last_member_check'])
  }

  static get computed() {
    return ['has_stripe_customer', 'is_member']
  }

  static get traits() {
    return [
      '@provider:Adonis/Acl/HasRole',
      '@provider:Adonis/Acl/HasPermission'
    ]
  }

  /**
   * A relationship on tokens is required for auth to
   * work. Since features like `refreshTokens` or
   * `rememberToken` will be saved inside the
   * tokens table.
   *
   * @method tokens
   *
   * @return {Object}
   */
  tokens () {
    return this.hasMany('App/Models/Token')
  }

  orders () {
    return this.hasMany('App/Models/Order')
  }

  subscriptions () {
    return this.hasMany('App/Models/Subscription')
  }

  async getHasStripeCustomer() {
    if (this.stripe_id) return true
    return false
  }

  async getIsMember() {
    if (this.stripe_id) {
      let customer = await Stripe.customers.retrieve(this.stripe_id)
      if (customer &&
          customer.subscriptions &&
          customer.subscriptions.data &&
          customer.subscriptions.data.length > 0) {
        for (let sub of customer.subscriptions.data) {
          if (sub.plan.nickname === 'Monthly membership' ||
              sub.plan.nickname === 'Yearly membership') {
            return true
          }
        }
      }
    }
    return false
  }

  // FIXME: these are currently unused

  async updateStripeSource(token) {
    if (!this.stripe_id) throw 'No Stripe ID set for this user'
    await Stripe.customers.update(this.stripe_id, { source: token })
  }

  async addStripeSource(token) {
    if (!this.stripe_id) throw 'No Stripe ID set for this user'
    await Stripe.customers.createSource(this.stripe_id, { source: token })
  }
}

module.exports = User
