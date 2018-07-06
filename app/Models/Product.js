'use strict'

const Model = use('Model')

class Product extends Model {
  categories () {
    return this.belongsToMany('App/Models/Category')
  }

  static get computed() {
    return ['billingDescription', 'memberPrice', 'bundledUnits',
            'isSubscription', 'subscriptionPeriod',
            'subscriptionName', 'subscriptionPlan'];
  }

  getBillingDescription() {
    return this.billing_description;
  }

  getMemberPrice() {
    return this.member_price;
  }

  getBundledUnits() {
    return this.bundled_units;
  }

  getIsSubscription() {
    return this.is_subscription;
  }

  getSubscriptionPeriod() {
    return this.subscription_period;
  }

  getSubscriptionName() {
    return this.subscription_name;
  }

  getSubscriptionPlan() {
    return this.subscription_plan;
  }
}

module.exports = Product
