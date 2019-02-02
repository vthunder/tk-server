const { hooks } = require('@adonisjs/ignitor')

hooks.after.httpServer(() => {
  const Server = use('Server')
  const { execute, subscribe } = require('graphql')
  const { SubscriptionServer } = require('subscriptions-transport-ws')
  const GraphQLServer = use('Adonis/Addons/GraphQLServer')

  let server = Server.getInstance()
  new SubscriptionServer({
    execute,
    subscribe,
    schema: GraphQLServer.$schema
  },
  {
    server,
    path: '/api/subscriptions',
  })
})
