const Persona = use('Persona')
const GraphQLError = use('Adonis/Addons/GraphQLError')

// note: auth.getUser() implicitly checks Authorization header, throws otherwise

module.exports = {
  Query: {
    me: async (_, args, { auth }) => {
      const user = await auth.getUser()
      await user.member_check()
      return user
    },
  },
  Mutation: {
    signup: async (obj, { name, email, password }, { auth }) => {
      // FIXME: can't get custom validation rules to work, so:
      const user = await Persona.register({ name, email, password,
                                            password_confirmation: password })
      user.jwt = await auth.generate(user)
      return user
    },
    login: async (obj, { email, password }, { auth }) => {
      const user = await Persona.verify({ uid: email, password })
      user.jwt = await auth.generate(user)
      return user
    },
    verify_email: async (obj, { token }, context) => {
      await Persona.verifyEmail(token)
      return 'OK'
    },
    update_profile: async (_, args, { auth }) => {
      const user = auth.getUser()
      const profile = { name, email } = args.profile
      await Persona.updateProfile(user, profile)
      return 'OK'
    },
    update_password: async (_, { old_password, password }, { auth }) => {
      const user = auth.getUser()
      await Persona.updatePassword(user, { old_password, password,
                                           password_confirmation: password })
      return 'OK'
    },
    forgot_password: async (_, { email }) => {
      await Persona.forgotPassword(email)
      return 'OK'
    },
    update_password_by_token: async (_, { token, password }) => {
      await Persona.updatePasswordByToken(token,
                                          { password,
                                            password_confirmation: password })
      return 'OK'
    },
  },
}
