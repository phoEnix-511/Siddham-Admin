import React, { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export default function AdminNotifications() {
  const { addToast } = useToast();
  const [lastChecked, setLastChecked] = useState(Date.now());
  const [unread, setUnread] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(true); // default to true to hide button initially until checked

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setIsSubscribed(!!sub);
        });
      });
    }
  }, []);

  const enablePushNotifications = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          addToast('Notification permission denied by browser', 'error');
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const convertedVapidKey = (() => {
          const base64String = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
          const padding = '='.repeat((4 - base64String.length % 4) % 4);
          const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }
          return outputArray;
        })();

        const newSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });

        await fetch('/api/admin/push-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSubscription),
        });

        setIsSubscribed(true);
        addToast('Push notifications enabled!', 'success');
      } catch (err) {
        console.error('Push subscription failed:', err);
        addToast('Failed to enable push notifications', 'error');
      }
    } else {
      addToast('Push notifications not supported in this browser', 'error');
    }
  };

  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const res = await fetch(`/api/admin/notifications/poll?since=${lastChecked}`);
        if (res.ok) {
          const data = await res.json();
          if (data.notifications && data.notifications.length > 0) {
            setLastChecked(Date.now());
            setUnread(prev => [...data.notifications, ...prev].slice(0, 50));
            
            // Pop a toast for the newest order
            const newest = data.notifications[0];
            addToast(`New order ${newest.orderNumber} from ${newest.customerName} (${formatCurrency(newest.totalAmount)})`, 'success');
            
            // Play notification sound
            try {
              const audio = new Audio('/notification.mp3');
              audio.play().catch(() => {});
            } catch (e) {}
          }
        }
      } catch (err) {}
    };

    const interval = setInterval(checkNotifications, 10000);
    return () => clearInterval(interval);
  }, [lastChecked, addToast]);

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '1.2rem', position: 'relative',
          padding: 'var(--space-2)'
        }}
      >
        👔
        {unread.length > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: 'var(--color-saffron)', color: 'white',
            fontSize: '0.6rem', fontWeight: 'bold',
            borderRadius: '50%', width: 16, height: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>
	    {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', right: 0,
          background: 'white', border: '1px solid var(--color-gray-200)',
          borderRadius: 'var(--radius-md)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          width: 320, zIndex: 100, maxHeight: 400, overflowY: 'auto'
        }}>
          <div style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--color-gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-forest-dark)', whiteSpace: 'nowrap' }}>Notifications</h4>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
              {!isSubscribed && (
                <button 
                  onClick={enablePushNotifications}
                  style={{ background: 'var(--color-forest-light)', border: 'none', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
                >
                  Enable Push
                </button>
              )}
              {isSubscribed && (
                <button 
                  onClick={async () => {
                    await fetch('/api/admin/push-test', {
                      method: 'POST'
                    });
                  }}
                  style={{ background: 'var(--color-saffron)', border: 'none', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
                >
                  Test Push
                </button>
              )}
              {unread.length > 0 && (
                <button 
                  onClick={() => setUnread([])}
                  style={{ background: 'none', border: 'none', color: 'var(--color-gray-500)', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
          
          {unread.length === 0 ? (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-gray-400)', fontSize: '0.9rem' }}>
              No new notifications
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {unread.map((notif, i) => (
                <Link 
                  key={notif.id + i} 
                  href={`/admin/orders/${notif.id}`}
                  onClick={() => setIsOpen(false)}
                  style={{
                    padding: 'var(--space-3)', borderBottom: '1px solid var(--color-gray-100)',
                    display: 'flex', gap: 'var(--cpace-3)', alignItems: 'center',
                    textDecoration: 'none', color: 'inherit'
                  }}
                >
                  <div style={{ fontSize: '1.5rem' }}>🕜</div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-forest-dark)' }}>New Order: {notif.orderNumber}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>{notif.customerName} • {formatCurrency(notif.totalAmount)}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-gray-400)', marginTop: '2px' }}>
                      {new Date(notif.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
