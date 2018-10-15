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
    return ['has_stripe_customer', 'has_previous_stripe_ids']
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

  getHasPreviousStripeIds() {
    if (JSON.parse(this.previous_stripe_ids).length > 0) return true
    return false
  }

  async stripe_check() {
    const ts = moment(this.last_member_check)
    const now = moment(Date.now())

    if (this.last_member_check && ts.add(12, 'hours').isAfter(now)) {
      return;
    }

    await this.customer_check()
    this.is_member = await this.member_check()
    this.last_member_check = now.format("YYYY-MM-DD HH:mm:ss")

    await this.save()
  }

  // check whether the customer has been deleted on the Stripe end,
  // even though we have a local stripe_id saved
  async customer_check() {
    if (this.stripe_id) {
      try {
        let customer = await Stripe.customers.retrieve(this.stripe_id)
        if (customer.deleted) {
          await this.add_previous_stripe_id(this.stripe_id)
          this.stripe_id = null
          await this.save()
        }
      } catch (e) {
        // Some other (perhaps transient network?) error, log but do nothing
        console.log(e)
      }
    }
  }

  async member_check() {
    const now = moment()
    if (now.isBetween(this.free_membership_start, this.free_membership_end)) return true

    if (this.stripe_id) {
      try {
        const subs = await Stripe.subscriptions.list({ customer: this.stripe_id })
        if (subs.data.length > 0) {
          const memberships = subs.data
                .filter(s => s.plan.nickname.match(/(Monthly|Yearly) membership/))
          if (memberships.length) return true
        }
      } catch (e) {
        console.log(`Error fetching subscriptions for ${this.email}: ${e}`)
      }
    }
    return false
  }

  async add_previous_stripe_id(id) {
    const prev_ids = JSON.parse(this.previous_stripe_ids)
    this.previous_stripe_ids = JSON.stringify(prev_ids.push(id))
    await this.save()
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
