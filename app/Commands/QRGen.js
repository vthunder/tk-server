'use strict'

const { Command } = require('@adonisjs/ace')
const Database = use('Database')
const User = use('App/Models/User')
const QrToken = use('App/Models/QrToken')
const Token = use('TK/Token')

class QRGen extends Command {
  static get signature () {
    return 'tk:qr-gen'
  }

  static get description () {
    return 'Generate QR codes for user check in'
  }

  async handle (args, options) {
    const users = await User.all();
    for (let u of users.rows) {
      const qr = await QrToken.findBy('user_id', u.id);
      if (!qr) {
        QrToken.create({
          token: Token.generate(),
          type: 'user',
          user_id: u.id,
        });
      }
    }
    Database.close()
  }
}

module.exports = QRGen
