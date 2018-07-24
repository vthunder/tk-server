'use strict'

const Model = use('Model')
const moment = use('moment')

class CalendarEvent extends Model {
  // camelcase props for json -> graphql api
  static get computed() {
    return ['all_day', 'end'];
  }

  getAllDay() {
    return this.is_all_day
  }

  getStart() {
    return moment(this.start).format('YYYY-MM-DD HH:mm:ss')
  }

  getEnd() {
    if (this.is_all_day) {
      return null
    } else {
      return moment(this.start)
        .add(this.duration, 'hours')
        .format('YYYY-MM-DD HH:mm:ss')
    }
  }
}

module.exports = CalendarEvent
