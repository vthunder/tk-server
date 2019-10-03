const GraphQLError = use('Adonis/Addons/GraphQLError')
const Stripe = use('TK/Stripe')
const Pass = use('App/Models/Pass')
const KV = use('TK/KeyVal')
const Config = use('Adonis/Src/Config')
const Auth = use('TK/Auth')

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
      const plans = await Stripe.plans.list({ product, limit: 100 })
      return keyValMapArray(plans.data, ['metadata'])
    },
    plan: async (_, { product, nickname }, { auth }) => {
      let plans = await Stripe.plans.list({ product, limit: 100 })
      plans = keyValMapArray(plans.data, ['metadata'])
      return plans.filter(p => p.nickname === nickname)[0]
    },
    skus: async (_, { product }, { auth }) => {
      const skus = await Stripe.skus.list({ product })
      return keyValMapArray(skus.data, ['attributes', 'metadata'])
    },
    day_pass_skus: async (_, args, { auth }) => {
      async function get_sku(name) {
        const id = Config.get(`app.daypass.sku.${name}`)
        const sku = await Stripe.skus.retrieve(id)
        return KV.mapObject(sku, ['attributes', 'metadata'])
      }
      return {
        nonmember_1: get_sku('nonmember_1'),
        member_1: get_sku('member_1'),
      }
    },
    user_passes: async (_, { type }, { auth }) => {
      const user = await Auth.getUser(auth)
      if (!user) return []
      const passes = await user.passes().where('type', (type||'day_pass')).fetch()
      if (!passes) return []
      return passes.toJSON()
    },
  },
  Mutation: {
  },
}
