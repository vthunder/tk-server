'use strict'

const moment = use('moment')
const Model = use('Model')
const Stripe = use('TK/Stripe')

class User extends Model {
  static boot () {
    super.boot()
    this.addHook('beforeSave', 'UserHook.hashPassword')
  }

  // FIXME: currently unused
  static get dates () {
    return super.dates.concat(['last_member_check'])
  }

  static get computed() {
    return ['has_stripe_customer']
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

  passes () {
    return this.hasMany('App/Models/Pass')
  }

  getHasStripeCustomer() {
    if (this.stripe_id) return true
    return false
  }

  async member_check() {
    try {
      const ts = moment(this.last_member_check)
      const now = moment(Date.now())

      if (this.last_member_check && ts.add(12, 'hours').isAfter(now)) {
        return;
      }

      this.last_member_check = now.format("YYYY-MM-DD HH:mm:ss")
      this.is_member = false

      if (this.stripe_id) {
        let customer = await Stripe.customers.retrieve(this.stripe_id)
        if (customer &&
            customer.subscriptions &&
            customer.subscriptions.data &&
            customer.subscriptions.data.length > 0) {
          const subs = customer.subscriptions.data
                .filter(s => s.plan.nickname.match(/(Monthly|Yearly) membership/))
          if (subs.length) this.is_member = true
        }
      }
      await this.save()
    } catch (e) {
      console.log(`Error checking member status from Stripe: ${e}`)
    }
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
