'use strict'

/*
|--------------------------------------------------------------------------
| DatabaseSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

const Factory = use('Factory')

class DatabaseSeeder {
  async run () {
    const usersArray = await Factory
          .model('App/Models/User')
          .createMany(5);

    const eventsArray = await Factory
          .model('App/Models/CalendarEvent')
          .createMany(15);


  }
}

module.exports = DatabaseSeeder
