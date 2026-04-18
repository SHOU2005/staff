import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCommunitiesForOps, getCommunityHealthScore, sendBroadcast, type Community } from '../../lib/community';
import toast from 'react-hot-toast';

export default function OpsCommunityPage() {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<(Community & { healthScore: number; captain: any })[]>([]);
  const [showGlobalBroadcast, setShowGlobalBroadcast] = useState(false);
  const [gbMessage, setGbMessage] = useState('');

  const load = useCallback(() => {
    setCommunities(getAllCommunitiesForOps());
  }, []);

  useEffect(() => { load(); window.addEventListener('switch_data_update', load); return () => window.removeEventListener('switch_data_update', load); }, [load]);

  const totalMembers   = communities.reduce((s, c) => s + c.stats.totalMembers, 0);
  const totalAvailable = communities.reduce((s, c) => s + c.stats.available, 0);
  const totalRehires   = communities.reduce((s, c) => s + c.stats.rehires, 0);

  const handleGlobalBroadcast = () => {
    if (!gbMessage.trim()) { toast.error('Enter a message'); return; }
    communities.forEach(comm => {
      sendBroadcast('ops_001', comm.id, 'Urgent Requirement', 'Multiple locations', '', gbMessage, { jobTypes: [], availableOnly: false });
    });
    toast.success(`📣 Broadcast sent to all ${communities.length} communities (${totalMembers} workers)!`);
    setShowGlobalBroadcast(false);
    setGbMessage('');
  };

  const stats = [
    { label: 'Communities', value: communities.length, icon: '🏘️', color: 'var(--brand-green)' },
    { label: 'Total Workers', value: totalMembers, icon: '👥', color: '#185FA5' },
    { label: 'Available', value: totalAvailable, icon: '✅', color: '#854F0B' },
    { label: 'Re-hires', value: totalRehires, icon: '⟳', color: '#534AB7' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#D4A017', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Ops View</div>
        <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: 'var(--neutral-900)', letterSpacing: '-0.03em' }}>All Communities</h1>
        <div style={{ fontSize: 13, color: 'var(--neutral-500)' }}>Super-view across all captain talent pools</div>
      </div>

      {/* Summary grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {stats.map(stat => (
          <div key={stat.label} style={{ background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: 16, padding: '14px' }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{stat.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: stat.color, letterSpacing: '-0.03em' }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'var(--neutral-500)', fontWeight: 600, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Global broadcast button */}
      <button onClick={() => setShowGlobalBroadcast(true)} style={{ width: '100%', height: 46, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#D4A017,#b87d12)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        📣 Broadcast to ALL communities · Reach {totalMembers} workers
      </button>

      {/* Community list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {communities.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--neutral-400)' }}>No communities yet. They auto-create when captains submit their first lead.</div>
        )}
        {communities.map(comm => {
          const health = getCommunityHealthScore(comm);
          return (
            <div key={comm.id} style={{ background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ height: 6, background: comm.coverColor }} />
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: comm.coverColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                    {comm.captainName[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--neutral-900)' }}>{comm.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--neutral-500)' }}>by {comm.captainName}</div>
                  </div>
                  <div>
                    {[...Array(5)].map((_, i) => (
                      <span key={i} style={{ fontSize: 12, color: i < health ? '#D4A017' : 'var(--neutral-200)' }}>●</span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {[
                    { label: `${comm.stats.totalMembers} members`, color: 'var(--neutral-600)' },
                    { label: `${comm.stats.activePlacements} placed`, color: '#185FA5' },
                    { label: `${comm.stats.rehires} re-hires`, color: '#534AB7' },
                  ].map(pill => (
                    <div key={pill.label} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, background: 'var(--neutral-100)', color: pill.color, fontWeight: 600 }}>{pill.label}</div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => navigate(`/ops/communities/${comm.id}`)} style={{ flex: 1, height: 36, borderRadius: 10, border: '1.5px solid var(--neutral-200)', background: 'transparent', color: 'var(--neutral-700)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    View
                  </button>
                  <button onClick={() => {
                    sendBroadcast('ops_001', comm.id, 'Job Opportunity', comm.captain?.mobile || '', '', 'New opportunity available! Contact your captain for details.', { jobTypes: [], availableOnly: false });
                    toast.success(`Broadcast sent to ${comm.name}!`);
                  }} style={{ flex: 1, height: 36, borderRadius: 10, border: 'none', background: '#D4A017', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    📣 Broadcast
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global broadcast sheet */}
      {showGlobalBroadcast && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={() => setShowGlobalBroadcast(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
          <div style={{ position: 'relative', width: '100%', background: '#fff', borderRadius: '22px 22px 0 0', padding: '20px 20px 40px', zIndex: 101 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--neutral-200)', margin: '0 auto 20px' }} />
            <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: 'var(--neutral-900)' }}>Global Community Broadcast</h2>
            <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginBottom: 16 }}>
              Will reach {totalMembers} workers across {communities.length} communities
            </div>
            <textarea value={gbMessage} onChange={e => setGbMessage(e.target.value.slice(0, 200))} placeholder="Enter your message for all workers..." rows={4} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid var(--neutral-200)', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
            <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--neutral-400)', marginBottom: 16 }}>{gbMessage.length}/200</div>
            <button onClick={handleGlobalBroadcast} style={{ width: '100%', height: 50, borderRadius: 14, border: 'none', background: '#D4A017', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              Send to ALL {communities.length} communities
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
