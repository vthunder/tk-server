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

const ical = require('ical-generator');
const Route = use('Route')
const Config = use('Adonis/Src/Config')
const GraphQLServer = use('Adonis/Addons/GraphQLServer')
const CalendarEvent = use('App/Models/CalendarEvent')
const CalendarEventMaster = use('App/Models/CalendarEventMaster')

Route.route('/api', (context) => {
  return GraphQLServer.handle(context, { debug: false })
}, ['GET', 'POST'])

Route.route('/ical', async (context) => {
  let events = await CalendarEvent.all()
  const masters = await CalendarEventMaster.all()
  const default_master_id = Config.get('app.default_event_master_id')

  for (let n = 0; n < events.rows.length; n++) {
    const id = events.rows[n].master_id || default_master_id
    const master = masters.rows.filter(m => m.id === id)
    events.rows[n].master = master[0]
  }

  let processed_events = events.toJSON().map((e) => {
    delete e.status
    e.summary = e.title
    return e
  })

  return ical({
    domain: 'tinkerkitchen.org',
    events: processed_events,
  }).toString();
}, ['GET'])
