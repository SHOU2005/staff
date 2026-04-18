import { useState } from 'react';
import { useRole } from '../contexts/RoleContext';

const steps = [
  {
    emoji: '⚡',
    title: 'Switch Captain',
    subtitle: 'कमाएं हर hire पर',
    body: 'Gurgaon\'s most trusted blue-collar hiring platform. Join thousands of Captains earning every month.',
  },
  {
    emoji: '🎯',
    title: 'How it works',
    subtitle: '3 easy steps to earn',
    steps: [
      { icon: '👥', label: 'Source', desc: 'Find workers looking for jobs' },
      { icon: '📤', label: 'Submit', desc: 'Add them to the app in 30 seconds' },
      { icon: '💰', label: 'Earn', desc: 'Get paid when they\'re hired' },
    ],
  },
  {
    emoji: '💸',
    title: 'Your earnings',
    subtitle: 'Per successful placement',
    payouts: [
      { role: 'Security Guard', amount: '₹3,000' },
      { role: 'Driver', amount: '₹3,000' },
      { role: 'Cook', amount: '₹2,500' },
      { role: 'Housekeeping', amount: '₹2,500' },
      { role: 'Helper', amount: '₹2,000' },
    ],
  },
  {
    emoji: '📝',
    title: 'Almost there!',
    subtitle: 'Tell us your name',
    isForm: true,
  },
];

export default function CaptainOnboardingPage() {
  const { setOnboardingDone, setCaptainProfile, setRole } = useRole();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [upi, setUpi] = useState('');

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      if (current.isForm && name.trim()) {
        setCaptainProfile(name.trim(), upi.trim());
      }
      setOnboardingDone();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSkip = () => {
    setCaptainProfile('Captain', '');
    setOnboardingDone();
  };

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(160deg, #0a1f14 0%, #071510 100%)',
      padding: '0 0 0',
    }}>
      {/* Skip button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px 20px 0' }}>
        <button
          onClick={handleSkip}
          style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            padding: '8px 4px',
          }}
        >
          Skip
        </button>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '16px 0' }}>
        {steps.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === step ? 24 : 6, height: 6,
              borderRadius: 3,
              background: i === step ? '#2EA86A' : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 24px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            fontSize: 60, lineHeight: 1, marginBottom: 20,
            filter: 'drop-shadow(0 4px 16px rgba(46,168,106,0.3))',
          }}>
            {current.emoji}
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
            {current.title}
          </h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: 500 }}>
            {current.subtitle}
          </p>
        </div>

        {/* Step content */}
        {step === 0 && (
          <div style={{
            background: 'rgba(46,168,106,0.08)',
            border: '1.5px solid rgba(46,168,106,0.2)',
            borderRadius: 20, padding: 20,
          }}>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1.6, textAlign: 'center' }}>
              {current.body}
            </p>
          </div>
        )}

        {step === 1 && current.steps && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {current.steps.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                background: 'rgba(255,255,255,0.04)',
                border: '1.5px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: '16px 18px',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                  background: 'rgba(46,168,106,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{s.label}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.desc}</div>
                </div>
                <div style={{
                  marginLeft: 'auto', width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(46,168,106,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, color: '#2EA86A',
                }}>
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 2 && current.payouts && (
          <div style={{
            background: 'rgba(212,160,23,0.06)',
            border: '1.5px solid rgba(212,160,23,0.2)',
            borderRadius: 20, overflow: 'hidden',
          }}>
            {current.payouts.map((p, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: i < current.payouts!.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)' }}>{p.role}</span>
                <span style={{ fontSize: 17, fontWeight: 800, color: '#D4A017', fontFamily: 'DM Mono, monospace' }}>
                  {p.amount}
                </span>
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Your Name *
              </label>
              <input
                id="onboarding-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255,255,255,0.12)', color: '#fff',
                  padding: '14px 16px', borderRadius: 14, fontSize: 16,
                  fontFamily: 'inherit', outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = '#2EA86A'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                UPI ID (optional — for faster payouts)
              </label>
              <input
                id="onboarding-upi-input"
                type="text"
                value={upi}
                onChange={(e) => setUpi(e.target.value)}
                placeholder="e.g. yourname@paytm"
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255,255,255,0.12)', color: '#fff',
                  padding: '14px 16px', borderRadius: 14, fontSize: 16,
                  fontFamily: 'inherit', outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = '#2EA86A'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ padding: '0 24px 40px' }}>
        <button
          id="onboarding-next-btn"
          onClick={handleNext}
          disabled={isLast && step === 3 && !name.trim()}
          style={{
            width: '100%', height: 56,
            background: 'linear-gradient(135deg, #2EA86A, #1A7A4A)',
            border: 'none', borderRadius: 16,
            fontSize: 17, fontWeight: 700, color: '#fff',
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 24px rgba(46,168,106,0.4)',
            transition: 'opacity 0.2s, transform 0.15s',
            opacity: isLast && step === 3 && !name.trim() ? 0.4 : 1,
          }}
          onPointerDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onPointerUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {isLast ? 'Start Earning 🚀' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}
