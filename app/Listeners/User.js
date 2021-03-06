'use strict'

const querystring = require('querystring');
const Mail = use('Mail')
const User = exports = module.exports = {}

User.created = async ({ user, token }) => {
  if (user.email.endsWith('@example.com')) return;
  console.log('got event: user created: ' + user.email);
  await Mail.send('emails.user_created', { user, token: querystring.escape(token) }, (message) => {
    message
      .to(user.email)
      .from('hello@tinkerkitchen.org')
      .subject('Welcome to Tinker Kitchen!')
  })
}

User.emailChanged = async ({ user, oldEmail, token }) => {
  console.log('got event: user email changed: ' + oldEmail + " -> " + user.email);
}

User.passwordChanged = async ({ user }) => {
  console.log('got event: user password changed: ' + user.email);
}

User.forgotPassword = async ({ user, token }) => {
  if (user.email.endsWith('@example.com')) return;
  console.log('got event: user forgot password: ' + user.email);
  await Mail.send('emails.user_forgot', { user, token: querystring.escape(token) }, (message) => {
    message
      .to(user.email)
      .from('hello@tinkerkitchen.org')
      .subject('Tinker Kitchen password reset')
  })
}

User.passwordRecovered = async ({ user }) => {
  console.log('got event: user completed forgot password flow: ' + user.email);
}
