'use strict'

const { ServiceProvider } = require('@adonisjs/fold')
const Mailchimp = use('mailchimp-api-v3')

class MailchimpProvider extends ServiceProvider {
  /**
   * Register namespaces to the IoC container
   *
   * @method register
   *
   * @return {void}
   */
  register () {
    this.app.singleton('TK/Mailchimp', (app) => {
      const Config = app.use('Adonis/Src/Config')
      const api_key = Config.get('mail.mailchimp.apiKey')
      return new Mailchimp(api_key)
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

module.exports = MailchimpProvider
