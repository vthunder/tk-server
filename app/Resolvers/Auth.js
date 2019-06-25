const querystring = require('querystring');
const Persona = use('Persona')
const GraphQLError = use('Adonis/Addons/GraphQLError')
const Auth = use('TK/Auth')

// note: auth.getUser() implicitly checks Authorization header, throws otherwise

module.exports = {
  Query: {
    me: async (_, args, { auth }) => {
      const user = await Auth.getUser(auth)
      if (!user) return {}
      await user.stripe_check()
      await user.load_qr_token()
      return user.toJSON()
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
      try {
        await Persona.verifyEmail(querystring.unescape(token))
        return 'OK'
      } catch (e) {
        return 'Error'
      }
    },
    update_profile: async (_, args, { auth }) => {
      const user = await auth.getUser()
      const profile = { name, email } = args.profile
      await Persona.updateProfile(user, profile)
      return 'OK'
    },
    update_password: async (_, { old_password, password }, { auth }) => {
      const user = await auth.getUser()
      try {
        await Persona.updatePassword(user, { old_password, password,
                                             password_confirmation: password })
      } catch (e) {
        console.log(e)
        return e.messages[0].message
      }
      return 'OK'
    },
    forgot_password: async (_, { email }) => {
      try {
        await Persona.forgotPassword(email)
        return 'OK'
      } catch (e) {
        return 'Error'
      }
    },
    update_password_by_token: async (_, { token, password }) => {
      try {
        await Persona.updatePasswordByToken(querystring.unescape(token),
                                            { password,
                                              password_confirmation: password })
        return 'OK'
      } catch (e) {
        return `Error: ${e}`
      }
    },
  },
}
