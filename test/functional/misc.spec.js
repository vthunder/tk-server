'use strict'

const { test } = use('Test/Suite')('Misc API calls')
const apollo = use('TK/ApolloApiClient')
const unauthedApollo = use('TK/UnauthedApolloApiClient')
const gql = require('graphql-tag');

test('Ping', async ({ assert }) => {
  const ret = await unauthedApollo.query({
    query: gql`query Ping { ping }`
  })
  assert.equal(ret.data.ping, 'pong')
})

// TODO
/*
test('mutation: mailing_list_signup', async ({ assert }) => {
})
*/
