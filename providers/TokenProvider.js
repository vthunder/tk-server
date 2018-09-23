'use strict'

const { ServiceProvider } = require('@adonisjs/fold')
const StringMask = use('string-mask')

class TokGen {
  constructor(app) {
    const Config = app.use('Adonis/Src/Config')
    const chars = Config.get('app.daypass.tokenChars')
    this._gen = require('rand-token').generator({ chars })
    this._length = Config.get('app.daypass.tokenLength')
    this._mask = Config.get('app.daypass.tokenMask')
  }
  generate() {
    const tok = this._gen.generate(this._length)
    return StringMask.apply(tok, this._mask)
  }
}

class TokenProvider extends ServiceProvider {
  /**
   * Register namespaces to the IoC container
   *
   * @method register
   *
   * @return {void}
   */
  register () {
    this.app.singleton('TK/Token', (app) => { return new TokGen(app) })
  }

  /**
   * Attach context getter when all providers have
   * been registered
   *
   * @method boot
   *
   * @return {void}
   */
  boot () {
    //
  }
}

module.exports = TokenProvider
