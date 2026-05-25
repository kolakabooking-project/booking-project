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
export async function broadcastBookingUpdate(type: string, payload?: any, channelName: string = 'bookings') {
  try {
    const channel = ably.channels.get(channelName);
    await channel.publish('update', { type, ...payload });
    console.log(`[ABLY] Broadcasted update: ${type} on ${channelName}`);
  } catch (error) {
    console.error(`[ABLY] Failed to broadcast update on ${channelName}:`, error);
  }
}

export default ably;
