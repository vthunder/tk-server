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
const User = use('App/Models/User')
const Product = use('App/Models/Product')

class DatabaseSeeder {
  async run () {
    let user = new User()
    user.name = 'dan'
    user.email = 'danmills@sandmill.org'
    user.password = 'sheepish alliance yarmouth flub'
    await user.save()

    const usersArray = await Factory
          .model('App/Models/User')
          .createMany(5);

    let product = new Product()
    product.id = 1
    product.title = 'Membership (Monthly)'
    product.description = 'Get all membership benefits, billed monthly'
    product.billing_description = 'Tinker Kitchen membership (monthly)'
    product.price = 15000
    product.member_price = null
    product.bundled_units = 1
    product.unit = 'month'
    product.is_subscription = true
    product.subscription_period = 'monthly'
    product.subscription_name = 'membership'
    product.subscription_plan = 'membership-monthly'
    await product.save()

    product = new Product()
    product.id = 2
    product.title = 'Membership (Yearly)'
    product.description = 'Get all membership benefits, billed yearly'
    product.billing_description = 'Tinker Kitchen membership (yearly)'
    product.price = 150000
    product.member_price = null
    product.bundled_units = 12
    product.unit = 'month'
    product.is_subscription = true
    product.subscription_period = 'yearly'
    product.subscription_name = 'membership'
    product.subscription_plan = 'membership-yearly'
    await product.save()

    const eventsArray = await Factory
          .model('App/Models/CalendarEvent')
          .createMany(15);
  }
}

module.exports = DatabaseSeeder
