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

Route.get('/ical', async ({ response }) => {
  response.header('Content-type', 'text/calendar')

  let events = await CalendarEvent.all()
  for (let n = 0; n < events.rows.length; n++) {
    await events.rows[n].load_master()
  }

  let processed_events = events.toJSON()
      .filter(e => !e.calendar_hide)
      .map((e) => {
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
})

Route.get('/ical/closed', async ({ response }) => {
  response.header('Content-type', 'text/calendar')

  let events = await CalendarEvent.query()
      .where('category', '=', 'private')
      .orWhere('category', '=', 'special')
      .fetch()
  for (let n = 0; n < events.rows.length; n++) {
    await events.rows[n].load_master()
  }

  let processed_events = events.toJSON()
      .filter(e => !e.calendar_hide)
      .map((e) => {
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
})
