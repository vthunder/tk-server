'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

class AuthService {
  constructor(app) {
  }
  async getUser(auth) {
    try {
      return await auth.getUser()
    } catch (e) {
      return null
    }
  }
  async requireUser(auth) {
    return await auth.getUser()
  }
}

class AuthProvider extends ServiceProvider {
  register () {
    this.app.singleton('TK/Auth', (app) => { return new AuthService(app) })
  }
  boot () {}
}

module.exports = AuthProvider
