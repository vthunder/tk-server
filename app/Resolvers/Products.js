const GraphQLError = use('Adonis/Addons/GraphQLError')
const Stripe = use('TK/Stripe')
const Pass = use('App/Models/Pass')

// note: auth.getUser() implicitly checks Authorization header, throws otherwise

function keyValMapArray(array, attributes) {
  let ret = []
  for (let obj of array) {
    for (let attr of attributes) {
      obj[attr] = keyValMap(obj[attr])
    }
    ret.push(obj)
  }
  return ret
}
function keyValMap(object) {
  return Object.keys(object).map(k => ({ key: k, value: object[k] }))
}

module.exports = {
  Query: {
    products: async (_, args, { auth }) => {
      const products = await Stripe.products.list()
      return keyValMapArray(products.data, ['metadata'])
    },
    plans: async (_, { product }, { auth }) => {
      const plans = await Stripe.plans.list({ product })
      return keyValMapArray(plans.data, ['metadata'])
    },
    plan: async (_, { product, nickname }, { auth }) => {
      let plans = await Stripe.plans.list({ product })
      plans = keyValMapArray(plans.data, ['metadata'])
      return plans.filter(p => p.nickname === nickname)[0]
    },
    skus: async (_, { product }, { auth }) => {
      const skus = await Stripe.skus.list({ product })
      return keyValMapArray(skus.data, ['attributes', 'metadata'])
    },
    user_passes: async (_, args, { auth }) => {
      const user = await auth.getUser()
      const passes = await user.passes().fetch()
      return passes.toJSON()
    },
  },
  Mutation: {
  },
}
