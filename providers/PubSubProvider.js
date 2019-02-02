'use strict'

const { ServiceProvider } = require('@adonisjs/fold')
const GraphQLSub = use('graphql-subscriptions')

class PubSubProvider extends ServiceProvider {
  /**
   * Register namespaces to the IoC container
   *
   * @method register
   *
   * @return {void}
   */
  register () {
    this.app.singleton('TK/PubSub', (app) => {
      return new GraphQLSub.PubSub()
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

module.exports = PubSubProvider
