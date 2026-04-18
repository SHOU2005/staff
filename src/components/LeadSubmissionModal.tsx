import { useState, useCallback } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { addCandidate, checkDuplicate, getSettings, type Stage } from '../lib/data';
import { onLeadSubmitted } from '../lib/community';
import { useRole } from '../contexts/RoleContext';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function LeadSubmissionModal({ onClose, onSuccess }: Props) {
  const { captainId, captainName } = useRole();
  const settings = getSettings();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [jobType, setJobType] = useState('');
  const [location, setLocation] = useState('');
  const [currentJob, setCurrentJob] = useState('');
  const [notes, setNotes] = useState('');
  const [duplicate, setDuplicate] = useState<any>(null);
  const [confirmedDuplicate, setConfirmedDuplicate] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedCandidate, setSubmittedCandidate] = useState<any>(null);
  const [showJobPicker, setShowJobPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const handleMobileBlur = useCallback(() => {
    const clean = mobile.replace(/\D/g, '');
    if (clean.length === 10) {
      const dup = checkDuplicate(clean);
      setDuplicate(dup);
    }
  }, [mobile]);

  const handleSubmit = () => {
    if (!name.trim() || !mobile.trim() || !jobType || !location) {
      toast.error('Please fill all required fields');
      return;
    }
    const clean = mobile.replace(/\D/g, '');
    if (clean.length !== 10) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    if (duplicate && !confirmedDuplicate) {
      toast.error('Please confirm or cancel the duplicate');
      return;
    }

    const candidate = addCandidate({
      name: name.trim(),
      mobile: clean,
      jobType,
      location,
      currentStage: 'Sourced' as Stage,
      referredBy: captainId,
      submittedAt: new Date().toISOString(),
      placedAt: null,
      guaranteeExpiresAt: null,
      replacementNeeded: false,
      currentJob: currentJob.trim(),
      payout: { amount: 3000, status: 'pending', paidAt: null },
      timeline: [{
        stage: 'Sourced',
        movedAt: new Date().toISOString(),
        movedBy: captainId,
        note: notes.trim(),
      }],
      notes: [],
      flagged: false,
      archived: false,
    });
    // Auto-create/update community
    onLeadSubmitted(candidate, captainId, captainName || 'Captain');
    setSubmittedCandidate(candidate);
    setSubmitted(true);
    toast.success('Lead submitted!');
  };

  const waShareText = submittedCandidate
    ? `Hi ${submittedCandidate.name}! \n\nSwitch के साथ नौकरी का मौका है 🎯\nRole: ${submittedCandidate.jobType}\nLocation: ${submittedCandidate.location}, Gurgaon\nSalary: As per market\n\nअभी join करने के लिए संपर्क करें।\n- Switch Hiring Team`
    : '';

  if (submitted && submittedCandidate) {
    return (
      <>
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, backdropFilter: 'blur(4px)' }} />
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
          background: '#fff', borderRadius: '24px 24px 0 0',
          padding: '24px 20px 40px',
          animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {/* Success animation */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--success-light)', border: '3px solid var(--success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: 32,
              animation: 'popIn 0.4s cubic-bezier(0.16,1,0.3,1)',
            }}>
              ✅
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: 'var(--neutral-900)' }}>
              Lead Submitted!
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--neutral-500)' }}>
              {submittedCandidate.name} · {submittedCandidate.jobType}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a
              href={`https://wa.me/91${submittedCandidate.mobile}?text=${encodeURIComponent(waShareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: 'linear-gradient(135deg, #25D366, #128C7E)',
                borderRadius: 14, height: 52, color: '#fff', textDecoration: 'none',
                fontSize: 15, fontWeight: 700,
              }}
            >
              💬 Share on WhatsApp
            </a>
            <button
              id="add-another-lead-btn"
              onClick={() => { setSubmitted(false); setName(''); setMobile(''); setJobType(''); setLocation(''); setNotes(''); setCurrentJob(''); setDuplicate(null); setConfirmedDuplicate(false); setSubmittedCandidate(null); }}
              style={{ height: 52, borderRadius: 14, border: '1.5px solid var(--neutral-200)', background: 'transparent', fontSize: 15, fontWeight: 700, color: 'var(--neutral-700)', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              + Add Another Lead
            </button>
            <button
              onClick={onSuccess}
              style={{ height: 48, borderRadius: 14, border: 'none', background: 'var(--brand-green-light)', color: 'var(--brand-green)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              View My Leads →
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
        background: '#fff', borderRadius: '24px 24px 0 0',
        maxHeight: '92dvh', overflowY: 'auto',
        animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 20px 0', position: 'sticky', top: 0, background: '#fff', zIndex: 5, borderBottom: '1px solid var(--neutral-200)', marginBottom: 20, paddingBottom: 16 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--neutral-200)', margin: '0 auto 16px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--neutral-900)' }}>Add New Lead</h2>
              <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginTop: 2 }}>Fill details to submit a candidate</div>
            </div>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--neutral-100)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} color="var(--neutral-700)" />
            </button>
          </div>
        </div>

        <div style={{ padding: '0 20px 40px' }}>
          {/* Name */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>
              Candidate Name *
            </label>
            <input
              id="lead-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 12, border: '1.5px solid var(--neutral-200)',
                fontSize: 15, fontFamily: 'inherit', outline: 'none', color: 'var(--neutral-900)',
                boxSizing: 'border-box', height: 52, transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--brand-green-mid)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--neutral-200)'}
            />
          </div>

          {/* Mobile */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>
              Mobile Number *
            </label>
            <input
              id="lead-mobile-input"
              type="tel"
              value={mobile}
              onChange={(e) => { setMobile(e.target.value); setDuplicate(null); setConfirmedDuplicate(false); }}
              onBlur={handleMobileBlur}
              placeholder="10-digit number"
              maxLength={10}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 12,
                border: `1.5px solid ${duplicate && !confirmedDuplicate ? '#D97706' : 'var(--neutral-200)'}`,
                fontSize: 15, fontFamily: 'DM Mono, monospace', outline: 'none', color: 'var(--neutral-900)',
                boxSizing: 'border-box', height: 52, transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--brand-green-mid)'}
            />
            {duplicate && !confirmedDuplicate && (
              <div style={{
                marginTop: 8, padding: '10px 14px', borderRadius: 10,
                background: 'var(--warning-light)', border: '1.5px solid rgba(217,119,6,0.3)',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#D97706', marginBottom: 6 }}>
                  ⚠️ Duplicate detected: {duplicate.name} ({duplicate.currentStage})
                </div>
                <button
                  onClick={() => setConfirmedDuplicate(true)}
                  style={{ fontSize: 12, fontWeight: 700, color: '#D97706', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  It's a different person — proceed
                </button>
              </div>
            )}
          </div>

          {/* Job Type */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>
              Job Type *
            </label>
            <button
              id="lead-jobtype-picker"
              onClick={() => setShowJobPicker(true)}
              style={{
                width: '100%', height: 52, padding: '14px 16px', borderRadius: 12, border: '1.5px solid var(--neutral-200)',
                fontSize: 15, fontFamily: 'inherit', outline: 'none', color: jobType ? 'var(--neutral-900)' : 'var(--neutral-500)',
                boxSizing: 'border-box', cursor: 'pointer', background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color 0.2s',
              }}
            >
              <span>{jobType || 'Select job type'}</span>
              <ChevronDown size={16} color="var(--neutral-500)" />
            </button>
          </div>

          {/* Location */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>
              Work Location *
            </label>
            <button
              id="lead-location-picker"
              onClick={() => setShowLocationPicker(true)}
              style={{
                width: '100%', height: 52, padding: '14px 16px', borderRadius: 12, border: '1.5px solid var(--neutral-200)',
                fontSize: 15, fontFamily: 'inherit', outline: 'none', color: location ? 'var(--neutral-900)' : 'var(--neutral-500)',
                boxSizing: 'border-box', cursor: 'pointer', background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span>{location || 'Select location'}</span>
              <ChevronDown size={16} color="var(--neutral-500)" />
            </button>
          </div>

          {/* Current job (optional) */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>
              Current Job (optional)
            </label>
            <input
              type="text"
              value={currentJob}
              onChange={(e) => setCurrentJob(e.target.value)}
              placeholder="Where does the candidate currently work?"
              style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1.5px solid var(--neutral-200)', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: 'var(--neutral-900)', boxSizing: 'border-box', height: 52, transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--brand-green-mid)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--neutral-200)'}
            />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any context for ops team..."
              style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1.5px solid var(--neutral-200)', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: 'var(--neutral-900)', minHeight: 80, resize: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--brand-green-mid)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--neutral-200)'}
            />
          </div>

          <button
            id="submit-lead-btn"
            onClick={handleSubmit}
            disabled={!name || !mobile || !jobType || !location}
            style={{
              width: '100%', height: 56, borderRadius: 16, border: 'none',
              background: 'linear-gradient(135deg, var(--brand-green-mid), var(--brand-green))',
              color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 20px rgba(46,168,106,0.35)',
              opacity: (!name || !mobile || !jobType || !location) ? 0.5 : 1,
              transition: 'opacity 0.2s, transform 0.15s',
            }}
            onPointerDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
            onPointerUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Submit Lead ✓
          </button>
        </div>
      </div>

      {/* Job Type Bottom Sheet */}
      {showJobPicker && (
        <>
          <div onClick={() => setShowJobPicker(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 300 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 301, background: '#fff', borderRadius: '20px 20px 0 0', padding: '12px 0 40px', animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--neutral-200)', margin: '0 auto 16px' }} />
            <div style={{ padding: '0 20px', fontSize: 13, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Select Job Type</div>
            {settings.jobTypes.map((jt) => (
              <button
                key={jt}
                onClick={() => { setJobType(jt); setShowJobPicker(false); }}
                style={{
                  width: '100%', padding: '15px 20px', background: jobType === jt ? 'var(--brand-green-light)' : 'transparent',
                  border: 'none', borderBottom: '1px solid var(--neutral-200)', cursor: 'pointer',
                  textAlign: 'left', fontSize: 15, fontWeight: jobType === jt ? 700 : 400,
                  color: jobType === jt ? 'var(--brand-green)' : 'var(--neutral-900)', fontFamily: 'inherit',
                }}
              >
                {jt} {jobType === jt ? '✓' : ''}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Location Bottom Sheet */}
      {showLocationPicker && (
        <>
          <div onClick={() => setShowLocationPicker(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 300 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 301, background: '#fff', borderRadius: '20px 20px 0 0', padding: '12px 0 40px', maxHeight: '70dvh', overflowY: 'auto', animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)' }}>
            <div style={{ position: 'sticky', top: 0, background: '#fff', padding: '8px 0 4px', zIndex: 5 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--neutral-200)', margin: '0 auto 12px' }} />
              <div style={{ padding: '0 20px', fontSize: 13, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Select Location</div>
            </div>
            {settings.locations.map((loc) => (
              <button
                key={loc}
                onClick={() => { setLocation(loc); setShowLocationPicker(false); }}
                style={{
                  width: '100%', padding: '15px 20px', background: location === loc ? 'var(--brand-green-light)' : 'transparent',
                  border: 'none', borderBottom: '1px solid var(--neutral-200)', cursor: 'pointer',
                  textAlign: 'left', fontSize: 15, fontWeight: location === loc ? 700 : 400,
                  color: location === loc ? 'var(--brand-green)' : 'var(--neutral-900)', fontFamily: 'inherit',
                }}
              >
                {loc} {location === loc ? '✓' : ''}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
