'use strict'

const Model = use('Model')

class CreditCard extends Model {
  user () {
    return this.belongsTo('App/Models/User')
  }
}

module.exports = CreditCard