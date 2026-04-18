import { useEffect, useState, useCallback } from 'react';
import {
  getNotifications, markNotificationRead, markAllRead,
  type Notification,
} from '../../lib/data';
import { timeAgo } from '../../lib/data';

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  stage_change: { icon: '🟢', color: 'var(--success)' },
  payout: { icon: '💰', color: '#D4A017' },
  guarantee: { icon: '⚠️', color: 'var(--danger)' },
  new_lead: { icon: '👷', color: 'var(--brand-green)' },
  placement: { icon: '✅', color: 'var(--success)' },
  achievement: { icon: '🏆', color: '#D4A017' },
  sla_alert: { icon: '🚨', color: 'var(--danger)' },
};

export default function AlertsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const load = useCallback(() => {
    setNotifications(getNotifications());
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = (id: string) => {
    markNotificationRead(id);
    load();
  };

  const handleMarkAllRead = () => {
    markAllRead();
    load();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
            Updates
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--neutral-900)' }}>
            Alerts
          </h1>
        </div>
        {unreadCount > 0 && (
          <button
            id="mark-all-read-btn"
            onClick={handleMarkAllRead}
            style={{
              background: 'var(--brand-green-light)', border: '1px solid rgba(46,168,106,0.2)',
              borderRadius: 10, padding: '7px 12px', fontSize: 12, fontWeight: 700,
              color: 'var(--brand-green)', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--neutral-500)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>All caught up!</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>No new alerts</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map((n) => {
            const config = TYPE_CONFIG[n.type] || { icon: '📣', color: 'var(--neutral-500)' };
            return (
              <div
                key={n.id}
                id={`notif-${n.id}`}
                onClick={() => handleMarkRead(n.id)}
                style={{
                  background: n.read ? 'var(--neutral-50)' : 'var(--brand-green-light)',
                  border: `1.5px solid ${n.read ? 'var(--neutral-200)' : 'rgba(46,168,106,0.25)'}`,
                  borderRadius: 16, padding: '14px 16px', cursor: 'pointer',
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: n.read ? 'var(--neutral-100)' : 'rgba(46,168,106,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {config.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: n.read ? 500 : 700, color: 'var(--neutral-900)', lineHeight: 1.4, marginBottom: 4 }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--neutral-500)', lineHeight: 1.4, marginBottom: 6 }}>
                    {n.body}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--neutral-500)' }}>
                    {timeAgo(n.createdAt)}
                  </div>
                </div>
                {!n.read && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-green)', flexShrink: 0, marginTop: 6 }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
