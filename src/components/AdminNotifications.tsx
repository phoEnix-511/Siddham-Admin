import React, { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export default function AdminNotifications() {
  const { addToast } = useToast();
  const [lastChecked, setLastChecked] = useState(Date.now());
  const [unread, setUnread] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

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
          <div style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--color-gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-forest-dark)' }}>Notifications</h4>
            {unread.length > 0 && (
              <button 
                onClick={() => setUnread([])}
                style={{ background: 'none', border: 'none', color: 'var(--color-gray-500)', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Clear all
              </button>
            )}
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
