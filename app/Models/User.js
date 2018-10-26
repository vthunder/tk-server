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
    return ['has_stripe_customer', 'has_previous_stripe_ids',
            'is_free_member', 'free_member_until', 'free_membership_type']
  }

  static get traits() {
    return [
      '@provider:Adonis/Acl/HasRole',
      '@provider:Adonis/Acl/HasPermission'
    ]
  }

  /**
   *
   * Relationships
   *
   */

  // Auth tokens, for 'refreshTokens' & 'rememberToken' features
  tokens () {
    return this.hasMany('App/Models/Token')
  }

  // Day passes
  passes () {
    return this.hasMany('App/Models/Pass')
  }

  /**
   *
   * Getters/Setters
   *
   */

  getHasStripeCustomer() {
    if (this.stripe_id) return true
    return false
  }

  getHasPreviousStripeIds() {
    if (JSON.parse(this.previous_stripe_ids).length > 0) return true
    return false
  }

  getIsFreeMember() { return this.has_free_membership() }

  getFreeMemberUntil() { return moment(this.free_membership_end).format('X') }

  getFreeMembershipType() {
    if (!this.has_free_membership()) return ''
    return this.free_membership_type
  }

  /**
   *
   * Other instance methods
   *
   */

  async give_free_membership(length, type) {
    if (!length.match(/^(month|year)$/)) throw 'Invalid free membership length'

    this.free_membership_type = type
    let start = moment()
    let end

    if (this.has_free_membership()) {
      end = moment(this.free_membership_end)
    } else {
      this.free_membership_start = moment().format('YYYY-MM-DD')
      end = moment().add(1, 'days') // bonus extra day!
    }

    if (length === 'month') end = end.add(1, 'months')
    if (length === 'year') end = end.add(1, 'years')

    this.free_membership_end = end.format('YYYY-MM-DD')
    await this.save()
  }

  has_free_membership() {
    const now = moment()
    if (now.isBetween(this.free_membership_start, this.free_membership_end)) return true
    return false
  }

  async stripe_check() {
    const ts = moment(this.last_member_check)
    const now = moment(Date.now())

    if (this.last_member_check && ts.add(12, 'hours').isAfter(now)) {
      return;
    }

    await this.deleted_customer_check()
    this.is_member = await this.member_check()
    this.last_member_check = now.format("YYYY-MM-DD HH:mm:ss")

    await this.save()
  }

  async member_check() {
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

  // check whether the customer has been deleted on the Stripe end,
  // even though we have a local stripe_id saved
  async deleted_customer_check() {
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

  async add_previous_stripe_id(id) {
    const prev_ids = JSON.parse(this.previous_stripe_ids)
    this.previous_stripe_ids = JSON.stringify(prev_ids.push(id))
    await this.save()
  }
}

module.exports = User
