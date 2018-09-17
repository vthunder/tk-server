'use strict'

/*
|--------------------------------------------------------------------------
| Vow file
|--------------------------------------------------------------------------
|
| The vow file is loaded before running your tests. This is the best place
| to hook operations `before` and `after` running the tests.
|
*/

const ace = require('@adonisjs/ace')
const Mail = use('Mail')

module.exports = (cli, runner) => {
  runner.before(async () => {
    // Start the server and run migrations
    use('Adonis/Src/Server').listen(process.env.HOST, process.env.PORT)
    await ace.call('migration:refresh')
    await ace.call('seed')
    Mail.fake()
    await use('TK/AuthUtils').signIn('dan@example.com', 'asdf1234')
    Mail.clear()
    Mail.restore()
  })

  runner.after(async () => {
    // Shutdown server and roll back migrations
    use('Adonis/Src/Server').getInstance().close()
    // await ace.call('migration:reset')
  })
}
