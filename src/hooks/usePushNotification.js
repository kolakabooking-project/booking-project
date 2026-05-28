import { useState, useEffect } from 'react';
import { toast } from 'sonner';

/**
 * urlBase64ToUint8Array — Converts a VAPID public key from base64url to Uint8Array.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * usePushNotification — Hook to manage push notification subscription state.
 * Extracted from the identical logic in AccountPage and AdminSettingsPage.
 * 
 * Returns:
 * - isSupported: whether the browser supports push notifications
 * - isSubscribed: whether the user is currently subscribed
 * - isLoading: loading state during toggle
 * - toggleSubscription: function to toggle push subscription
 */
export default function usePushNotification() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        });
      });
    }
  }, []);

  const toggleSubscription = async () => {
    if (!isSupported || isLoading) return;
    setIsLoading(true);

    try {
      const reg = await navigator.serviceWorker.ready;

      if (isSubscribed) {
        // Unsubscribe
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          // Notify backend — credentials: 'include' wajib agar cookie sesi terkirim
          await fetch('/api/push/unsubscribe', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
        }
        setIsSubscribed(false);
        toast.success('Notifikasi sistem dinonaktifkan.');
      } else {
        // Subscribe
        // 1. Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast.error('Izin notifikasi ditolak. Harap aktifkan izin notifikasi di setelan browser Anda.');
          setIsLoading(false);
          return;
        }

        // 2. Fetch VAPID public key from server
        const keyRes = await fetch('/api/push/vapid-public-key', {
          credentials: 'include',
        });
        if (!keyRes.ok) throw new Error('Gagal mengambil VAPID key dari server');
        const { publicKey } = await keyRes.json();

        // 3. Subscribe to push manager
        const subscribeOptions = {
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        };
        const newSub = await reg.pushManager.subscribe(subscribeOptions);

        // 4. Send subscription to backend
        const subData = JSON.parse(JSON.stringify(newSub));
        const registerRes = await fetch('/api/push/subscribe', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subscription: subData }),
        });

        if (!registerRes.ok) throw new Error('Gagal mengirim data subscription ke server');

        setIsSubscribed(true);
        toast.success('Notifikasi sistem berhasil diaktifkan!');
      }
    } catch (err) {
      console.error('[PushToggle] Error toggling push notifications:', err);
      toast.error(err.message || 'Gagal mengubah pengaturan notifikasi.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    toggleSubscription,
  };
}
