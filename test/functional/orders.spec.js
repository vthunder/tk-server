'use strict'

const { test, before, after } = use('Test/Suite')('Orders & Payments')
const apollo = use('TK/ApolloApiClient')
const unauthedApollo = use('TK/UnauthedApolloApiClient')
const gql = require('graphql-tag');

before(async () => {
  // put some stuff into db
})
after(async () => {
  // clean up db
})

test('query: saved_cards', async ({ assert }) => {
})

test('mutation: new_order', async ({ assert }) => {
})
