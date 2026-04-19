import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, ChevronDown, Search } from 'lucide-react';
import {
  fetchFeed, getAvatarColors, getInitials, getRegColorStyle,
  timeAgoHindi, subscribeToSocialFeed, type SocialPost,
} from '../../lib/social';
import { getJobs, getSettings, type Job } from '../../lib/data';

const URGENCY_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  high:   { bg: '#FEE2E2', color: '#DC2626', label: '🔴 URGENT' },
  medium: { bg: '#FFFBEB', color: '#D97706', label: '🟡 NORMAL' },
  low:    { bg: '#F0FDF4', color: '#059669', label: '🟢 OPEN'   },
};

function OpsJobCard({ job, onAddLead }: { job: Job; onAddLead: (j: Job) => void }) {
  const shareText = `🎯 नौकरी का मौका!\nPost: ${job.role}\n📍 ${job.location}, Gurgaon\n💰 ${job.salaryRange}\n${job.openings - job.filled} slot${job.openings - job.filled > 1 ? 's' : ''} available\n\nInterested? Call / WhatsApp करें। — Switch`;
  const badge = URGENCY_BADGE[job.urgency] || URGENCY_BADGE.low;
  const slots = job.openings - job.filled;

  return (
    <div style={{ background: '#fff', border: '1.5px solid var(--neutral-200)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      {/* Top accent */}
      <div style={{ height: 4, background: job.urgency === 'high' ? 'linear-gradient(90deg, #DC2626, #EF4444)' : job.urgency === 'medium' ? 'linear-gradient(90deg, #D97706, #F59E0B)' : 'linear-gradient(90deg, #059669, #10B981)' }} />
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--neutral-900)', letterSpacing: '-0.01em' }}>{job.role}</div>
            <div style={{ fontSize: 13, color: 'var(--neutral-500)', marginTop: 3 }}>📍 {job.location}, Gurgaon</div>
          </div>
          <span style={{ fontSize: 11, padding: '4px 9px', borderRadius: 8, background: badge.bg, color: badge.color, fontWeight: 800, flexShrink: 0, marginLeft: 10 }}>
            {badge.label}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--brand-green)', fontFamily: 'DM Mono, monospace' }}>{job.salaryRange}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: slots > 0 ? 'var(--brand-green)' : 'var(--danger)', fontWeight: 700 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: slots > 0 ? 'var(--brand-green)' : 'var(--danger)' }} />
            {slots} slot{slots !== 1 ? 's' : ''} open
          </div>
        </div>

        {job.description && (
          <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--neutral-600)', lineHeight: 1.5 }}>{job.description}</p>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onAddLead(job)}
            style={{ flex: 2, height: 42, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #2EA86A, #1A7A4A)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            👤 Refer a Candidate
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank" rel="noreferrer"
            style={{ flex: 1, height: 42, borderRadius: 12, border: '1.5px solid rgba(37,211,102,0.35)', background: 'rgba(37,211,102,0.06)', color: '#25D366', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}
          >
            <Share2 size={13} /> Share
          </a>
        </div>
      </div>
    </div>
  );
}

function CommunityJobCard({ post, onNavigate }: { post: SocialPost; onNavigate: () => void }) {
  const jd = post.jobDetails;
  const avatarCols = getAvatarColors(post.authorRegNumber);
  const regStyle   = getRegColorStyle(post.authorRole);
  const isNew      = Date.now() - new Date(post.postedAt).getTime() < 48 * 3600000;

  return (
    <div style={{ background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: 16, overflow: 'hidden' }}>
      {post.featured && <div style={{ background: 'var(--brand-green-mid)', padding: '4px 14px', fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>⭐ Featured</div>}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--neutral-900)' }}>{jd?.role || 'Job Opening'}</div>
            <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginTop: 2 }}>📍 {jd?.location}</div>
          </div>
          {isNew && <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, background: '#DBEAFE', color: '#1D4ED8', fontWeight: 800, flexShrink: 0 }}>NEW</span>}
        </div>

        {jd?.salary && <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand-green)', marginBottom: 10, fontFamily: 'DM Mono, monospace' }}>{jd.salary}</div>}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: avatarCols.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: avatarCols.text }}>
            {getInitials(post.authorName)}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--neutral-700)' }}>{post.authorName}</span>
          <span style={{ border: `1.5px solid ${regStyle.border}`, color: regStyle.color, borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 500 }}>{post.authorRegNumber}</span>
          <span style={{ fontSize: 11, color: 'var(--neutral-400)', marginLeft: 'auto' }}>{timeAgoHindi(post.postedAt)}</span>
        </div>

        {post.content && (
          <p lang="hi" style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--neutral-600)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.content}</p>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {jd?.contactWhatsApp
            ? <a href={`https://wa.me/91${jd.contactWhatsApp}`} target="_blank" rel="noreferrer" style={{ flex: 1, height: 40, borderRadius: 11, background: '#25D366', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>💬 WhatsApp</a>
            : <button onClick={onNavigate} style={{ flex: 1, height: 40, borderRadius: 11, border: '1.5px solid var(--neutral-200)', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', color: 'var(--neutral-700)' }}>देखें →</button>
          }
        </div>
      </div>
    </div>
  );
}

export default function JobBoardPage() {
  const navigate    = useNavigate();
  const settings    = getSettings();
  const opsJobs     = getJobs().filter(j => j.active);
  const [tab, setTab]           = useState<'ops' | 'community'>('ops');
  const [communityJobs, setCommunityJobs] = useState<SocialPost[]>([]);
  const [roleFilter, setRoleFilter]       = useState('');
  const [locFilter, setLocFilter]         = useState('');
  const [search, setSearch]               = useState('');
  const [loading, setLoading]             = useState(true);

  const loadCommunity = useCallback(async () => {
    const list = await fetchFeed('job_available');
    setCommunityJobs(list);
    setLoading(false);
  }, []);

  useEffect(() => { loadCommunity(); }, [loadCommunity]);
  useEffect(() => { const u = subscribeToSocialFeed(() => loadCommunity()); return u; }, [loadCommunity]);

  const filteredOps = opsJobs.filter(j => {
    const q = search.toLowerCase();
    if (q && !j.role.toLowerCase().includes(q) && !j.location.toLowerCase().includes(q)) return false;
    if (roleFilter && !j.role.toLowerCase().includes(roleFilter.toLowerCase())) return false;
    if (locFilter && !j.location.toLowerCase().includes(locFilter.toLowerCase())) return false;
    return true;
  });

  const filteredCommunity = communityJobs.filter(p => {
    const jd = p.jobDetails;
    if (roleFilter && !jd?.role.toLowerCase().includes(roleFilter.toLowerCase())) return false;
    if (locFilter && !jd?.location.toLowerCase().includes(locFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: 10, border: '1.5px solid var(--neutral-200)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ArrowLeft size={16} color="var(--neutral-700)" />
        </button>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-green-mid)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Community</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--neutral-900)', letterSpacing: '-0.03em' }}>Job Board</div>
        </div>
        <div style={{ marginLeft: 'auto', background: 'var(--brand-green-light)', borderRadius: 10, padding: '6px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--brand-green)', fontFamily: 'DM Mono, monospace' }}>{opsJobs.length + communityJobs.length}</div>
          <div style={{ fontSize: 9, color: 'var(--brand-green)', fontWeight: 700, textTransform: 'uppercase' }}>Jobs</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)', pointerEvents: 'none' }} />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search jobs…"
          style={{ width: '100%', height: 42, padding: '0 14px 0 40px', borderRadius: 12, border: '1.5px solid var(--neutral-200)', fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff', color: 'var(--neutral-900)', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
          onFocus={e => e.target.style.borderColor = 'var(--brand-green-mid)'}
          onBlur={e => e.target.style.borderColor = 'var(--neutral-200)'}
        />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--neutral-400)' }} />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ width: '100%', height: 38, padding: '0 28px 0 10px', borderRadius: 10, border: '1.5px solid var(--neutral-200)', fontSize: 12, fontFamily: 'inherit', outline: 'none', appearance: 'none', background: '#fff', color: roleFilter ? 'var(--neutral-900)' : 'var(--neutral-500)', cursor: 'pointer' }}>
            <option value="">All Job Types</option>
            {settings.jobTypes.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
        <div style={{ position: 'relative', flex: 1 }}>
          <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--neutral-400)' }} />
          <select value={locFilter} onChange={e => setLocFilter(e.target.value)} style={{ width: '100%', height: 38, padding: '0 28px 0 10px', borderRadius: 10, border: '1.5px solid var(--neutral-200)', fontSize: 12, fontFamily: 'inherit', outline: 'none', appearance: 'none', background: '#fff', color: locFilter ? 'var(--neutral-900)' : 'var(--neutral-500)', cursor: 'pointer' }}>
            <option value="">All Locations</option>
            {settings.locations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        {(roleFilter || locFilter || search) && (
          <button onClick={() => { setRoleFilter(''); setLocFilter(''); setSearch(''); }} style={{ height: 38, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--neutral-200)', background: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', color: 'var(--danger)', fontWeight: 700 }}>✕</button>
        )}
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1.5px solid var(--neutral-200)', marginBottom: 16 }}>
        {([
          { key: 'ops',       label: '🏢 Switch Jobs', count: filteredOps.length },
          { key: 'community', label: '👥 Community',   count: filteredCommunity.length },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '9px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 13, fontWeight: tab === t.key ? 800 : 600,
            color: tab === t.key ? 'var(--brand-green)' : 'var(--neutral-500)',
            borderBottom: `2.5px solid ${tab === t.key ? 'var(--brand-green-mid)' : 'transparent'}`,
            marginBottom: -2, display: 'flex', alignItems: 'center', gap: 7,
          }}>
            {t.label}
            <span style={{ padding: '1px 7px', borderRadius: 99, background: tab === t.key ? 'var(--brand-green-light)' : 'var(--neutral-100)', color: tab === t.key ? 'var(--brand-green)' : 'var(--neutral-500)', fontSize: 11, fontWeight: 800 }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Ops jobs */}
      {tab === 'ops' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredOps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--neutral-400)' }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>💼</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>No jobs match your filters</div>
              <div style={{ fontSize: 13 }}>Try clearing the filters above</div>
            </div>
          ) : (
            filteredOps.map(job => (
              <OpsJobCard
                key={job.id}
                job={job}
                onAddLead={j => navigate(`/captain/leads/new?jobId=${j.id}`)}
              />
            ))
          )}
        </div>
      )}

      {/* Community jobs */}
      {tab === 'community' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} style={{ height: 140, borderRadius: 16, background: 'var(--neutral-200)', animation: 'shimmer 1.4s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg,var(--neutral-200) 25%,var(--neutral-100) 50%,var(--neutral-200) 75%)' }} />
            ))
          ) : filteredCommunity.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--neutral-400)' }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>📭</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>No community job posts</div>
              <button onClick={() => navigate('/captain/community/compose')} style={{ marginTop: 10, padding: '10px 20px', borderRadius: 12, border: 'none', background: 'var(--brand-green-mid)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>+ Post a job</button>
            </div>
          ) : (
            filteredCommunity.map(post => (
              <CommunityJobCard
                key={post.id}
                post={post}
                onNavigate={() => navigate(`/captain/community/post/${post.id}`)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
