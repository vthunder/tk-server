'use strict'

const { ServiceProvider } = require('@adonisjs/fold')
const { ApolloLink } = require('apollo-link');
const { ApolloClient } = require('apollo-client');
const { InMemoryCache } = require('apollo-cache-inmemory');
const { HttpLink } = require('apollo-link-http');
const { setContext } = require('apollo-link-context');
const fetch = require('node-fetch');
const gql = require('graphql-tag');

class ApolloApiClient extends ServiceProvider {

  /**
   * Container with auth token that our Apollo Link uses to set auth header
   */
  _tokenStore() {
    this.app.singleton('TK/AuthTokenStore', (app) => {
      return { token: null };
    })
  }

  /**
   * Apollo Client, configured to use token store and inject auth header if set
   */
  _apolloClient() {
    this.app.singleton('TK/ApolloApiClient', (app) => {
      let authLink = setContext((_, { headers }) => {
        const { token } = use('TK/AuthTokenStore')
        return {
          headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : '',
          },
        }
      })

      const link = authLink.concat(
        new HttpLink({ uri: process.env.VUE_APP_GRAPHQL_HTTP || 'http://localhost:4000',
                       fetch: fetch }))

      return new ApolloClient({
        link: link,
        cache: new InMemoryCache()
      });
    })
  }

  /**
   * Apollo Client, NOT configured to use token store (to test signed out state)
   */
  _unauthedClient() {
    this.app.singleton('TK/UnauthedApolloApiClient', (app) => {
      return new ApolloClient({
        link: new HttpLink({ uri: process.env.VUE_APP_GRAPHQL_HTTP || 'http://localhost:4000',
                             fetch: fetch }),
        cache: new InMemoryCache()
      });
    })
  }

  /**
   * Auth utils, used e.g. in vowfile.js
   */
  _utils() {
    this.app.singleton('TK/AuthUtils', (app) => {
      return {
        createUserAndSignIn: async (email) => {
          const apollo = use('TK/ApolloApiClient')
          const ret = await apollo.mutate({
            mutation: gql`
          mutation Signup($name: String!, $email: String!, $password: String!) {
            signup(name: $name, email: $email, password: $password) {
              id
              name
              email
              jwt {
                type
                token
                refreshToken
              }
            }
          }
        `,
            variables: {
              name: 'Dan',
              email: email,
              password: 'asdf1234'
            }
          })
          const store = use('TK/AuthTokenStore')
          store.token = ret.data.signup.jwt.token
        }
      }
    })
  }

  /**
   * Register namespaces to the IoC container
   *
   * @method register
   *
   * @return {void}
   */
  register () {
    this._tokenStore()
    this._apolloClient()
    this._unauthedClient()
    this._utils()
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

module.exports = ApolloApiClient
