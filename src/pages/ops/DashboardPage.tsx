import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getGuaranteeAlerts, getOpsAnalytics,
} from '../../lib/data';

const STAGE_COLORS: Record<string, string> = {
  Sourced: '#6B7280',
  Screening: '#2563EB',
  Interviewed: '#D97706',
  Offered: '#7C3AED',
  Placed: '#059669',
};

export default function OpsDashboardPage() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<ReturnType<typeof getOpsAnalytics> | null>(null);
  const [alerts, setAlerts] = useState<ReturnType<typeof getGuaranteeAlerts>>([]);


  const load = useCallback(() => {
    setAnalytics(getOpsAnalytics());
    setAlerts(getGuaranteeAlerts().slice(0, 3));
  }, []);

  useEffect(() => { 
    load(); 
    window.addEventListener('switch_data_update', load);
    return () => window.removeEventListener('switch_data_update', load);
  }, [load]);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
          Operations
        </div>
        <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800, color: 'var(--neutral-900)', letterSpacing: '-0.03em' }}>
          Dashboard
        </h1>
        <div style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
        {[
          { label: 'Pipeline', value: analytics?.totalPipeline || 0, icon: '🗂', color: 'var(--brand-green)' },
          { label: 'Placements', value: analytics?.placements || 0, icon: '✅', color: 'var(--success)' },
          { label: 'Conversion', value: `${analytics?.convRate || 0}%`, icon: '📈', color: '#7C3AED' },
          { label: 'Revenue', value: `₹${((analytics?.revenue || 0) / 1000).toFixed(0)}k`, icon: '💰', color: '#D4A017' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{
            background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)',
            borderRadius: 16, padding: '16px 14px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: `${color}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--neutral-900)', fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--neutral-500)', fontWeight: 600, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Funnel preview */}
      <div style={{ background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: 16, padding: 16, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--neutral-700)' }}>Pipeline Funnel</div>
          <button
            onClick={() => navigate('/ops/analytics')}
            style={{ fontSize: 12, color: 'var(--brand-green-mid)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Full →
          </button>
        </div>
        {analytics?.funnel.map((item, i) => {
          const maxCount = analytics.funnel[0]?.count || 1;
          const width = Math.max((item.count / maxCount) * 100, 5);
          const color = STAGE_COLORS[item.stage] || '#6B7280';
          return (
            <div key={item.stage} style={{ marginBottom: i < analytics.funnel.length - 1 ? 10 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--neutral-700)' }}>{item.stage}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--neutral-900)', fontFamily: 'DM Mono, monospace' }}>{item.count}</span>
              </div>
              <div style={{ height: 8, background: 'var(--neutral-200)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${width}%`, background: color, borderRadius: 4, transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Guarantee alerts */}
      {alerts.some((a) => a.daysLeft < 7) && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ⚠️ Guarantee Alerts
            </div>
            <button
              onClick={() => navigate('/ops/pipeline')}
              style={{ fontSize: 12, color: 'var(--brand-green-mid)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              View all →
            </button>
          </div>
          {alerts.filter((a) => a.daysLeft < 7 && a.daysLeft >= 0).map((c) => (
            <div key={c.id} style={{
              background: 'var(--danger-light)', border: '1.5px solid rgba(220,38,38,0.2)',
              borderRadius: 14, padding: '12px 14px', marginBottom: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--neutral-900)' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginTop: 2 }}>
                  {c.location} · {c.jobType}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--danger)', fontFamily: 'DM Mono, monospace' }}>{c.daysLeft}d</div>
                <div style={{ fontSize: 10, color: 'var(--neutral-500)' }}>left</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: 'Manage Pipeline', icon: '🗂', to: '/ops/pipeline', color: 'var(--brand-green)' },
          { label: 'View Captains', icon: '👷', to: '/ops/captains', color: '#7C3AED' },
          { label: 'Analytics', icon: '📈', to: '/ops/analytics', color: '#D4A017' },
          { label: 'Settings', icon: '⚙️', to: '/ops/settings', color: 'var(--neutral-700)' },
        ].map(({ label, icon, to }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            style={{
              padding: '16px 14px', borderRadius: 16, cursor: 'pointer',
              background: 'var(--neutral-50)', border: '1.5px solid var(--neutral-200)',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
              fontFamily: 'inherit', transition: 'transform 0.15s',
              textAlign: 'left',
            }}
            onPointerDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
            onPointerUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ fontSize: 24 }}>{icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--neutral-900)' }}>{label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
