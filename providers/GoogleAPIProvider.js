'use strict'

const { ServiceProvider } = require('@adonisjs/fold')
const CalendarAPI = use('node-google-calendar')

class GoogleCalendarAPIProvider extends ServiceProvider {
  /**
   * Register namespaces to the IoC container
   *
   * @method register
   *
   * @return {void}
   */
  register () {
    this.app.singleton('TK/GoogleCalendarAPI', (app) => {
      const Config = app.use('Adonis/Src/Config')
      return new CalendarAPI({
        calendarUrl: Config.get('app.googleapi.calendarUrl'),
        serviceAcctId: Config.get('app.googleapi.serviceAcctId'),
        calendarId: Config.get('app.googleapi.calendarId'),
        key: Config.get('app.googleapi.key'),
        timezone: Config.get('app.googleapi.timezone'),
      })
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

module.exports = GoogleCalendarAPIProvider
