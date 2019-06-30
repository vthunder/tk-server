'use strict'

const Model = use('Model')
const User = use('App/Models/User')

class QrToken extends Model {
  static get computed() {
    return ['name', 'email', 'user_status', 'purchase_name', 'purchase_email', 'membership_status']
  }

  async load() {
    if (this.user_id) {
      this._user = await User.find(this.user_id)
    }
    if (this.purchased_by_user_id) {
      this._purchase_user = await User.find(this.purchased_by_user_id)
    }
  }

  getName() {
    if (!this._user) return null
    return this._user.name
  }

  getEmail() {
    if (!this._user) return null
    return this._user.email
  }

  getUserStatus() {
    if (!this._user) return null
    return this._user.user_status
  }

  getPurchaseName() {
    if (!this._purchase_user) return null
    return this._purchase_user.name
  }

  getPurchaseEmail() {
    if (!this._purchase_user) return null
    return this._puchase_user.email
  }

  getMembershipStatus() {
    if (!this._user) return null;
    return this._user.getIsMemberEq()
  }
}

module.exports = QrToken
