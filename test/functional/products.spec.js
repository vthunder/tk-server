'use strict'

const { test, before, after } = use('Test/Suite')('Products, Plans, & SKUs')
const apollo = use('TK/ApolloApiClient')
const unauthedApollo = use('TK/UnauthedApolloApiClient')
const gql = require('graphql-tag');

test('query: products', async ({ assert }) => {
  try {
    const ret = await apollo.query({
      query: gql`
        query {
          products {
            id
            active
            attributes
            caption
            description
            livemode
            metadata {
              key
              value
            }
            name
            type
            url
          }
        }
      `,
    })
    assert.isAtLeast(ret.data.products.length, 2)
    for (let p of ret.data.products) {
      assert.isOk(p.id)
      assert.equal(p.__typename, 'Product')
      assert.isOk(p.active)
      assert.isOk(p.name)
      if (p.type === 'good') {
        assert.isAtLeast(p.attributes.length, 2)
        assert.isOk(p.caption)
        assert.isOk(p.description)
      } else if (p.type === 'service') {
        assert.equal(p.attributes.length, 0)
        assert.isNotOk(p.caption)
        assert.isNotOk(p.description)
      } else throw 'Unknown product type'
    }
  } catch (e) {
    console.log(e)
    console.log(e.networkError.result.errors)
  }
}).timeout(0)

test('query: plans', async ({ assert }) => {
  try {
    const ret = await apollo.query({
      query: gql`
        query($product: String) {
          plans(product: $product) {
            id
            active
            amount
            currency
            interval
            interval_count
            livemode
            metadata {
              key
              value
            }
            nickname
            product
          }
        }
      `,
    })
  } catch (e) {
    console.log(e)
    console.log(e.networkError.result.errors)
  }
}).timeout(0)

test('query: plan', async ({ assert }) => {
  try {
    const ret = await apollo.query({
      query: gql`
        query($product: String, $nickname: String) {
          plan(product: $product, nickname: $nickname) {
            id
            active
            amount
            currency
            interval
            interval_count
            livemode
            metadata {
              key
              value
            }
            nickname
            product
          }
        }
      `,
      variables: {
        nickname: 'Monthly membership',
      },
    })
  } catch (e) {
    console.log(e)
    console.log(e.networkError.result.errors)
  }
}).timeout(0)

test('query: skus', async ({ assert }) => {
  try {
    const ret = await apollo.query({
      query: gql`
        query {
          skus {
            id
            active
            attributes {
              key
              value
            }
            currency
            inventory {
              quantity
              type
              value
            }
            livemode
            metadata {
              key
              value
            }
            price
            product
          }
        }
      `,
    })
  } catch (e) {
    console.log(e)
    console.log(e.networkError.result.errors)
  }
}).timeout(0)
