'use strict'

const { test, before, after } = use('Test/Suite')('Calendar events')
const apollo = use('TK/ApolloApiClient')
const unauthedApollo = use('TK/UnauthedApolloApiClient')
const gql = require('graphql-tag');

test('query: calendar_events (fetch events list)', async ({ assert }) => {
  const ret = await unauthedApollo.query({
    query: gql`
      query CalendarEvents {
        calendar_events {
          id
          title
          start
          end
          duration
          all_day
          description
          category
          price
          member_price
        }
      }`
  })
  assert.isAtLeast(ret.data.calendar_events.length, 1)
  const event = ret.data.calendar_events.pop()
  assert.isAtLeast(event.id, 1)
  assert.isOk(event.title)
  assert.isOk(event.start)
  assert.isOk(event.description)
  assert.isOk(event.category)
})

test('query: calendar_event (fetch event details)', async ({ assert }) => {
  const ret = await unauthedApollo.query({
    query: gql`
      query CalendarEvents($id: Int!) {
        calendar_event(id: $id) {
          id
          title
          start
          end
          duration
          all_day
          description
          category
          price
          member_price
        }
      }`,
    variables: {
      id: 1
    }
  })
  assert.equal(ret.data.calendar_event.id, 1)
  assert.isOk(ret.data.calendar_event.title)
  assert.isOk(ret.data.calendar_event.start)
  assert.isOk(ret.data.calendar_event.description)
  assert.isOk(ret.data.calendar_event.category)
})
