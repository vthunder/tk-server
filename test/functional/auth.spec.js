'use strict'

const Mail = use('Mail')
const { test } = use('Test/Suite')('Authentication & Users')
const apollo = use('TK/ApolloApiClient')
const unauthedApollo = use('TK/UnauthedApolloApiClient')
const gql = require('graphql-tag');

test('mutation: signup (Create a user)', async ({ assert }) => {
  const ret = await unauthedApollo.mutate({
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
          is_member
        }
      }
  `,
    variables: {
      name: 'Dan',
      email: 'dan1@example.com',
      password: 'asdf1234'
    }
  })

  assert.isAtLeast(ret.data.signup.id, 1)
  assert.equal(ret.data.signup.name, 'Dan')
  assert.equal(ret.data.signup.email, 'dan1@example.com')
  assert.equal(ret.data.signup.jwt.type, 'bearer')
  assert.isOk(ret.data.signup.jwt.token)

  /* // TODO: figure out how to plug in Mail.fake()
  const recentEmail = Mail.pullRecent()
  assert.equal(recentEmail.to.address, 'dan1@example.com')
  assert.equal(recentEmail.to.name, 'Dan')
  */
})

test('mutation: login (Sign in)', async ({ assert }) => {
  const ret = await unauthedApollo.mutate({
    mutation: gql`
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
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
      email: 'dan@example.com',
      password: 'asdf1234',
    }
  })
  assert.isAtLeast(ret.data.login.id, 1)
  assert.equal(ret.data.login.name, 'Dan')
  assert.equal(ret.data.login.email, 'dan@example.com')
  assert.equal(ret.data.login.jwt.type, 'bearer')
  assert.isOk(ret.data.login.jwt.token)
})

test('query: me (Get signed-in user profile)', async ({ assert }) => {
  try {
    const ret = await apollo.query({
      query: gql`
        query Me {
          me {
            name
            email
            is_member
          }
        }
      `
    })
    assert.equal(ret.data.me.name, 'Dan')
    assert.equal(ret.data.me.email, 'dan@example.com')
  //  if (ret.data.me.is_member) {
  //    assert.isOk(ret.data.me.membership_sub)
  //  } else {
  //    assert.isNotOk(ret.data.me.membership_sub)
  //  }
  } catch (e) {
    console.log(e)
    console.log(e.networkError.result.errors)
  }
})

test('query: me (Verify sign-in required)', async ({ assert }) => {
  try {
    const ret = await unauthedApollo.query({
      query: gql`query Me { me { name } }`
    })
    assert.fail()
  } catch (e) {
    assert.equal(e.message, 'GraphQL error: E_INVALID_JWT_TOKEN: jwt must be provided')
  }
})

// TODO: write these
/*
test('mutation: verify_email', async ({ assert }) => {
})

test('mutation: update_profile', async ({ assert }) => {
})

test('mutation: update_password', async ({ assert }) => {
})

test('mutation: forgot_password', async ({ assert }) => {
})

test('mutation: update_password_by_token', async ({ assert }) => {
})
*/
