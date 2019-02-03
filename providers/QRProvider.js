'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

class QRService {
  constructor(app) {
  }
  async parse(User, CouponToken, code) {
    const found = code.match('https:\/\/tinkerkitchen.org\/qr\/(user|token)/(.*)$')
    if (found && found[1] === 'user') {
      const user = await User.findBy('qr_token', found[2])
      if (user) {
        return {
          type: 'user',
          name: user.name,
          email: user.email,
          agreed_terms: user.agreed_terms,
        }
      }
    } else if (found && found[1] === 'token') {
      const coupon = await CouponToken.findBy('token', found[2])
      if (coupon) {
        return { type: coupon.type, status: coupon.status }
      }
    }
    return { type: 'invalid' }
  }
}

class QRProvider extends ServiceProvider {
  register () {
    this.app.singleton('TK/QR', (app) => { return new QRService(app) })
  }
  boot () {}
}

module.exports = QRProvider
