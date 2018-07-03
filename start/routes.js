'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.0/routing
|
*/

const Route = use('Route')
const GraphQLServer = use('Adonis/Addons/GraphQLServer')

// Route.get('/', ({ request }) => {
//   return { greeting: 'Hello world in JSON' }
// })

Route.route('/', (context) => {
  return GraphQLServer.handle(context, { debug: false })
}, ['GET', 'POST'])

Route.get('/graphiql', (context) => {
  return GraphQLServer.handleUI(context, { endpointURL: '/' })
})
