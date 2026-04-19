import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, MessageCircle, Plus, Search } from 'lucide-react';
import { useRole } from '../../contexts/RoleContext';
import {
  getCandidates, type Candidate,
  getInitials,
} from '../../lib/data';

const STAGE_FILTERS = ['All', 'Sourced', 'Screening', 'Interviewed', 'Offered', 'Placed', '⚠️ Alerts'] as const;

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  Sourced:     { bg: 'rgba(107,114,128,0.12)', text: '#6B7280' },
  Screening:   { bg: 'rgba(37,99,235,0.12)',   text: '#2563EB' },
  Interviewed: { bg: 'rgba(217,119,6,0.12)',   text: '#D97706' },
  Offered:     { bg: 'rgba(124,58,237,0.12)',  text: '#7C3AED' },
  Placed:      { bg: 'rgba(5,150,105,0.12)',   text: '#059669' },
};

export default function MyLeadsPage() {
  const { captainId } = useRole();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    const all = getCandidates().filter((c) => c.referredBy === captainId);
    all.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    setCandidates(all);
  }, [captainId]);

  useEffect(() => { 
    load(); 
    window.addEventListener('switch_data_update', load);
    return () => window.removeEventListener('switch_data_update', load);
  }, [load]);

  const getGuaranteeAlertIds = () => {
    return candidates
      .filter((c) => {
        if (c.currentStage !== 'Placed' || !c.guaranteeExpiresAt) return false;
        const daysLeft = (new Date(c.guaranteeExpiresAt).getTime() - Date.now()) / 86400000;
        return daysLeft < 7;
      })
      .map((c) => c.id);
  };

  const alertIds = getGuaranteeAlertIds();

  const filtered = candidates.filter((c) => {
    const matchesFilter = filter === 'All' ? true : filter === '⚠️ Alerts' ? alertIds.includes(c.id) : c.currentStage === filter;
    const matchesSearch = search === '' ? true : c.name.toLowerCase().includes(search.toLowerCase()) || c.mobile.includes(search);
    return matchesFilter && matchesSearch;
  });

  const getDaysInStage = (c: Candidate) => {
    const last = c.timeline[c.timeline.length - 1];
    if (!last) return 0;
    return Math.floor((Date.now() - new Date(last.movedAt).getTime()) / 86400000);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:800, color:'var(--brand-green-mid)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:3 }}>My Leads</div>
          <h1 style={{ margin:0, fontSize:24, fontWeight:800, letterSpacing:'-0.03em', color:'var(--neutral-900)' }}>Candidates</h1>
          <div style={{ fontSize:13, color:'var(--neutral-500)', marginTop:4 }}>
            {candidates.length} total · {candidates.filter(c => c.currentStage==='Placed').length} placed
          </div>
        </div>
        <button
          onClick={() => navigate('/captain/leads/new')}
          style={{
            width:44, height:44, borderRadius:13,
            background:'linear-gradient(135deg, #2EA86A, #1A7A4A)',
            border:'none', color:'#fff', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 4px 14px rgba(46,168,106,0.4)', flexShrink:0,
          }}
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* Search bar */}
      <div style={{ position:'relative', marginBottom:14 }}>
        <Search size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--neutral-400)', pointerEvents:'none' }} />
        <input
          type="text" value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or number..."
          style={{
            width:'100%', height:44, padding:'0 14px 0 42px',
            borderRadius:12, border:'1.5px solid var(--neutral-200)',
            fontSize:14, fontFamily:'inherit', outline:'none',
            color:'var(--neutral-900)', background:'#fff', boxSizing:'border-box',
            transition:'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor='var(--brand-green-mid)'}
          onBlur={e => e.target.style.borderColor='var(--neutral-200)'}
        />
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2, marginBottom: 14, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        {STAGE_FILTERS.map((s) => (
          <button
            key={s}
            id={`filter-${s.replace(/[^a-z]/gi, '')}`}
            onClick={() => setFilter(s)}
            style={{
              padding: '7px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
              whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'inherit',
              border: '1.5px solid',
              borderColor: filter === s ? 'var(--brand-green-mid)' : 'var(--neutral-200)',
              background: filter === s ? 'var(--brand-green-light)' : 'transparent',
              color: filter === s ? 'var(--brand-green)' : 'var(--neutral-500)',
              transition: 'all 0.2s',
            }}
          >
            {s}
            {s === '⚠️ Alerts' && alertIds.length > 0 && (
              <span style={{ marginLeft: 4, background: 'var(--danger)', color: '#fff', borderRadius: 99, padding: '1px 5px', fontSize: 9 }}>
                {alertIds.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--neutral-500)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--neutral-700)' }}>No candidates yet</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Tap + to add your first lead</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((c) => {
            const sc = STAGE_COLORS[c.currentStage] || { bg: '#f3f4f6', text: '#6B7280' };
            const daysInStage = getDaysInStage(c);
            const isAlert = alertIds.includes(c.id);
            return (
              <div
                key={c.id}
                id={`lead-${c.id}`}
                onClick={() => navigate(`/captain/leads/${c.id}`)}
                style={{
                  background: isAlert ? 'var(--danger-light)' : 'var(--neutral-50)',
                  border: `1.5px solid ${isAlert ? 'rgba(220,38,38,0.2)' : 'var(--neutral-200)'}`,
                  borderRadius: 16, padding: '14px 16px', cursor: 'pointer',
                  transition: 'transform 0.15s',
                }}
                onPointerDown={(e) => e.currentTarget.style.transform = 'scale(0.99)'}
                onPointerUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                    background: `linear-gradient(135deg, var(--brand-green-light), rgba(46,168,106,0.15))`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, color: 'var(--brand-green)',
                  }}>
                    {getInitials(c.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--neutral-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.name}
                      </div>
                      <span style={{
                        padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                        background: sc.bg, color: sc.text, flexShrink: 0, marginLeft: 8,
                      }}>
                        {c.currentStage}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--neutral-500)' }}>
                      🔧 {c.jobType} · 📍 {c.location}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--neutral-500)', fontFamily: 'DM Mono, monospace' }}>
                        📞 {c.mobile.slice(0, 5)}-{c.mobile.slice(5)}
                      </span>
                      <span style={{ fontSize: 11, color: isAlert ? 'var(--danger)' : 'var(--neutral-500)', fontWeight: 600 }}>
                        ⏱ {daysInStage}d in stage
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
                  <a
                    href={`tel:${c.mobile}`}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: 'rgba(46,168,106,0.1)', border: '1px solid rgba(46,168,106,0.2)',
                      borderRadius: 10, padding: '8px', fontSize: 12, fontWeight: 700,
                      color: 'var(--brand-green)', textDecoration: 'none',
                    }}
                  >
                    <Phone size={13} /> Call
                  </a>
                  <a
                    href={`https://wa.me/91${c.mobile}?text=${encodeURIComponent(`Hi ${c.name}! Switch Hiring Team यहाँ से हूँ। आपकी job के बारे में बात करनी थी। 😊`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: 'linear-gradient(135deg, #25D366, #128C7E)', borderRadius: 10,
                      padding: '8px', fontSize: 12, fontWeight: 700, color: '#fff', textDecoration: 'none',
                    }}
                  >
                    <MessageCircle size={13} /> WhatsApp
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
