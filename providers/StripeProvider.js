'use strict'

const { ServiceProvider } = require('@adonisjs/fold')
const Stripe = use('stripe')

class StripeProvider extends ServiceProvider {
  /**
   * Register namespaces to the IoC container
   *
   * @method register
   *
   * @return {void}
   */
  register () {
    this.app.singleton('TK/Stripe', (app) => {
      const Config = app.use('Adonis/Src/Config')
      const api_key = Config.get('app.stripe.secretApiKey')
      return Stripe(api_key)
    })
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

module.exports = StripeProvider
