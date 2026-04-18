import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageCircle } from 'lucide-react';
import { useRole } from '../../contexts/RoleContext';
import {
  getCommunityMembers, getMemberStatusLabel, getMemberStatusColor,
  processRehire, type MemberStatus,
} from '../../lib/community';
import { addCandidate, getInitials, type Candidate } from '../../lib/data';
import toast from 'react-hot-toast';

type StatusFilter = 'all' | MemberStatus;

export default function CommunityMembersPage() {
  const { captainId } = useRole();
  const navigate = useNavigate();
  const [members, setMembers] = useState<(Candidate & { status: MemberStatus })[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [rehireTarget, setRehireTarget] = useState<(Candidate & { status: MemberStatus }) | null>(null);
  const [rehireJobType, setRehireJobType] = useState('');
  const [rehireLocation, setRehireLocation] = useState('');
  const [processing, setProcessing] = useState(false);

  const load = useCallback(() => {
    setMembers(getCommunityMembers(captainId));
  }, [captainId]);

  useEffect(() => { load(); }, [load]);

  const filtered = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.mobile.includes(search) || m.jobType.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || m.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleRehire = () => {
    if (!rehireTarget) return;
    setProcessing(true);
    const result = processRehire(rehireTarget.id, captainId, rehireJobType || rehireTarget.jobType, rehireLocation || rehireTarget.location, addCandidate);
    setProcessing(false);
    if (!result) { toast.error('Re-hire failed'); return; }
    toast.success(`${rehireTarget.name} re-submitted! You'll earn ₹${result.rehireEntry.payoutAmount} on placement. 🎉`);
    setRehireTarget(null);
    load();
    navigate('/captain/leads');
  };

  const filters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'available', label: 'Available' },
    { value: 'placed', label: 'Placed' },
    { value: 'looking', label: 'Looking' },
    { value: 'in_pipeline', label: 'In Pipeline' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>My Community</div>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: 'var(--neutral-900)', letterSpacing: '-0.03em' }}>Members</h1>
        <div style={{ fontSize: 13, color: 'var(--neutral-500)' }}>{members.length} people in your talent pool</div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, mobile, job type..." style={{ width: '100%', height: 42, paddingLeft: 36, paddingRight: 12, borderRadius: 12, border: '1.5px solid var(--neutral-200)', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }}>
        {filters.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)} style={{ padding: '5px 14px', borderRadius: 99, border: '1.5px solid', borderColor: filter === f.value ? 'var(--brand-green-mid)' : 'var(--neutral-200)', background: filter === f.value ? 'var(--brand-green-light)' : '#fff', color: filter === f.value ? 'var(--brand-green)' : 'var(--neutral-600)', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Member list */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--neutral-400)', fontSize: 13 }}>
          {members.length === 0 ? 'Your community members will appear here after submitting leads.' : 'No members match your search.'}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(member => {
          const statusStyle = getMemberStatusColor(member.status);
          const canRehire = member.status === 'available' || member.status === 'looking';
          return (
            <div key={member.id} style={{ background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: 16, padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--brand-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: 'var(--brand-green)', flexShrink: 0 }}>
                  {getInitials(member.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--neutral-900)' }}>{member.name}</span>
                    {(member as any).isRehire && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: '#E8F5EE', color: '#0F5C35', border: '1px solid #2EA86A', fontWeight: 700 }}>⟳ Re-hire</span>}
                    <span style={{ marginLeft: 'auto', fontSize: 11, padding: '3px 9px', borderRadius: 99, background: statusStyle.bg, color: statusStyle.color, fontWeight: 700 }}>{getMemberStatusLabel(member.status)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--neutral-500)' }}>{member.jobType} · {member.location}</div>
                  <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 2 }}>Added {member.submittedAt.split('T')[0]}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <a href={`https://wa.me/91${member.mobile}`} target="_blank" rel="noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', borderRadius: 10, border: '1.5px solid var(--neutral-200)', textDecoration: 'none', fontSize: 12, fontWeight: 700, color: '#25D366' }}>
                  <MessageCircle size={14} /> WhatsApp
                </a>
                {canRehire && (
                  <button onClick={() => { setRehireTarget(member); setRehireJobType(member.jobType); setRehireLocation(member.location); }} style={{ flex: 2, padding: '8px', borderRadius: 10, border: 'none', background: 'var(--brand-green-mid)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ⟳ Re-submit ₹{3000}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Re-hire bottom sheet */}
      {rehireTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={() => setRehireTarget(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
          <div style={{ position: 'relative', width: '100%', background: '#fff', borderRadius: '22px 22px 0 0', padding: '20px 20px 36px', zIndex: 101, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--neutral-200)', margin: '0 auto 20px' }} />
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Re-hire Flow</div>
            <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: 'var(--neutral-900)' }}>Re-submit {rehireTarget.name}</h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--neutral-500)' }}>Last placed: {rehireTarget.placedAt?.split('T')[0] || 'N/A'} · {rehireTarget.jobType} · {rehireTarget.location}</p>

            <div style={{ background: 'var(--brand-green-light)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
              {['✓ Creates a new pipeline entry', '✓ You earn ₹3,000 on successful placement', '✓ Ops notified this is a re-hire', '✓ Original placement history attached'].map(line => (
                <div key={line} style={{ fontSize: 13, color: 'var(--brand-green)', fontWeight: 600, marginBottom: 3 }}>{line}</div>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Job Type</label>
              <input value={rehireJobType} onChange={e => setRehireJobType(e.target.value)} style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1.5px solid var(--neutral-200)', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Location</label>
              <input value={rehireLocation} onChange={e => setRehireLocation(e.target.value)} style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1.5px solid var(--neutral-200)', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <button onClick={handleRehire} disabled={processing} style={{ width: '100%', height: 50, borderRadius: 14, border: 'none', background: processing ? 'var(--neutral-200)' : 'var(--brand-green-mid)', color: processing ? 'var(--neutral-400)' : '#fff', fontSize: 15, fontWeight: 800, cursor: processing ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {processing ? 'Processing...' : `⟳ Confirm Re-submit → Earn ₹3,000`}
            </button>
            <button onClick={() => setRehireTarget(null)} style={{ width: '100%', marginTop: 10, height: 44, borderRadius: 12, border: '1.5px solid var(--neutral-200)', background: 'transparent', color: 'var(--neutral-500)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
