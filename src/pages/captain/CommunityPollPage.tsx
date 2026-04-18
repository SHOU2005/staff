import { useState, useEffect } from 'react';
import { useRole } from '../../contexts/RoleContext';
import { createPoll, getActivePollForCommunity, getCommunity, type Poll } from '../../lib/community';
import toast from 'react-hot-toast';

export default function CommunityPollPage() {
  const { captainId } = useRole();
  const community = getCommunity(captainId);
  const [activePoll, setActivePoll] = useState<Poll | undefined>();
  const [options, setOptions] = useState(['Available now', 'Available next week', 'Currently working']);
  const [expiryDays, setExpiryDays] = useState(7);

  useEffect(() => {
    if (community) setActivePoll(getActivePollForCommunity(community.id));
  }, [community]);

  if (!community) return <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--neutral-400)' }}>Create your community first.</div>;

  const handleLaunch = () => {
    if (options.filter(o => o.trim()).length < 2) { toast.error('Add at least 2 options'); return; }
    createPoll(community.id, options.filter(o => o.trim()), expiryDays);
    toast.success('Poll launched! 🎉');
    setActivePoll(getActivePollForCommunity(community.id));
  };

  const totalResponses = activePoll ? Object.keys(activePoll.responses).length : 0;
  const daysLeft = activePoll ? Math.max(0, Math.ceil((new Date(activePoll.expiresAt).getTime() - Date.now()) / 86400000)) : 0;

  const getShareText = () => {
    if (!activePoll) return '';
    const counts: Record<string, number> = {};
    activePoll.options.forEach(o => { counts[o] = 0; });
    Object.values(activePoll.responses).forEach(r => { if (counts[r] !== undefined) counts[r]++; });
    const lines = activePoll.options.map(o => `${o}: ${counts[o]} workers`).join('\n');
    return `Availability update from ${community.name}:\n\n${lines}\n\n— Sent via Switch Captain App`;
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Community</div>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: 'var(--neutral-900)', letterSpacing: '-0.03em' }}>Availability Poll</h1>
        <div style={{ fontSize: 13, color: 'var(--neutral-500)' }}>{community.name}</div>
      </div>

      {/* Active poll results */}
      {activePoll && (
        <div style={{ background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: 18, padding: '18px', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--neutral-900)', marginBottom: 16 }}>{activePoll.question}</div>
          {activePoll.options.map(option => {
            const count = Object.values(activePoll.responses).filter(r => r === option).length;
            const pct = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
            return (
              <div key={option} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-700)' }}>{option}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-green)' }}>{count} ({pct}%)</span>
                </div>
                <div style={{ height: 8, background: 'var(--neutral-100)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'var(--brand-green-mid)', borderRadius: 4, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 14, fontSize: 12, color: 'var(--neutral-400)', textAlign: 'center' }}>
            {totalResponses} of {community.stats.totalMembers} responded · Expires in {daysLeft} days
          </div>
          <a href={`https://wa.me/?text=${encodeURIComponent(getShareText())}`} target="_blank" rel="noreferrer" style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 12, background: '#25D366', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
            📤 Share results to ops via WhatsApp
          </a>
        </div>
      )}

      {/* Poll builder */}
      <div style={{ background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: 18, padding: '18px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--neutral-900)', marginBottom: 16 }}>
          {activePoll ? 'Create a new poll' : 'Launch a poll'}
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Question (fixed):
          </div>
          <div style={{ padding: '10px 12px', background: 'var(--neutral-100)', borderRadius: 10, fontSize: 13, color: 'var(--neutral-700)', fontStyle: 'italic' }}>
            "Who is available for work this week?"
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Options (max 4):</div>
          {options.map((opt, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input value={opt} onChange={e => { const o = [...options]; o[i] = e.target.value; setOptions(o); }} placeholder={`Option ${i + 1}`} style={{ flex: 1, height: 42, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--neutral-200)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
              {options.length > 2 && <button onClick={() => setOptions(options.filter((_, j) => j !== i))} style={{ width: 42, height: 42, borderRadius: 10, border: '1.5px solid var(--neutral-200)', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>×</button>}
            </div>
          ))}
          {options.length < 4 && (
            <button onClick={() => setOptions([...options, ''])} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: '1.5px dashed var(--neutral-200)', background: 'transparent', color: 'var(--neutral-500)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              + Add option
            </button>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Expires in</label>
          <select value={expiryDays} onChange={e => setExpiryDays(Number(e.target.value))} style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1.5px solid var(--neutral-200)', fontSize: 13, fontFamily: 'inherit', outline: 'none', appearance: 'none' }}>
            {[3, 5, 7, 14].map(d => <option key={d} value={d}>{d} days</option>)}
          </select>
        </div>

        <button onClick={handleLaunch} style={{ width: '100%', height: 50, borderRadius: 14, border: 'none', background: 'var(--brand-green-mid)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
          🚀 Launch poll →
        </button>
      </div>
    </div>
  );
}
