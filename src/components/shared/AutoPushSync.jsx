import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

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

export default function AutoPushSync() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const syncPush = async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();

        // Jika permission sudah diizinkan (granted) namun belum ada subscription atau belum tersimpan, otomatis daftarkan secara senyap
        if (!sub && Notification.permission === 'granted') {
          const keyRes = await fetch('/api/push/vapidPublicKey');
          if (keyRes.ok) {
            const { publicKey } = await keyRes.json();
            if (publicKey) {
              sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
              });
            }
          }
        }

        // Sinkronkan ke database backend agar HP/perangkat pegawai terdaftar di tabel langganan
        if (sub) {
          const subData = JSON.parse(JSON.stringify(sub));
          await fetch('/api/push/subscribe', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription: subData }),
          });
        }
      } catch (err) {
        // Silent error agar tidak mengganggu UI utama
      }
    };

    syncPush();
  }, [user]);

  return null;
}
