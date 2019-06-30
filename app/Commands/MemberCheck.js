'use strict'

const { Command } = require('@adonisjs/ace')
const Database = use('Database')
const User = use('App/Models/User')
const Stripe = use('TK/Stripe')

class MemberCheck extends Command {
  static get signature () {
    return 'tk:member-check'
  }

  static get description () {
    return 'Sync membership status with Stripe'
  }

  async handle (args, options) {
    const users = await User.all()
    for (let u of users.rows) {
      const ret = await u.stripe_check()
    }
    Database.close()
  }
}

module.exports = MemberCheck
