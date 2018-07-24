'use strict'

const Model = use('Model')

class User extends Model {
  static boot () {
    super.boot()
    this.addHook('beforeSave', 'UserHook.hashPassword')
  }

  static get computed() {
    return ['is_member', 'membership_sub']
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

  creditCards () {
    return this.hasMany('App/Models/CreditCard')
  }

  getIsMember() {
    if (this.getMembershipSub()) return true
    return false
  }

  async getMembershipSub() {
    let sub
    await this.subscriptions().forEach((s) => {
      if (s.name === 'membership') {
        sub = s
      }
    })
    return sub
  }

  static get traits() {
    return [
      '@provider:Adonis/Acl/HasRole',
      '@provider:Adonis/Acl/HasPermission'
    ]
  }
}

module.exports = User
