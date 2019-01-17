'use strict'

const moment = use('moment')
const Model = use('Model')

class CalendarEventMaster extends Model {
  static get computed() {
    return ['events', 'next_event']
  }

  events() {
    return this.hasMany('App/Models/CalendarEvent', 'id', 'master_id')
  }

  async load_events() {
    const events = await this.events().fetch()
    this._events = await Promise.all(events.rows.map(async (e) => {
      await e.load_master()
      return {
        id: e.id,
        status: e.status,
        start: e.getStart(),
        duration: e.getDuration(),
        all_day: e.getAllDay(),
        sku_id: e.sku_id,
      }
    }))
  }

  getEvents() {
    return this._events || []
  }

  getNextEvent() {
    return (this._events || [])
      .filter(e => moment(e.start).isAfter())[0] || {}
  }
}

module.exports = CalendarEventMaster
