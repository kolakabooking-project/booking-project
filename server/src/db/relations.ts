import { relations } from 'drizzle-orm';
import { user, session, account, vehicle, driver, booking, bookingReview, chatMessage } from './schema.js';

// ── User relations ──
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  bookings: many(booking),
  sentMessages: many(chatMessage, { relationName: 'sentMessages' }),
  receivedMessages: many(chatMessage, { relationName: 'receivedMessages' }),
}));

// ── Session relations ──
export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

// ── Account relations ──
export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// ── Vehicle relations ──
export const vehicleRelations = relations(vehicle, ({ many }) => ({
  bookings: many(booking),
}));

// ── Driver relations ──
export const driverRelations = relations(driver, ({ many }) => ({
  bookings: many(booking),
}));

// ── Booking relations ──
export const bookingRelations = relations(booking, ({ one }) => ({
  user: one(user, {
    fields: [booking.userId],
    references: [user.id],
  }),
  vehicle: one(vehicle, {
    fields: [booking.vehicleId],
    references: [vehicle.id],
  }),
  driver: one(driver, {
    fields: [booking.driverId],
    references: [driver.id],
  }),
  review: one(bookingReview),
}));

// ── BookingReview relations ──
export const bookingReviewRelations = relations(bookingReview, ({ one }) => ({
  booking: one(booking, {
    fields: [bookingReview.bookingId],
    references: [booking.id],
  }),
}));

// ── ChatMessage relations ──
export const chatMessageRelations = relations(chatMessage, ({ one }) => ({
  sender: one(user, {
    fields: [chatMessage.senderId],
    references: [user.id],
    relationName: 'sentMessages',
  }),
  receiver: one(user, {
    fields: [chatMessage.receiverId],
    references: [user.id],
    relationName: 'receivedMessages',
  }),
}));
