import { useEffect, useState, useCallback } from 'react';
import {
  getNotifications, markNotificationRead, markAllRead,
  getTomorrowsJoinings, buildConfirmationMessage,
  type Notification, type Candidate, type LeadExtra,
} from '../../lib/data';
import { timeAgo } from '../../lib/data';
import { useRole } from '../../contexts/RoleContext';

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  stage_change: { icon: '🟢', color: 'var(--success)',       bg: 'var(--success-light)' },
  payout:       { icon: '💰', color: '#D4A017',              bg: 'var(--accent-gold-light)' },
  guarantee:    { icon: '⚠️', color: 'var(--danger)',        bg: 'var(--danger-light)' },
  new_lead:     { icon: '👷', color: 'var(--brand-green)',   bg: 'var(--brand-green-light)' },
  placement:    { icon: '✅', color: 'var(--success)',       bg: 'var(--success-light)' },
  achievement:  { icon: '🏆', color: '#D4A017',              bg: 'var(--accent-gold-light)' },
  sla_alert:    { icon: '🚨', color: 'var(--danger)',        bg: 'var(--danger-light)' },
  followup:     { icon: '📞', color: '#D97706',              bg: '#FFFBEB' },
};

export default function AlertsPage() {
  const { captainId } = useRole();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [tomorrowJoinings, setTomorrowJoinings] = useState<Array<Candidate & { extra: LeadExtra }>>([]);

  const load = useCallback(() => {
    setNotifications(getNotifications());
    setTomorrowJoinings(getTomorrowsJoinings(captainId));
  }, [captainId]);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = (id: string) => {
    markNotificationRead(id);
    load();
  };

  const handleMarkAllRead = () => {
    markAllRead();
    load();
  };

  const sendAll = () => {
    tomorrowJoinings.forEach((c, i) => {
      setTimeout(() => {
        const msg = buildConfirmationMessage(c, c.extra);
        window.open(`https://wa.me/91${c.mobile}?text=${encodeURIComponent(msg)}`, '_blank');
      }, i * 600);
    });
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

      {/* ── Tomorrow's Joinings ───────────────────────── */}
      {tomorrowJoinings.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Action Needed</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--neutral-900)' }}>
                Tomorrow's Joinings ({tomorrowJoinings.length})
              </div>
            </div>
            {tomorrowJoinings.length > 1 && (
              <button
                onClick={sendAll}
                style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', borderRadius: 10, padding: '8px 14px', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                📤 Send All
              </button>
            )}
          </div>

          {tomorrowJoinings.map(c => {
            const msg = buildConfirmationMessage(c, c.extra);
            return (
              <div key={c.id} style={{ background: 'rgba(37,211,102,0.07)', border: '1.5px solid rgba(37,211,102,0.3)', borderRadius: 18, padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--neutral-900)' }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--neutral-600)', marginTop: 2 }}>
                      {c.jobType} · {c.location}
                    </div>
                    {c.extra.reportingTime && (
                      <div style={{ fontSize: 11, color: '#D97706', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        ⏰ Report at {c.extra.reportingTime}
                      </div>
                    )}
                    {c.extra.contactPerson && (
                      <div style={{ fontSize: 11, color: 'var(--neutral-500)', marginTop: 3 }}>
                        👤 Meet: {c.extra.contactPerson}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#059669', background: 'rgba(5,150,105,0.12)', padding: '4px 9px', borderRadius: 99, flexShrink: 0 }}>
                    Tomorrow
                  </span>
                </div>
                <a
                  href={`https://wa.me/91${c.mobile}?text=${encodeURIComponent(msg)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#25D366,#128C7E)', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, color: '#fff', textDecoration: 'none' }}
                >
                  📱 Send Joining Confirmation on WhatsApp
                </a>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Notifications list ─────────────────────────── */}
      {notifications.length === 0 && tomorrowJoinings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--neutral-500)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>All caught up!</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>No new alerts</div>
        </div>
      ) : notifications.length > 0 ? (
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
                  background: n.read ? 'var(--neutral-100)' : (config.bg || 'rgba(46,168,106,0.1)'),
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
      ) : null}
    </div>
  );
}
