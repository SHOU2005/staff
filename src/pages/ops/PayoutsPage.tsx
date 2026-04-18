import { useCallback, useEffect, useState } from 'react';
import {
  getPayoutRequests, approvePayoutRequest, rejectPayoutRequest,
  type PayoutRequest,
} from '../../lib/data';
import { useRole } from '../../contexts/RoleContext';
import toast from 'react-hot-toast';

export default function OpsPayoutsPage() {
  const { captainName } = useRole();
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'rejected'>('pending');
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const load = useCallback(() => { setRequests(getPayoutRequests()); }, []);
  useEffect(() => { load(); }, [load]);

  const handleApprove = (id: string) => {
    approvePayoutRequest(id, captainName);
    toast.success('Payout approved and marked as paid! ✓');
    load();
  };

  const handleReject = (id: string) => {
    rejectPayoutRequest(id, captainName, rejectNote);
    toast.success('Payout request rejected.');
    setRejecting(null);
    setRejectNote('');
    load();
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const totalPending = requests.filter(r => r.status==='pending').reduce((s,r) => s+r.amount, 0);

  const statusBadge = (s: string) =>
    s==='paid'     ? { bg:'var(--success-light)', color:'var(--success)',  label:'✅ Paid' }     :
    s==='approved' ? { bg:'var(--warning-light)', color:'var(--warning)',  label:'🕐 Approved' }  :
    s==='rejected' ? { bg:'var(--danger-light)',  color:'var(--danger)',   label:'❌ Rejected' }   :
                     { bg:'rgba(124,58,237,0.1)', color:'#7C3AED',        label:'⏳ Pending' };

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:10, fontWeight:800, color:'#D4A017', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:3 }}>Finance</div>
        <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:'var(--neutral-900)', letterSpacing:'-0.03em' }}>Payout Requests</h1>
        {totalPending > 0 && (
          <div style={{ marginTop:6, display:'inline-flex', alignItems:'center', gap:6, background:'rgba(124,58,237,0.1)', borderRadius:99, padding:'4px 12px' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#7C3AED' }} />
            <span style={{ fontSize:12, fontWeight:700, color:'#7C3AED' }}>₹{totalPending.toLocaleString('en-IN')} awaiting approval</span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:16, background:'var(--neutral-100)', borderRadius:12, padding:4 }}>
        {(['pending','all','paid','rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            flex:1, padding:'8px 4px', borderRadius:9, border:'none', cursor:'pointer',
            fontFamily:'inherit', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em',
            background: filter===f ? '#fff' : 'transparent',
            color: filter===f ? 'var(--neutral-900)' : 'var(--neutral-500)',
            boxShadow: filter===f ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            transition:'all 0.2s',
          }}>{f}</button>
        ))}
      </div>

      {filtered.length === 0
        ? <div style={{ textAlign:'center', padding:'48px 20px', color:'var(--neutral-500)' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>💸</div>
            <div style={{ fontSize:15, fontWeight:600 }}>No {filter} requests</div>
          </div>
        : filtered.map(req => {
          const badge = statusBadge(req.status);
          const date  = new Date(req.requestedAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
          return (
            <div key={req.id} style={{ background:'#fff', border:'1.5px solid var(--neutral-200)', borderRadius:18, padding:16, marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:16, fontWeight:800, color:'var(--neutral-900)' }}>{req.captainName}</div>
                  <div style={{ fontSize:12, color:'var(--neutral-500)', marginTop:2 }}>📞 UPI: {req.upiId} · {date}</div>
                </div>
                <span style={{ padding:'4px 10px', borderRadius:99, fontSize:11, fontWeight:700, background:badge.bg, color:badge.color }}>{badge.label}</span>
              </div>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'var(--neutral-50)', borderRadius:12, marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:11, color:'var(--neutral-500)', fontWeight:600 }}>Amount Requested</div>
                  <div style={{ fontSize:26, fontWeight:900, color:'var(--neutral-900)', fontFamily:'DM Mono, monospace' }}>₹{req.amount.toLocaleString('en-IN')}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:11, color:'var(--neutral-500)', fontWeight:600 }}>Candidates</div>
                  <div style={{ fontSize:20, fontWeight:800, color:'var(--brand-green)', fontFamily:'DM Mono, monospace' }}>{req.candidateIds.length}</div>
                </div>
              </div>

              {req.note && (
                <div style={{ padding:'10px 12px', background:'var(--danger-light)', borderRadius:10, fontSize:12, color:'var(--danger)', marginBottom:12 }}>
                  Note: {req.note}
                </div>
              )}

              {req.status === 'pending' && (
                rejecting === req.id ? (
                  <div>
                    <input value={rejectNote} onChange={e=>setRejectNote(e.target.value)} placeholder="Reason for rejection..." style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid var(--danger)', outline:'none', fontSize:13, fontFamily:'inherit', marginBottom:8, boxSizing:'border-box' as const, color:'var(--neutral-900)' }} />
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => setRejecting(null)} style={{ flex:1, height:44, borderRadius:12, border:'1.5px solid var(--neutral-200)', background:'transparent', fontSize:14, fontWeight:700, color:'var(--neutral-500)', cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                      <button onClick={() => handleReject(req.id)} style={{ flex:1, height:44, borderRadius:12, border:'none', background:'var(--danger)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Confirm Reject</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display:'flex', gap:10 }}>
                    <button onClick={() => setRejecting(req.id)} style={{ flex:1, height:48, borderRadius:12, border:'1.5px solid rgba(220,38,38,0.3)', background:'var(--danger-light)', color:'var(--danger)', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Reject</button>
                    <button id={`approve-${req.id}`} onClick={() => handleApprove(req.id)} style={{ flex:2, height:48, borderRadius:12, border:'none', background:'linear-gradient(135deg,#D4A017,#b87d12)', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 12px rgba(212,160,23,0.3)' }}>✓ Approve & Pay</button>
                  </div>
                )
              )}

              {req.status !== 'pending' && req.processedAt && (
                <div style={{ fontSize:11, color:'var(--neutral-500)', textAlign:'center' }}>
                  {req.status === 'paid' ? 'Paid' : 'Rejected'} on {new Date(req.processedAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })} by {req.processedBy}
                </div>
              )}
            </div>
          );
        })
      }
    </div>
  );
}
