'use strict'

const Hash = use('Hash')

const UserHook = exports = module.exports = {}

/**
 * Hash the user password before saving it to the database.
 */
UserHook.hashPassword = async (user) => {
  if (user.dirty.password) {
    user.password = await Hash.make(user.password)
  }
}
