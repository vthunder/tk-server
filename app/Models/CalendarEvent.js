'use strict'

const Model = use('Model')
const moment = use('moment')

class CalendarEvent extends Model {
  // camelcase props for json -> graphql api
  static get computed() {
    return ['allDay', 'memberPrice'];
  }
  getAllDay() {
    return this.is_all_day;
  }
  getMemberPrice() {
    return this.member_price;
  }

  getStart() {
    return moment(this.start).format('YYYY-MM-DD HH:mm:ss');
  }

  getEnd() {
    return moment(this.start).format('YYYY-MM-DD HH:mm:ss');
  }
}

module.exports = CalendarEvent
