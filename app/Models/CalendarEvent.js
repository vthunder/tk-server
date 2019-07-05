'use strict'

const Stripe = use('TK/Stripe')
const Config = use('Config')
const Model = use('Model')
const moment = use('moment')
const CalendarEventMaster = use('App/Models/CalendarEventMaster')

class CalendarEvent extends Model {
  static get computed() {
    return ['all_day', 'end']
  }

  master() {
    return this.belongsTo('App/Models/CalendarEventMaster', 'master_id')
  }

  async load_master() {
    this._master = await this.master().fetch()
  }

  _propMerge(prop) {
    if (!this._master) return this[prop]
    return this[prop] || this._master[prop]
  }

  getMasterId() { return this.master_id || Config.get('app.default_event_master_id') }
  getCalendarHide() { return this._propMerge('calendar_hide') }
  getTitle() { return this._propMerge('title') }
  getPageTitle() { return this._propMerge('page_title') }
  getSlug() { return this._propMerge('slug') }
  getImageHeader() { return this._propMerge('image_header') }
  getAllDay() { return this._propMerge('is_all_day') }
  getDuration() { return this._propMerge('duration') }
  getDescription() { return this._propMerge('description') }
  getCategory() { return this._propMerge('category') }
  getPrice() { return this._propMerge('price') }
  getMemberPrice() { return this._propMerge('member_price') }
  getMaxSize() { return this._propMerge('max_size') }
  getBookEventLabel() { return this._propMerge('book_event_label') }
  getExtBookUrl() { return this._propMerge('ext_book_url') }
  getExtMemberDiscountCode() { return this._propMerge('ext_member_discount_code') }
  getShowInterested() { return this._propMerge('show_interested') }
  getSidebarPreText() { return this._propMerge('sidebar_pre_text') }
  getSidebarPostText() { return this._propMerge('sidebar_post_text') }

  getStart() {
    return moment(this._propMerge('start')).format('YYYY-MM-DD HH:mm:ss')
  }

  getEnd() {
    if (this._propMerge('is_all_day')) {
      return moment(this._propMerge('start')).endOf('day')
    } else {
      return moment(this._propMerge('start'))
        .add(this._propMerge('duration'), 'hours')
        .format('YYYY-MM-DD HH:mm:ss')
    }
  }
}

module.exports = CalendarEvent
