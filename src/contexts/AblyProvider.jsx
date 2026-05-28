/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { Realtime } from 'ably';
import { useAuth } from './AuthContext';

const AblyContext = createContext(null);

/**
 * AblyProvider — Manages a SINGLE shared Ably Realtime connection.
 * All contexts and components subscribe to channels through this provider
 * instead of creating their own connections.
 */
export function AblyProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const ablyRef = useRef(null);
  const subscribersRef = useRef(new Map()); // channelName -> Map(subscriberId -> { event, callback })

  // Initialize or close the shared connection based on auth state
  useEffect(() => {
    if (isAuthenticated && !ablyRef.current) {
      const realtime = new Realtime({
        authCallback: async (tokenParams, callback) => {
          try {
            const response = await fetch('/api/ably/auth', {
              credentials: 'include',
            });
            if (!response.ok) throw new Error('Ably auth failed');
            const tokenRequest = await response.json();
            callback(null, tokenRequest);
          } catch (err) {
            callback(err, null);
          }
        }
      });

      ablyRef.current = realtime;

      // Re-subscribe any existing subscribers (e.g., after reconnect)
      subscribersRef.current.forEach((subscribers, channelName) => {
        const channel = realtime.channels.get(channelName);
        subscribers.forEach(({ event, callback }) => {
          channel.subscribe(event, callback);
        });
      });
    }

    if (!isAuthenticated && ablyRef.current) {
      const currentAbly = ablyRef.current;
      ablyRef.current = null;
      // Small delay to avoid strict mode double-unmount issues
      setTimeout(() => {
        if (currentAbly.connection.state !== 'closed') {
          currentAbly.close();
        }
      }, 100);
    }
  }, [isAuthenticated]);

  /**
   * Subscribe to a channel event.
   * Returns an unsubscribe function.
   */
  const subscribe = useCallback((channelName, event, callback) => {
    const subscriberId = `${channelName}:${event}:${Date.now()}:${Math.random()}`;

    // Track the subscriber
    if (!subscribersRef.current.has(channelName)) {
      subscribersRef.current.set(channelName, new Map());
    }
    subscribersRef.current.get(channelName).set(subscriberId, { event, callback });

    // If Ably is already connected, subscribe immediately
    if (ablyRef.current) {
      const channel = ablyRef.current.channels.get(channelName);
      channel.subscribe(event, callback);
    }

    // Return unsubscribe function
    return () => {
      const channelSubscribers = subscribersRef.current.get(channelName);
      if (channelSubscribers) {
        channelSubscribers.delete(subscriberId);
        if (channelSubscribers.size === 0) {
          subscribersRef.current.delete(channelName);
        }
      }

      if (ablyRef.current) {
        const channel = ablyRef.current.channels.get(channelName);
        channel.unsubscribe(event, callback);
      }
    };
  }, []);

  return (
    <AblyContext.Provider value={{ subscribe }}>
      {children}
    </AblyContext.Provider>
  );
}

export function useAbly() {
  const ctx = useContext(AblyContext);
  if (!ctx) throw new Error('useAbly must be used within AblyProvider');
  return ctx;
}
