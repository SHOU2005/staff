import { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, Phone, Lock, User, KeyRound } from 'lucide-react';
import { loginUser, registerCaptain, registerOps } from '../lib/data';
import { useRole } from '../contexts/RoleContext';
import toast from 'react-hot-toast';

type Screen = 'choose_role' | 'captain_login' | 'captain_register' | 'ops_login' | 'ops_register';

export default function AuthPage() {
  const { setSession } = useRole();
  const [screen, setScreen] = useState<Screen>('choose_role');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [name, setName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [opsCode, setOpsCode] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) { toast.error('Enter phone and password'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = await loginUser(phone, password);
    setLoading(false);
    if (!result.ok) { toast.error(result.error!); return; }
    toast.success(`Welcome back, ${result.session!.name}!`);
    setSession(result.session!);
  };

  const handleCaptainRegister = async () => {
    if (!name || !phone || !password) { toast.error('Fill all required fields'); return; }
    if (password !== confirmPwd) { toast.error('Passwords do not match'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (phone.replace(/\D/g,'').length !== 10) { toast.error('Enter a valid 10-digit number'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = await registerCaptain(name, phone, password, upiId);
    setLoading(false);
    if (!result.ok) { toast.error(result.error!); return; }
    toast.success('Account created! Welcome aboard! 🎉');
    setSession(result.session!);
  };

  const handleOpsRegister = async () => {
    if (!name || !phone || !password || !opsCode) { toast.error('Fill all fields including access code'); return; }
    if (password !== confirmPwd) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = await registerOps(name, phone, password, opsCode);
    setLoading(false);
    if (!result.ok) { toast.error(result.error!); return; }
    toast.success('Ops account created!');
    setSession(result.session!);
  };

  const inputStyle = {
    width: '100%', height: 52, padding: '14px 16px',
    borderRadius: 14, border: '1.5px solid var(--neutral-200)',
    fontSize: 15, fontFamily: 'inherit', outline: 'none',
    color: 'var(--neutral-900)', background: '#fff',
    boxSizing: 'border-box' as const, transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const focusStyle = {
    onFocus: (e: any) => { e.target.style.borderColor='var(--brand-green-mid)'; e.target.style.boxShadow='0 0 0 3px rgba(46,168,106,0.12)'; },
    onBlur:  (e: any) => { e.target.style.borderColor='var(--neutral-200)';    e.target.style.boxShadow='none'; },
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #e8f8ef 0%, #fff 45%, #fdf6e3 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative blobs */}
      <div style={{ position:'fixed', top:-80, right:-60, width:260, height:260, borderRadius:'50%', background:'rgba(46,168,106,0.08)', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', bottom:-100, left:-80, width:320, height:320, borderRadius:'50%', background:'rgba(212,160,23,0.07)', pointerEvents:'none', zIndex:0 }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 76, height: 76, borderRadius: 24, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #2EA86A, #1A7A4A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, boxShadow: '0 10px 40px rgba(46,168,106,0.35)',
            animation: 'popIn 0.5s cubic-bezier(0.16,1,0.3,1)',
          }}>⚡</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--neutral-900)', letterSpacing: '-0.04em' }}>
            Switch Captain
          </div>
          <div style={{ fontSize: 13, color: 'var(--brand-green-mid)', fontWeight: 700, marginTop: 5 }}>
            कमाएं हर hire पर · Earn on every placement
          </div>
          {screen === 'choose_role' && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, marginTop:16 }}>
              {[['500+', 'Active Captains'], ['₹300+', 'Per Hire'], ['30 days', 'Guarantee']].map(([v, l]) => (
                <div key={l} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:15, fontWeight:900, color:'var(--neutral-900)' }}>{v}</div>
                  <div style={{ fontSize:10, color:'var(--neutral-500)', fontWeight:600 }}>{l}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', border: '1.5px solid var(--neutral-200)', borderRadius: 24, padding: '28px 24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)', position: 'relative', overflow: 'hidden',
        }}>
          {/* Green top bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #2EA86A, #1A7A4A)' }} />

          {/* ─── CHOOSE ROLE ─────────────────────────────────── */}
          {screen === 'choose_role' && (
            <>
              <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: 'var(--neutral-900)' }}>Welcome back!</h2>
              <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--neutral-500)' }}>Sign in as your role</p>

              <button
                id="choose-captain-btn"
                onClick={() => setScreen('captain_login')}
                style={{
                  width: '100%', padding: '18px 20px', borderRadius: 16, border: '2px solid var(--neutral-200)',
                  background: '#fff', cursor: 'pointer', marginBottom: 12, textAlign: 'left',
                  fontFamily: 'inherit', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 14,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor='var(--brand-green-mid)'; (e.currentTarget as HTMLButtonElement).style.background='var(--brand-green-light)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor='var(--neutral-200)'; (e.currentTarget as HTMLButtonElement).style.background='#fff'; }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--brand-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>👷</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--neutral-900)' }}>I'm a Captain</div>
                  <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginTop: 2 }}>Field agent — submit leads & earn</div>
                </div>
                <div style={{ marginLeft: 'auto', color: 'var(--brand-green)', fontSize: 20 }}>→</div>
              </button>

              <button
                id="choose-ops-btn"
                onClick={() => setScreen('ops_login')}
                style={{
                  width: '100%', padding: '18px 20px', borderRadius: 16, border: '2px solid var(--neutral-200)',
                  background: '#fff', cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'inherit', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 14,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor='#D4A017'; (e.currentTarget as HTMLButtonElement).style.background='var(--accent-gold-light)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor='var(--neutral-200)'; (e.currentTarget as HTMLButtonElement).style.background='#fff'; }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--accent-gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>📊</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--neutral-900)' }}>I'm Ops Team</div>
                  <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginTop: 2 }}>Manage pipeline & approve payouts</div>
                </div>
                <div style={{ marginLeft: 'auto', color: '#D4A017', fontSize: 20 }}>→</div>
              </button>
            </>
          )}

          {/* ─── CAPTAIN LOGIN ───────────────────────────────── */}
          {screen === 'captain_login' && (
            <>
              <button onClick={() => setScreen('choose_role')} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6, color:'var(--neutral-500)', fontSize:13, fontFamily:'inherit', padding:0, marginBottom:20 }}>
                <ArrowLeft size={14} /> Back
              </button>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Captain Login</div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--neutral-900)' }}>Sign in 👷</h2>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }}>Phone Number</label>
                <div style={{ position:'relative' }}>
                  <Phone size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--neutral-500)' }} />
                  <input id="captain-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="10-digit mobile" maxLength={10} style={{ ...inputStyle, paddingLeft:42, fontFamily:'DM Mono, monospace' }} {...focusStyle} onKeyDown={e => e.key==='Enter' && handleLogin()} />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }}>Password</label>
                <div style={{ position:'relative' }}>
                  <Lock size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--neutral-500)' }} />
                  <input id="captain-password" type={showPwd?'text':'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" style={{ ...inputStyle, paddingLeft:42, paddingRight:44 }} {...focusStyle} onKeyDown={e => e.key==='Enter' && handleLogin()} />
                  <button onClick={() => setShowPwd(!showPwd)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--neutral-500)' }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button id="captain-login-btn" onClick={handleLogin} disabled={loading} style={{ width:'100%', height:52, borderRadius:14, border:'none', background:'linear-gradient(135deg,#2EA86A,#1A7A4A)', color:'#fff', fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 20px rgba(46,168,106,0.3)', opacity:loading?0.7:1, transition:'all 0.2s', marginBottom:14 }}>
                {loading ? '...' : 'Sign In →'}
              </button>

              <div style={{ textAlign:'center' }}>
                <span style={{ fontSize:13, color:'var(--neutral-500)' }}>New captain? </span>
                <button onClick={() => setScreen('captain_register')} style={{ fontSize:13, fontWeight:700, color:'var(--brand-green)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>Create account →</button>
              </div>

              <div style={{ marginTop:16, padding:'12px 14px', borderRadius:12, background:'var(--brand-green-light)', border:'1px solid rgba(46,168,106,0.2)' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--brand-green)', marginBottom:4 }}>Demo Login</div>
                <div style={{ fontSize:12, color:'var(--neutral-700)', fontFamily:'DM Mono, monospace' }}>📞 9812345678 · 🔑 priya@123</div>
              </div>
            </>
          )}

          {/* ─── CAPTAIN REGISTER ────────────────────────────── */}
          {screen === 'captain_register' && (
            <>
              <button onClick={() => setScreen('captain_login')} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6, color:'var(--neutral-500)', fontSize:13, fontFamily:'inherit', padding:0, marginBottom:20 }}>
                <ArrowLeft size={14} /> Back to login
              </button>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize:11, fontWeight:800, color:'var(--brand-green)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>New Captain</div>
                <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:'var(--neutral-900)' }}>Join the team 🚀</h2>
              </div>

              {[
                { id:'reg-name', label:'Your Name *', ph:'Full name', val:name, set:setName, icon:<User size={16}/>, type:'text' },
                { id:'reg-phone', label:'Phone Number *', ph:'10-digit number', val:phone, set:setPhone, icon:<Phone size={16}/>, type:'tel', mono:true },
                { id:'reg-upi', label:'UPI ID (for payouts)', ph:'yourname@bank', val:upiId, set:setUpiId, icon:<span style={{fontSize:11,fontWeight:800,color:'var(--neutral-500)'}}>₹</span>, type:'text' },
              ].map(({ id, label, ph, val, set, icon, type, mono }) => (
                <div key={id} style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }}>{label}</label>
                  <div style={{ position:'relative' }}>
                    <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--neutral-500)', display:'flex', alignItems:'center' }}>{icon}</div>
                    <input id={id} type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph} style={{ ...inputStyle, paddingLeft:42, fontFamily: mono ? 'DM Mono, monospace' : 'inherit' }} {...focusStyle} />
                  </div>
                </div>
              ))}

              {[
                { id:'reg-pwd', label:'Create Password *', ph:'Min 6 characters', val:password, set:setPassword, show:showPwd, toggle:()=>setShowPwd(!showPwd) },
                { id:'reg-cpwd', label:'Confirm Password *', ph:'Same as above', val:confirmPwd, set:setConfirmPwd, show:showPwd, toggle:()=>setShowPwd(!showPwd) },
              ].map(({ id, label, ph, val, set, show, toggle }) => (
                <div key={id} style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }}>{label}</label>
                  <div style={{ position:'relative' }}>
                    <Lock size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--neutral-500)' }} />
                    <input id={id} type={show?'text':'password'} value={val} onChange={e => set(e.target.value)} placeholder={ph} style={{ ...inputStyle, paddingLeft:42, paddingRight:44 }} {...focusStyle} />
                    <button onClick={toggle} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--neutral-500)' }}>{show ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                  </div>
                </div>
              ))}

              <button id="captain-register-btn" onClick={handleCaptainRegister} disabled={loading} style={{ width:'100%', height:52, borderRadius:14, border:'none', background:'linear-gradient(135deg,#2EA86A,#1A7A4A)', color:'#fff', fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 20px rgba(46,168,106,0.3)', opacity:loading?0.7:1, marginBottom:14 }}>
                {loading ? '...' : 'Create Account 🎉'}
              </button>
              <p style={{ margin:0, fontSize:11, color:'var(--neutral-500)', textAlign:'center', lineHeight:1.5 }}>
                By registering, you agree to the Switch Captain terms of service.
              </p>
            </>
          )}

          {/* ─── OPS LOGIN ───────────────────────────────────── */}
          {screen === 'ops_login' && (
            <>
              <button onClick={() => setScreen('choose_role')} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6, color:'var(--neutral-500)', fontSize:13, fontFamily:'inherit', padding:0, marginBottom:20 }}>
                <ArrowLeft size={14} /> Back
              </button>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize:11, fontWeight:800, color:'#D4A017', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Operations</div>
                <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:'var(--neutral-900)' }}>Ops Sign In 📊</h2>
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }}>Phone Number</label>
                <div style={{ position:'relative' }}>
                  <Phone size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--neutral-500)' }} />
                  <input id="ops-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="10-digit mobile" maxLength={10} style={{ ...inputStyle, paddingLeft:42, fontFamily:'DM Mono, monospace' }} {...focusStyle} onKeyDown={e => e.key==='Enter' && handleLogin()} />
                </div>
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }}>Password</label>
                <div style={{ position:'relative' }}>
                  <Lock size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--neutral-500)' }} />
                  <input id="ops-password" type={showPwd?'text':'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" style={{ ...inputStyle, paddingLeft:42, paddingRight:44 }} {...focusStyle} onKeyDown={e => e.key==='Enter' && handleLogin()} />
                  <button onClick={() => setShowPwd(!showPwd)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--neutral-500)' }}>
                    {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>

              <button id="ops-login-btn" onClick={handleLogin} disabled={loading} style={{ width:'100%', height:52, borderRadius:14, border:'none', background:'linear-gradient(135deg,#D4A017,#b87d12)', color:'#fff', fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 20px rgba(212,160,23,0.3)', opacity:loading?0.7:1, transition:'all 0.2s', marginBottom:14 }}>
                {loading ? '...' : 'Sign In →'}
              </button>

              <div style={{ textAlign:'center' }}>
                <button onClick={() => setScreen('ops_register')} style={{ fontSize:13, fontWeight:700, color:'#D4A017', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>First time? Register →</button>
              </div>

              <div style={{ marginTop:16, padding:'12px 14px', borderRadius:12, background:'var(--accent-gold-light)', border:'1px solid rgba(212,160,23,0.2)' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#D4A017', marginBottom:4 }}>Demo Login</div>
                <div style={{ fontSize:12, color:'var(--neutral-700)', fontFamily:'DM Mono, monospace' }}>📞 9999999999 · 🔑 switch@ops</div>
              </div>
            </>
          )}

          {/* ─── OPS REGISTER ────────────────────────────────── */}
          {screen === 'ops_register' && (
            <>
              <button onClick={() => setScreen('ops_login')} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6, color:'var(--neutral-500)', fontSize:13, fontFamily:'inherit', padding:0, marginBottom:20 }}>
                <ArrowLeft size={14} /> Back to login
              </button>
              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:11, fontWeight:800, color:'#D4A017', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Ops Registration</div>
                <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:'var(--neutral-900)' }}>Set up ops access</h2>
              </div>

              {[
                { id:'ops-reg-name', label:'Your Name *', ph:'Full name', val:name, set:setName, icon:<User size={16}/>, type:'text' },
                { id:'ops-reg-phone', label:'Phone Number *', ph:'10-digit number', val:phone, set:setPhone, icon:<Phone size={16}/>, type:'tel' },
              ].map(({ id, label, ph, val, set, icon, type }) => (
                <div key={id} style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }}>{label}</label>
                  <div style={{ position:'relative' }}>
                    <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--neutral-500)', display:'flex', alignItems:'center' }}>{icon}</div>
                    <input id={id} type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph} style={{ ...inputStyle, paddingLeft:42 }} {...focusStyle} />
                  </div>
                </div>
              ))}

              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }}>Access Code *</label>
                <div style={{ position:'relative' }}>
                  <KeyRound size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--neutral-500)' }} />
                  <input id="ops-code" type="text" value={opsCode} onChange={e => setOpsCode(e.target.value.toUpperCase())} placeholder="Ops team access code" style={{ ...inputStyle, paddingLeft:42, fontFamily:'DM Mono, monospace', letterSpacing:'0.08em' }} {...focusStyle} />
                </div>
              </div>

              {[
                { id:'ops-reg-pwd', label:'Create Password *', ph:'Min 6 characters', val:password, set:setPassword },
                { id:'ops-reg-cpwd', label:'Confirm Password *', ph:'Same as above', val:confirmPwd, set:setConfirmPwd },
              ].map(({ id, label, ph, val, set }) => (
                <div key={id} style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }}>{label}</label>
                  <div style={{ position:'relative' }}>
                    <Lock size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--neutral-500)' }} />
                    <input id={id} type={showPwd?'text':'password'} value={val} onChange={e => set(e.target.value)} placeholder={ph} style={{ ...inputStyle, paddingLeft:42, paddingRight:44 }} {...focusStyle} />
                    <button onClick={() => setShowPwd(!showPwd)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--neutral-500)' }}>{showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                  </div>
                </div>
              ))}

              <button id="ops-register-btn" onClick={handleOpsRegister} disabled={loading} style={{ width:'100%', height:52, borderRadius:14, border:'none', background:'linear-gradient(135deg,#D4A017,#b87d12)', color:'#fff', fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 20px rgba(212,160,23,0.3)', opacity:loading?0.7:1, marginBottom:8 }}>
                {loading ? '...' : 'Create Ops Account →'}
              </button>
            </>
          )}
        </div>

        <p style={{ textAlign:'center', fontSize:12, color:'var(--neutral-500)', marginTop:20 }}>
          Switch Captain Platform · Private Access Only
        </p>
      </div>
    </div>
  );
}
