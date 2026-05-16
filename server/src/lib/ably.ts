import Ably from 'ably';
import { env } from '../config/env.js';

// Initialize Ably Rest client
const ably = new Ably.Rest({
  key: env.ABLY_API_KEY,
});

/**
 * Helper to broadcast an update to all connected clients
 * on the 'bookings' channel.
 */
export async function broadcastBookingUpdate(type: string, payload?: any) {
  try {
    const channel = ably.channels.get('bookings');
    await channel.publish('update', { type, ...payload });
    console.log(`[ABLY] Broadcasted update: ${type}`);
  } catch (error) {
    console.error('[ABLY] Failed to broadcast update:', error);
  }
}

export default ably;
