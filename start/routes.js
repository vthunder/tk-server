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
const moment = use('moment')

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

  let processed_events = events.toJSON().filter(e => !e.calendar_hide).map((e) => {
    delete e.status
    e.summary = e.title
    // FIXME: gross hack because I cannot figure out proper timezone support
    e.start = moment(e.start).subtract(1, 'hour').format()
    e.end = moment(e.end).subtract(1, 'hour').format()
    return e
  })

  return ical({
    name: 'Tinker Kitchen',
    domain: 'tinkerkitchen.org',
    timezone: 'America/Los_Angeles',
    events: processed_events,
  }).toString();
}, ['GET'])

Route.route('/ical/closed', async (context) => {
  let events = await CalendarEvent.query()
      .where('category', '=', 'private')
      .orWhere('category', '=', 'special')
      .fetch()
  const masters = await CalendarEventMaster.all()
  const default_master_id = Config.get('app.default_event_master_id')

  for (let n = 0; n < events.rows.length; n++) {
    const id = events.rows[n].master_id || default_master_id
    const master = masters.rows.filter(m => m.id === id)
    events.rows[n].master = master[0]
  }

  let processed_events = events.toJSON().filter(e => !e.calendar_hide).map((e) => {
    delete e.status
    e.summary = e.title
    // FIXME: gross hack because I cannot figure out proper timezone support
    e.start = moment(e.start).subtract(1, 'hour').format()
    e.end = moment(e.end).subtract(1, 'hour').format()
    return e
  })

  return ical({
    name: 'Tinker Kitchen - Closed',
    domain: 'tinkerkitchen.org',
    timezone: 'America/Los_Angeles',
    events: processed_events,
  }).toString();
}, ['GET'])
