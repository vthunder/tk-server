const GraphQLError = use('Adonis/Addons/GraphQLError')

module.exports = {
  Query: {
    me: () => {
      throw new GraphQLError('Not implemented yet')
    },
  },
  Mutation: {
    signup: (name, email, password) => {
      // return new User
      throw new GraphQLError('Not implemented yet')
    },
    login: (email, password) => {
      // return User
      throw new GraphQLError('Not implemented yet')
    },
    changeName: (new_name) => {
      // return String
      throw new GraphQLError('Not implemented yet')
    },
    changeEmail: (new_email) => {
      // return String
      throw new GraphQLError('Not implemented yet')
    },
    changePassword: (old_password, new_password) => {
      // return String
      throw new GraphQLError('Not implemented yet')
    },
  },
}
