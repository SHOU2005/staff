import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Loader2 } from 'lucide-react';
import {
  fetchSocialMembers, searchSocialMembers, getAvatarColors, getInitials,
  getRegColorStyle, subscribeToSocialFeed, type SocialMember,
} from '../../lib/social';
import { getSettings } from '../../lib/data';

type TabFilter = 'all' | 'captain' | 'available';

export default function CommunityMembersPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<TabFilter>('all');
  const [cityFilter, setCityFilter] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [allMembers, setAllMembers] = useState<SocialMember[]>([]);
  const [members, setMembers] = useState<SocialMember[]>([]);
  const [loading, setLoading] = useState(true);
  const settings = getSettings();

  const loadAll = useCallback(async () => {
    const data = await fetchSocialMembers();
    setAllMembers(data.filter(m => m.isActive));
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadAll();
  }, [loadAll]);

  // Realtime
  useEffect(() => {
    const unsub = subscribeToSocialFeed(() => loadAll());
    return unsub;
  }, [loadAll]);

  // Filter locally after fetch
  useEffect(() => {
    const applyFilters = async () => {
      let base = query ? await searchSocialMembers(query) : allMembers;
      if (tab === 'captain') base = base.filter(m => m.role === 'captain');
      if (tab === 'available') base = base.filter(m => m.role === 'worker' && !m.badges.includes('placed'));
      if (cityFilter) base = base.filter(m => m.city.toLowerCase().includes(cityFilter.toLowerCase()));
      if (jobFilter) base = base.filter(m => m.jobType.toLowerCase().includes(jobFilter.toLowerCase()));
      setMembers(base);
    };
    applyFilters();
  }, [query, tab, cityFilter, jobFilter, allMembers]);

  const totalAll     = allMembers.length;
  const totalCaptain = allMembers.filter(m => m.role === 'captain').length;
  const totalAvail   = allMembers.filter(m => m.role === 'worker' && !m.badges.includes('placed')).length;
  const cities = [...new Set(allMembers.filter(m => m.city).map(m => m.city))];

  const TABS: { value: TabFilter; label: string }[] = [
    { value: 'all',       label: `सभी सदस्य (${totalAll})` },
    { value: 'captain',   label: `Captain (${totalCaptain})` },
    { value: 'available', label: `उपलब्ध (${totalAvail})` },
  ];

  const selectStyle = {
    padding: '0 10px', height: 36, borderRadius: 10, border: '1.5px solid var(--neutral-200)',
    fontSize: 12, fontFamily: 'inherit', outline: 'none', appearance: 'none' as const,
    background: '#fff', color: 'var(--neutral-700)', cursor: 'pointer',
  };

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Switch</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--neutral-900)', letterSpacing: '-0.03em' }}>Community</div>
      </div>

      {/* Filter dropdowns */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} style={{ ...selectStyle, width: '100%', paddingRight: 24 }}>
            <option value="">राज्य/शहर ▾</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--neutral-400)' }} />
        </div>
        <div style={{ position: 'relative', flex: 1 }}>
          <select value={jobFilter} onChange={e => setJobFilter(e.target.value)} style={{ ...selectStyle, width: '100%', paddingRight: 24 }}>
            <option value="">नौकरी चुनें ▾</option>
            {settings.jobTypes.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--neutral-400)' }} />
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="नाम या रजि. क्र. से सर्च करें"
          style={{ width: '100%', height: 42, paddingLeft: 36, paddingRight: 12, borderRadius: 12, border: '1.5px solid var(--neutral-200)', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: 'var(--neutral-900)' }} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--neutral-200)', marginBottom: 14 }}>
        {TABS.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)} style={{
            padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 12, fontWeight: tab === t.value ? 800 : 600,
            color: tab === t.value ? 'var(--brand-green)' : 'var(--neutral-500)',
            borderBottom: `2px solid ${tab === t.value ? 'var(--brand-green-mid)' : 'transparent'}`,
            marginBottom: -1, whiteSpace: 'nowrap',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand-green)' }} /></div>}

      {/* Empty state */}
      {!loading && members.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--neutral-400)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
          {query
            ? <><div style={{ fontWeight: 700, fontSize: 15, color: 'var(--neutral-700)', marginBottom: 4 }}>"{query}" के लिए कोई सदस्य नहीं मिला</div><div style={{ fontSize: 13 }}>नाम, रजि. क्र., या शहर से खोजें</div></>
            : <div style={{ fontSize: 14 }}>अभी कोई सदस्य नहीं</div>
          }
        </div>
      )}

      {/* Member cards */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {members.map(member => (
            <MemberCard key={member.id} member={member} onClick={() => navigate(`/captain/community/member/${member.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

export function MemberCard({ member, onClick }: { member: SocialMember; onClick?: () => void }) {
  const avatarCols = getAvatarColors(member.regNumber);
  const regStyle = getRegColorStyle(member.role);

  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: 16, padding: '14px', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: avatarCols.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: avatarCols.text, flexShrink: 0, border: member.isVerified ? '2px solid var(--brand-green-mid)' : '2px solid transparent' }}>
        {getInitials(member.name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--neutral-900)' }}>{member.name}</span>
          {member.isVerified && <span style={{ fontSize: 11 }}>✓</span>}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
          {member.city.toUpperCase()}, {member.state.toUpperCase()}
        </div>
        {/* THE KUTUMB SIGNATURE — red-border reg number pill */}
        <div style={{ marginBottom: 7 }}>
          <span style={{ display: 'inline-block', border: `1.5px solid ${regStyle.border}`, color: regStyle.color, background: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 500, letterSpacing: '0.01em' }}>
            रजि. क्र.- {member.regNumber}
          </span>
          {member.role === 'captain' && <span style={{ marginLeft: 6, fontSize: 10, padding: '2px 7px', borderRadius: 99, background: '#FAEEDA', color: '#854F0B', fontWeight: 700 }}>⚡ Captain</span>}
          {member.role === 'ops' && <span style={{ marginLeft: 6, fontSize: 10, padding: '2px 7px', borderRadius: 99, background: '#EEEDFE', color: '#534AB7', fontWeight: 700 }}>✅ Official</span>}
        </div>
        <p lang="hi" style={{ margin: 0, fontSize: 12, color: 'var(--neutral-500)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {member.bio}
        </p>
      </div>
    </button>
  );
}
