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

Factory.blueprint('App/Models/CalendarEvent', (faker) => {
  const daysFromNow = faker.integer({ min: 1, max: 30 });
  const startDay = moment().add(daysFromNow, 'days');
  const start = startDay.format('YYYY-MM-DD HH:mm:ss');
  const duration = faker.integer({ min: 1, max: 4 });

  const price = faker.integer({ min: 0, max: 5 }) * 2500;
  const member_price = Math.floor(Math.abs(price - 2500), 0);

  return {
    title: faker.sentence({ words: 4 }),
    is_all_day: faker.bool({ likelihood: 30 }),
    start,
    duration,
    description: faker.paragraph(),
    category: faker.pickone(['class', 'meetup', 'talk', 'private']),
    price,
    member_price,
  };
});
/*
Factory.blueprint('App/Models/Category', (faker) => {
  return {
  }
});

Factory.blueprint('App/Models/CreditCard', (faker) => {
  return {
  }
});

Factory.blueprint('App/Models/Ho', (faker) => {
  return {
  }
});

Factory.blueprint('App/Models/Order', (faker) => {
  return {
  }
});

Factory.blueprint('App/Models/OrderItem', (faker) => {
  return {
  }
});

Factory.blueprint('App/Models/Product', (faker) => {
  return {
  }
});

Factory.blueprint('App/Models/Subscription', (faker) => {
  return {
  }
});

Factory.blueprint('App/Models/Token', (faker) => {
  return {
  }
});

*/
