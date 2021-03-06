'use strict'

/*
|--------------------------------------------------------------------------
| Factory
|--------------------------------------------------------------------------
|
| Factories are used to define blueprints for database tables or Lucid
| models. Later you can use these blueprints to seed your database
| with dummy data.
|
*/

const Factory = use('Factory')
const Hash = use('Hash')
const moment = use('moment')

Factory.blueprint('App/Models/User', async (faker) => {
  return {
    name: faker.username(),
    email: faker.email(),
    password: await Hash.make(faker.password()),
  };
});

Factory.blueprint('App/Models/CalendarEventMaster', (faker) => {
  return {
    title: faker.sentence({ words: 4 }),
    is_all_day: faker.bool({ likelihood: 30 }),
    duration: faker.integer({ min: 1, max: 4 }),
    description: faker.paragraph(),
    category: faker.pickone(['class', 'meetup', 'talk', 'private']),
    sku_id: 'sku_DjaxIRazOp3agh',
    price: faker.pickone([7500, 10000, 12500]),
    member_price: faker.pickone([5500, 8000, 10500]),
  };
});

Factory.blueprint('App/Models/CalendarEvent', (faker) => {
  const daysFromNow = faker.integer({ min: 1, max: 30 });
  const startDay = moment().add(daysFromNow, 'days');

  return {
    title: faker.sentence({ words: 4 }),
    is_all_day: faker.bool({ likelihood: 30 }),
    start: startDay.format('YYYY-MM-DD HH:mm:ss'),
    duration: faker.integer({ min: 1, max: 4 }),
    description: faker.paragraph(),
    category: faker.pickone(['class', 'meetup', 'talk', 'private']),
    sku_id: 'sku_DjaxIRazOp3agh',
    price: faker.pickone([7500, 10000, 12500]),
    member_price: faker.pickone([5500, 8000, 10500]),
  };
});
