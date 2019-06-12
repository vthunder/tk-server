const moment = use('moment')
const GraphQLError = use('Adonis/Addons/GraphQLError')
const Config = use('Adonis/Src/Config')
const User = use('App/Models/User')
const Booking = use('App/Models/Booking')
const CalendarEvent = use('App/Models/CalendarEvent')
const CheckInLog = use('App/Models/CheckInLog')

// note: auth.getUser() implicitly checks Authorization header, throws otherwise

module.exports = {
  Query: {
    admin_stats: async (_, {}, { auth }) => {
      const user = await auth.getUser()
      const perms = await user.getPermissions()
      if (!perms.includes('read_admin_dashboard')) return new GraphQLError('Permission denied')

      const now = moment().format('YYYY-MM-DD')

      const members = await User
            .query()
            .where('is_member', '=', 1)
            .getCount()
      const coupon_members = await User
            .query()
            .where('free_membership_end', '>=', now)
            .andWhere('is_member', '=', 0)
            .getCount()
      const events = await CalendarEvent
            .query()
            .where('start', '>=', now)
            .getCount();
      const bookings = await Booking
            .query()
            .where('id', '>', 0)
            .getCount(); // FIXME: add column to filter on

      return {
        num_members: members + coupon_members,
        num_paying_members: members,
        num_coupon_members: coupon_members,
        num_events: events,
        num_event_bookings: bookings,
      }
    },
    admin_list_checkins: async (_, {}, { auth }) => {
      const user = await auth.getUser()
      const perms = await user.getPermissions()
      if (!perms.includes('read_admin_dashboard')) return new GraphQLError('Permission denied')

      const logs = await CheckInLog.all()
      return logs.toJSON().map((i) => { i.date = i.created_at; return i; })
    },
  },
  Mutation: {
    refresh_members: async (_, {}, { auth }) => {
      const user = await auth.getUser()
      const perms = await user.getPermissions()
      // fixme: add new permission
      if (!perms.includes('read_admin_dashboard')) return new GraphQLError('Permission denied')
    },
  },
}
