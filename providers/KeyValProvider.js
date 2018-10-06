'use strict'

const { ServiceProvider } = require('@adonisjs/fold')
const _ = use('lodash')

class KeyValService {
  constructor(app) {
  }
  mapField(field) {
    return Object.keys(field).map(k => ({ key: k, value: field[k] }))
  }
  mapObject(object, attributes) {
    let obj = _.cloneDeep(object)
    attributes.forEach((attr) => {
      _.set(obj, attr, this.mapField(_.get(obj, attr, [])))
    })
    return obj
  }
  mapArray(array, attributes) {
    return array.map(obj => this.mapObject(obj, attributes))
  }
}

class KeyValProvider extends ServiceProvider {
  register () {
    this.app.singleton('TK/KeyVal', (app) => { return new KeyValService(app) })
  }
  boot () {}
}

module.exports = KeyValProvider
