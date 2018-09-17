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
const Role = use('Role')
const Permission = use('Permission')
const User = use('App/Models/User')
const Product = use('App/Models/Product')

class DatabaseSeeder {
  async run () {
    await this._users()
    await this._permissionsAndRoles()
    await this._events()
  }

  async _users() {
    let user = new User()
    user.name = 'Dan'
    user.email = 'dan@example.com'
    user.password = 'asdf1234'
    await user.save()

    const usersArray = await Factory
          .model('App/Models/User')
          .createMany(5);
  }

  async _permissionsAndRoles() {
    //
    // Permissions
    //
    const permissions = [
      { name: 'Delete users', slug: 'delete_users',
        description: 'Delete any user and associated Stripe customer' },
    ]
    const permissionObjs = {}

    for (let p of permissions) {
      permissionObjs[p.slug] = await Permission.create(p)
    }

    //
    // Roles
    //
    const roles = [
      {
        fields: { name: 'Administrator',
                  slug: 'administrator',
                  description: 'Super-user' },
        permissions: ['delete_users']
      },
      {
        fields: { name: 'Manager',
                  slug: 'manager',
                  description: 'General staff' },
        permissions: []
      },
    ]
    const roleObjs = []

    for (let r of roles) {
      let role = await Role.create(r.fields)
      let permissionIds = r.permissions.map(p => (permissionObjs[p].id))
      await role.permissions().attach(permissionIds)
      roleObjs.push(role)
    }

    //
    // Attach role to admin user
    //
    let admin = await User.findBy('email', 'dan@example.com')
    await admin.roles().attach(roleObjs.map(r => (r.id)))
  }

  async _events() {
    const eventsArray = await Factory
          .model('App/Models/CalendarEvent')
          .createMany(15);
  }
}

module.exports = DatabaseSeeder
