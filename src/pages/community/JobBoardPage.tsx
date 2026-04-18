import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import {
  getSocialFeed, getAvatarColors, getInitials, getRegColorStyle,
  timeAgoHindi, type SocialPost,
} from '../../lib/social';
import { getSettings } from '../../lib/data';

export default function JobBoardPage() {
  const navigate = useNavigate();
  const settings = getSettings();
  const [jobs, setJobs] = useState<SocialPost[]>([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [locFilter, setLocFilter] = useState('');

  const load = useCallback(() => {
    let list = getSocialFeed('job_available');
    if (roleFilter) list = list.filter(p => p.jobDetails?.role.toLowerCase().includes(roleFilter.toLowerCase()));
    if (locFilter) list = list.filter(p => p.jobDetails?.location.toLowerCase().includes(locFilter.toLowerCase()));
    setJobs(list);
  }, [roleFilter, locFilter]);

  useEffect(() => { load(); }, [load]);

  const selectStyle = {
    flex: 1, height: 38, padding: '0 10px', borderRadius: 10, border: '1.5px solid var(--neutral-200)',
    fontSize: 12, fontFamily: 'inherit', outline: 'none', appearance: 'none' as const,
    background: '#fff', color: 'var(--neutral-700)', cursor: 'pointer',
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Community</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--neutral-900)', letterSpacing: '-0.03em' }}>नौकरी खोजें</div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={selectStyle}>
            <option value="">Job type ▾</option>
            {settings.jobTypes.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--neutral-400)' }} />
        </div>
        <div style={{ position: 'relative', flex: 1 }}>
          <select value={locFilter} onChange={e => setLocFilter(e.target.value)} style={selectStyle}>
            <option value="">Location ▾</option>
            {settings.locations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--neutral-400)' }} />
        </div>
        {(roleFilter || locFilter) && (
          <button onClick={() => { setRoleFilter(''); setLocFilter(''); }} style={{ height: 38, padding: '0 10px', borderRadius: 10, border: '1.5px solid var(--neutral-200)', background: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', color: 'var(--neutral-600)' }}>
            ✕
          </button>
        )}
      </div>

      {/* Job count */}
      <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginBottom: 12, fontWeight: 600 }}>
        {jobs.length} नौकरियां उपलब्ध हैं
      </div>

      {/* Empty */}
      {jobs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--neutral-400)' }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>💼</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>अभी कोई नौकरी नहीं</div>
          <div style={{ fontSize: 13 }}>फ़िल्टर बदलकर देखें</div>
        </div>
      )}

      {/* Job cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {jobs.map(post => {
          const jd = post.jobDetails;
          const avatarCols = getAvatarColors(post.authorRegNumber);
          const regStyle = getRegColorStyle(post.authorRole);
          const isUrgent = Date.now() - new Date(post.postedAt).getTime() < 24 * 3600000;
          return (
            <div key={post.id} style={{ background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: 16, overflow: 'hidden' }}>
              {post.featured && (
                <div style={{ background: 'var(--brand-green-mid)', padding: '4px 14px', fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  ⭐ Featured
                </div>
              )}
              <div style={{ padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--neutral-900)' }}>{jd?.role || 'Job Opening'}</div>
                    <div style={{ fontSize: 13, color: 'var(--neutral-600)', marginTop: 2 }}>{jd?.location}</div>
                  </div>
                  {isUrgent && (
                    <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, background: '#FEE2E2', color: '#DC2626', fontWeight: 800 }}>URGENT 🔴</span>
                  )}
                </div>
                {jd?.salary && (
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand-green)', marginBottom: 10 }}>{jd.salary}</div>
                )}

                {/* Author */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: avatarCols.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: avatarCols.text }}>
                    {getInitials(post.authorName)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--neutral-700)' }}>{post.authorName}</span>
                    <span style={{ border: `1.5px solid ${regStyle.border}`, color: regStyle.color, background: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 500 }}>
                      {post.authorRegNumber}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--neutral-400)' }}>· {timeAgoHindi(post.postedAt)}</span>
                  </div>
                </div>

                {/* Snippet */}
                <p lang="hi" style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--neutral-600)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {post.content}
                </p>

                {/* CTA */}
                {jd?.contactWhatsApp && (
                  <a href={`https://wa.me/91${jd.contactWhatsApp}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 12, background: '#25D366', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 800 }}>
                    📞 WhatsApp पर संपर्क करें
                  </a>
                )}
                {!jd?.contactWhatsApp && (
                  <button onClick={() => navigate(`/captain/community/post/${post.id}`)} style={{ width: '100%', padding: '10px', borderRadius: 12, border: '1.5px solid var(--neutral-200)', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', color: 'var(--neutral-700)' }}>
                    विवरण देखें →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
