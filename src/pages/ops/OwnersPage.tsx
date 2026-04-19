import { useState, useCallback, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Phone, MessageCircle, ChevronDown, ChevronUp, IndianRupee } from 'lucide-react';
import { getOwners, addOwner, updateOwner, deleteOwner, recordOwnerPayment, type Owner, type OwnerType } from '../../lib/data';
import toast from 'react-hot-toast';

type FormState = { companyName: string; ownerName: string; phone: string; type: OwnerType; location: string; notes: string; pendingAmount: number; active: boolean; };
const EMPTY: FormState = { companyName: '', ownerName: '', phone: '', type: 'company', location: '', notes: '', pendingAmount: 0, active: true };

const inputStyle: React.CSSProperties = { width: '100%', height: 48, padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--neutral-200)', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: 'var(--neutral-900)', background: '#fff', boxSizing: 'border-box' };
const fh = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.target.style.borderColor = 'var(--brand-green-mid)'; },
  onBlur:  (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.target.style.borderColor = 'var(--neutral-200)'; },
};
const Lbl = ({ text }: { text: string }) => (
  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{text}</label>
);

interface CardProps { owner: Owner; onEdit: (o: Owner) => void; onDelete: (o: Owner) => void; onPayment: (o: Owner) => void; }
function OwnerCard({ owner, onEdit, onDelete, onPayment }: CardProps) {
  const [expanded, setExpanded] = useState(false);
  const isPG = owner.type === 'pg';
  const badge = isPG ? { bg: 'rgba(124,58,237,0.1)', color: '#7C3AED', label: '🏠 PG' } : { bg: 'rgba(37,99,235,0.1)', color: '#2563EB', label: '🏢 Company' };
  const totalReceived = (owner.payments || []).reduce((s, p) => s + p.amount, 0);
  const waMsg = `Hi ${owner.ownerName} ji! Switch Captain team se bol raha/rahi hoon. Aapke yahan placed candidates ke payment ke baare mein baat karni thi. 🙏`;

  return (
    <div style={{ background: '#fff', border: '1.5px solid var(--neutral-200)', borderRadius: 18, padding: 16, marginBottom: 10 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--neutral-900)' }}>{owner.companyName}</div>
            <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800, background: badge.bg, color: badge.color, flexShrink: 0 }}>{badge.label}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--neutral-600)', fontWeight: 600 }}>👤 {owner.ownerName}</div>
          {owner.location && <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginTop: 2 }}>📍 {owner.location}</div>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
          <button onClick={() => onEdit(owner)} style={{ width: 32, height: 32, borderRadius: 9, border: '1.5px solid var(--neutral-200)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Edit2 size={12} color="var(--neutral-600)" />
          </button>
          <button onClick={() => onDelete(owner)} style={{ width: 32, height: 32, borderRadius: 9, border: '1.5px solid var(--danger-light)', background: 'var(--danger-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trash2 size={12} color="var(--danger)" />
          </button>
        </div>
      </div>

      {/* Payment summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div style={{ padding: '8px 10px', background: owner.pendingAmount > 0 ? 'rgba(212,160,23,0.08)' : 'var(--neutral-50)', borderRadius: 10, border: owner.pendingAmount > 0 ? '1px solid rgba(212,160,23,0.2)' : 'none' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: owner.pendingAmount > 0 ? '#b87d12' : 'var(--neutral-500)', textTransform: 'uppercase', marginBottom: 3 }}>Pending</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: owner.pendingAmount > 0 ? '#D4A017' : 'var(--neutral-400)', fontFamily: 'DM Mono, monospace' }}>₹{(owner.pendingAmount || 0).toLocaleString('en-IN')}</div>
        </div>
        <div style={{ padding: '8px 10px', background: 'var(--neutral-50)', borderRadius: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', marginBottom: 3 }}>Received</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--success)', fontFamily: 'DM Mono, monospace' }}>₹{totalReceived.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {owner.notes && <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginBottom: 10, lineHeight: 1.5, padding: '8px 10px', background: 'var(--neutral-50)', borderRadius: 8 }}>{owner.notes}</div>}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <a href={`tel:${owner.phone}`} style={{ flex: 1, height: 40, borderRadius: 10, background: 'rgba(46,168,106,0.08)', border: '1px solid rgba(46,168,106,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--brand-green)', textDecoration: 'none', fontFamily: 'inherit' }}>
          <Phone size={13} /> {owner.phone}
        </a>
        <a href={`https://wa.me/91${owner.phone}?text=${encodeURIComponent(waMsg)}`} target="_blank" rel="noopener noreferrer" style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#25D366,#128C7E)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
          <MessageCircle size={15} color="#fff" />
        </a>
        <button onClick={() => onPayment(owner)} style={{ flex: 1, height: 40, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#D4A017,#b87d12)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <IndianRupee size={12} /> Record Payment
        </button>
      </div>

      {/* Payment history toggle */}
      {(owner.payments || []).length > 0 && (
        <button onClick={() => setExpanded(e => !e)} style={{ width: '100%', padding: '8px', borderRadius: 10, border: 'none', background: 'var(--neutral-50)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: 'var(--neutral-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />} Payment History ({(owner.payments || []).length})
        </button>
      )}

      {expanded && (owner.payments || []).length > 0 && (
        <div style={{ marginTop: 10, borderTop: '1px solid var(--neutral-100)', paddingTop: 10 }}>
          {(owner.payments || []).map((p, i) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < owner.payments.length - 1 ? '1px solid var(--neutral-100)' : 'none' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>₹{p.amount.toLocaleString('en-IN')}</div>
                {p.note && <div style={{ fontSize: 11, color: 'var(--neutral-500)', marginTop: 1 }}>{p.note}</div>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--neutral-400)' }}>{new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OwnersPage() {
  const [owners, setOwners]   = useState<Owner[]>([]);
  const [adding, setAdding]   = useState(false);
  const [editing, setEditing] = useState<Owner | null>(null);
  const [form, setForm]       = useState<FormState>(EMPTY);
  const [search, setSearch]   = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Owner | null>(null);
  const [paymentModal, setPaymentModal]   = useState<Owner | null>(null);
  const [payAmount, setPayAmount]         = useState('');
  const [payNote, setPayNote]             = useState('');

  const load = useCallback(() => { setOwners(getOwners()); }, []);
  useEffect(() => { load(); }, [load]);

  const set = (k: keyof FormState, v: any) => setForm(f => ({ ...f, [k]: v }));
  const closeForm = () => { setAdding(false); setEditing(null); setForm(EMPTY); };

  const handleSubmit = () => {
    if (!form.companyName.trim() || !form.ownerName.trim() || !form.phone.trim()) { toast.error('Company name, owner name and phone are required'); return; }
    if (form.phone.replace(/\D/g, '').length !== 10) { toast.error('Enter a valid 10-digit phone number'); return; }
    if (editing) {
      updateOwner(editing.id, form);
      toast.success('Owner updated!');
      setEditing(null);
    } else {
      addOwner(form);
      toast.success('Owner added!');
      setAdding(false);
    }
    setForm(EMPTY);
    load();
  };

  const handleRecordPayment = () => {
    if (!paymentModal || !payAmount || Number(payAmount) <= 0) { toast.error('Enter a valid amount'); return; }
    recordOwnerPayment(paymentModal.id, Number(payAmount), payNote);
    toast.success(`₹${Number(payAmount).toLocaleString('en-IN')} recorded!`);
    setPaymentModal(null); setPayAmount(''); setPayNote('');
    load();
  };

  const filtered = owners.filter(o => {
    const q = search.toLowerCase();
    return !q || o.companyName.toLowerCase().includes(q) || o.ownerName.toLowerCase().includes(q) || o.phone.includes(q);
  });

  const totalPending  = owners.reduce((s, o) => s + (o.pendingAmount || 0), 0);
  const totalReceived = owners.reduce((s, o) => s + (o.payments || []).reduce((a, p) => a + p.amount, 0), 0);

  const makeCardProps = (o: Owner) => ({
    owner: o,
    onEdit: (e: Owner) => { setEditing(e); setAdding(false); setForm({ companyName: e.companyName, ownerName: e.ownerName, phone: e.phone, type: e.type, location: e.location || '', notes: e.notes || '', pendingAmount: e.pendingAmount, active: e.active }); },
    onDelete: setConfirmDelete,
    onPayment: setPaymentModal,
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Clients</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--neutral-900)', letterSpacing: '-0.03em' }}>Owners</h1>
          <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginTop: 2 }}>{owners.length} clients · {owners.filter(o => o.pendingAmount > 0).length} with pending</div>
        </div>
        <button onClick={() => { setAdding(true); setEditing(null); setForm(EMPTY); }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--brand-green-mid)', border: 'none', borderRadius: 12, padding: '10px 16px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(46,168,106,0.25)' }}>
          <Plus size={15} /> Add
        </button>
      </div>

      {/* Finance summary */}
      {(totalPending > 0 || totalReceived > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <div style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 14, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#b87d12', textTransform: 'uppercase', marginBottom: 4 }}>Total Pending</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#D4A017', fontFamily: 'DM Mono, monospace' }}>₹{totalPending.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.15)', borderRadius: 14, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', marginBottom: 4 }}>Total Received</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--success)', fontFamily: 'DM Mono, monospace' }}>₹{totalReceived.toLocaleString('en-IN')}</div>
          </div>
        </div>
      )}

      {owners.length > 0 && (
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company, owner, phone..." style={{ ...inputStyle, marginBottom: 16 }} {...fh} />
      )}

      {/* Form */}
      {(adding || editing) && (
        <div style={{ background: '#fff', border: '1.5px solid var(--brand-green-mid)', borderRadius: 20, padding: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--neutral-900)' }}>{editing ? 'Edit Owner' : 'Add Owner'}</h3>
            <button onClick={closeForm} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color="var(--neutral-500)" /></button>
          </div>

          <div style={{ marginBottom: 14 }}>
            <Lbl text="Type" />
            <div style={{ display: 'flex', gap: 8 }}>
              {(['company', 'pg'] as OwnerType[]).map(t => (
                <button key={t} type="button" onClick={() => set('type', t)} style={{ flex: 1, height: 44, borderRadius: 12, border: `2px solid ${form.type === t ? 'var(--brand-green-mid)' : 'var(--neutral-200)'}`, background: form.type === t ? 'rgba(46,168,106,0.08)' : '#fff', color: form.type === t ? 'var(--brand-green)' : 'var(--neutral-500)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {t === 'pg' ? '🏠 PG' : '🏢 Company'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <Lbl text="Company / PG Name *" />
            <input value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder={form.type === 'pg' ? 'e.g. Sharma PG' : 'e.g. SecureVision Pvt Ltd'} style={inputStyle} {...fh} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><Lbl text="Owner Name *" /><input value={form.ownerName} onChange={e => set('ownerName', e.target.value)} placeholder="Full name" style={inputStyle} {...fh} /></div>
            <div><Lbl text="Phone *" /><input type="tel" value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit" style={{ ...inputStyle, fontFamily: 'DM Mono, monospace' }} {...fh} /></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><Lbl text="Location" /><input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Area / sector" style={inputStyle} {...fh} /></div>
            <div><Lbl text="Pending Amount (₹)" /><input type="number" min={0} value={form.pendingAmount || ''} onChange={e => set('pendingAmount', Number(e.target.value) || 0)} placeholder="0" style={{ ...inputStyle, fontFamily: 'DM Mono, monospace' }} {...fh} /></div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Lbl text="Notes" />
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes about this client..." style={{ ...inputStyle, height: 72, resize: 'vertical' } as React.CSSProperties} {...fh} />
          </div>

          <button onClick={handleSubmit} style={{ width: '100%', height: 50, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,var(--brand-green-mid),var(--brand-green))', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(46,168,106,0.25)' }}>
            {editing ? 'Save Changes' : '+ Add Owner'}
          </button>
        </div>
      )}

      {owners.length === 0 && !adding && (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: '#fff', borderRadius: 18, border: '1.5px dashed var(--neutral-200)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏢</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--neutral-700)', marginBottom: 6 }}>No owners yet</div>
          <div style={{ fontSize: 13, color: 'var(--neutral-500)', marginBottom: 20 }}>Add company and PG owners to track placements and payments</div>
          <button onClick={() => setAdding(true)} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: 'var(--brand-green-mid)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add First Owner</button>
        </div>
      )}

      {filtered.filter(o => o.type === 'company').length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>🏢 Companies ({filtered.filter(o => o.type === 'company').length})</div>
          {filtered.filter(o => o.type === 'company').map(o => <OwnerCard key={o.id} {...makeCardProps(o)} />)}
        </>
      )}

      {filtered.filter(o => o.type === 'pg').length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, marginTop: filtered.filter(o => o.type === 'company').length > 0 ? 20 : 0 }}>🏠 PGs ({filtered.filter(o => o.type === 'pg').length})</div>
          {filtered.filter(o => o.type === 'pg').map(o => <OwnerCard key={o.id} {...makeCardProps(o)} />)}
        </>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <>
          <div onClick={() => setConfirmDelete(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201, background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--neutral-200)', margin: '0 auto 20px' }} />
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: 'var(--neutral-900)' }}>Remove Owner?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--neutral-500)' }}>Remove <b>{confirmDelete.companyName}</b> ({confirmDelete.ownerName})?</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, height: 48, borderRadius: 12, border: '1.5px solid var(--neutral-200)', background: 'transparent', fontSize: 14, fontWeight: 700, color: 'var(--neutral-500)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={() => { deleteOwner(confirmDelete.id); toast.success('Owner removed'); setConfirmDelete(null); load(); }} style={{ flex: 2, height: 48, borderRadius: 12, border: 'none', background: 'var(--danger)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
            </div>
          </div>
        </>
      )}

      {/* Record payment modal */}
      {paymentModal && (
        <>
          <div onClick={() => { setPaymentModal(null); setPayAmount(''); setPayNote(''); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201, background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--neutral-200)', margin: '0 auto 20px' }} />
            <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: 'var(--neutral-900)' }}>Record Payment</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--neutral-500)' }}>From <b>{paymentModal.companyName}</b> · Pending: <b style={{ color: '#D4A017' }}>₹{(paymentModal.pendingAmount || 0).toLocaleString('en-IN')}</b></p>
            <div style={{ marginBottom: 12 }}>
              <Lbl text="Amount Received (₹)" />
              <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="Enter amount" style={{ ...inputStyle, fontFamily: 'DM Mono, monospace', fontSize: 18, fontWeight: 800 }} autoFocus {...fh} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <Lbl text="Note (optional)" />
              <input value={payNote} onChange={e => setPayNote(e.target.value)} placeholder="e.g. April batch payment" style={inputStyle} {...fh} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setPaymentModal(null); setPayAmount(''); setPayNote(''); }} style={{ flex: 1, height: 50, borderRadius: 12, border: '1.5px solid var(--neutral-200)', background: 'transparent', fontSize: 14, fontWeight: 700, color: 'var(--neutral-500)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleRecordPayment} style={{ flex: 2, height: 50, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#D4A017,#b87d12)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✓ Record ₹{Number(payAmount || 0).toLocaleString('en-IN')}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
