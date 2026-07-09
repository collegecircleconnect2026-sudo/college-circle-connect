import { useState, type KeyboardEvent } from 'react'
import { supabase } from '../supabase'
import { useIsMobile } from '../hooks/useIsMobile'

export default function Auth() {
  const isMobile = useIsMobile()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('student')
  const [isSignUp, setIsSignUp] = useState(false)
  const [forgotPassword, setForgotPassword] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAuth() {
    if (loading) return
    setError('')
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    if (isSignUp && !fullName.trim()) {
      setError('Please enter your full name so mentors know who you are.')
      return
    }
    setLoading(true)
    if (isSignUp) {
      const name = fullName.trim()
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      if (data.user) {
        const { error: profileError } = await supabase.from('users').insert({
          id: data.user.id,
          full_name: name,
          email,
          role,
          avatar_initials: name.split(' ').filter(Boolean).map((n:string) => n[0]).join('').slice(0,2).toUpperCase()
        })
        if (profileError) {
          setError(profileError.message)
          setLoading(false)
          return
        }
        if (role === 'mentor') {
          const { error: mentorError } = await supabase.from('mentors').insert({
            user_id: data.user.id,
            field: 'Not set',
            company: 'Not set',
            is_available: true
          })
          if (mentorError) {
            setError(mentorError.message)
            setLoading(false)
            return
          }
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
    }
    setLoading(false)
  }

  async function handleResetRequest() {
    if (loading) return
    setError('')
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    setLoading(true)
    // The result is deliberately ignored: showing the same confirmation whether
    // or not the email has an account keeps the form from leaking which
    // addresses are registered.
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    setResetSent(true)
  }

  function toggleForgotPassword(show: boolean) {
    setForgotPassword(show)
    setResetSent(false)
    setError('')
  }

  // Submit on Enter from any of the form fields.
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleAuth()
  }

  const label: any = {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 6,
    fontFamily: 'sans-serif',
  }
  const input: any = {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid rgba(212,160,23,0.28)',
    borderRadius: 10,
    fontSize: 14,
    marginBottom: 16,
    boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)',
    color: 'white',
    fontFamily: 'sans-serif',
    outline: 'none',
  }
  const goldBtn: any = {
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg,#F0C040,#D4A017)',
    color: '#1E0A5C',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: loading ? 'wait' : 'pointer',
    fontFamily: 'sans-serif',
    letterSpacing: .4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: loading ? 0.8 : 1,
  }

  return (
    <div className="cc-fade" style={{
      position: 'relative',
      minHeight:'100dvh',
      // On mobile the two panels stack vertically and their combined content is
      // taller than the viewport. Because #root has overflow:hidden, we make the
      // Auth container its own scroll region so the bottom (the sign-up toggle)
      // stays reachable instead of being clipped.
      height: isMobile ? '100dvh' : undefined,
      overflowY: isMobile ? 'auto' : undefined,
      display:'flex',
      flexDirection: isMobile ? 'column' : 'row',
      background:'#1E0A5C',
      fontFamily:"'Georgia', serif",
    }}>
      {/* Animated background glows. Fixed so they stay put while the mobile
          scroll region moves, and sit behind everything else. */}
      <div aria-hidden style={{position:'fixed',inset:0,overflow:'hidden',pointerEvents:'none',zIndex:0}}>
        <div className="cc-auth-glow cc-auth-glow-a"></div>
        <div className="cc-auth-glow cc-auth-glow-b"></div>
        <div className="cc-auth-glow cc-auth-glow-c"></div>
      </div>

      <div style={{
        position: 'relative',
        zIndex: 1,
        flex: isMobile ? '0 0 auto' : 1,
        display:'flex',
        flexDirection:'column',
        alignItems:'center',
        justifyContent:'center',
        padding: isMobile ? '40px 28px 32px' : '48px',
        borderRight: isMobile ? 'none' : '1px solid rgba(212,160,23,0.15)',
        borderBottom: isMobile ? '1px solid rgba(212,160,23,0.15)' : 'none',
      }}>
        <div style={{maxWidth:420,width:'100%'}}>
          <div className="cc-rise cc-emblem" style={{
            width:64,height:64,borderRadius:'50%',
            border:'1.5px solid #D4A017',
            background:'rgba(212,160,23,0.08)',
            display:'flex',alignItems:'center',justifyContent:'center',
            marginBottom:24,
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="1.5">
              <path d="M12 2L12 6M12 18L12 22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12L6 12M18 12L22 12M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93"/>
            </svg>
          </div>
          <div className="cc-rise" style={{animationDelay:'0.08s',fontSize:12,color:'#D4A017',fontFamily:'sans-serif',fontWeight:600,letterSpacing:2.5,textTransform:'uppercase',marginBottom:10}}>
            Hartford Memorial Baptist Church
          </div>
          <div className="cc-rise" style={{animationDelay:'0.16s',fontSize:isMobile?30:38,fontWeight:400,color:'white',lineHeight:1.15,marginBottom:14,letterSpacing:'-0.5px'}}>
            College Circle Connect
          </div>
          <div className="cc-rise" style={{animationDelay:'0.24s',width:56,height:2,background:'linear-gradient(90deg,#D4A017,rgba(212,160,23,0))',marginBottom:22}}></div>
          <div className="cc-rise" style={{animationDelay:'0.32s',fontSize:isMobile?18:21,color:'rgba(255,255,255,0.88)',lineHeight:1.55,fontStyle:'italic'}}>
            “As iron sharpens iron, so one person sharpens another.”
          </div>
          <div className="cc-rise" style={{animationDelay:'0.4s',fontSize:12,color:'rgba(212,160,23,0.85)',marginTop:10,fontFamily:'sans-serif',fontWeight:600,letterSpacing:1.5,textTransform:'uppercase'}}>
            Proverbs 27:17
          </div>
          <div className="cc-rise" style={{animationDelay:'0.48s',marginTop:32,fontSize:13,color:'rgba(255,255,255,0.45)',fontFamily:'sans-serif',lineHeight:1.7}}>
            Connecting students with seasoned professionals from our church community — so that faith and purpose walk hand in hand into every career.
          </div>
        </div>
      </div>

      <div style={{
        position: 'relative',
        zIndex: 1,
        flex: isMobile ? '0 0 auto' : 1,
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        padding: isMobile ? '32px 24px 40px' : '48px',
      }}>
        <div className="cc-rise" style={{
          animationDelay:'0.2s',
          maxWidth:400,
          width:'100%',
          background:'rgba(45,27,126,0.42)',
          backdropFilter:'blur(18px)',
          WebkitBackdropFilter:'blur(18px)',
          border:'1px solid rgba(212,160,23,0.22)',
          borderRadius:20,
          padding: isMobile ? '28px 22px' : '36px 32px',
          boxShadow:'inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 60px rgba(0,0,0,0.35), 0 0 48px rgba(212,160,23,0.07)',
          boxSizing:'border-box' as any,
        }}>
          {forgotPassword ? (
          <div key="forgot" className="cc-swap">
            <div style={{fontSize:22,fontWeight:600,color:'white',marginBottom:6,fontFamily:'sans-serif',letterSpacing:'-0.2px'}}>
              Reset your password
            </div>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.45)',marginBottom:26,fontFamily:'sans-serif'}}>
              {resetSent ? 'Your reset link is on its way' : "Enter your email and we'll send you a reset link"}
            </div>

            {error && (
              <div style={{fontSize:12,color:'#ff8a8a',marginBottom:16,background:'rgba(255,100,100,0.1)',border:'1px solid rgba(255,100,100,0.25)',padding:'10px 12px',borderRadius:10,fontFamily:'sans-serif',lineHeight:1.5}}>
                {error}
              </div>
            )}

            {resetSent ? (
              <div style={{fontSize:13,color:'#F0C040',background:'rgba(212,160,23,0.1)',border:'1px solid rgba(212,160,23,0.3)',padding:'12px 14px',borderRadius:10,fontFamily:'sans-serif',lineHeight:1.6}}>
                Check your email for a reset link. If it doesn't arrive within a few minutes, look in your spam folder.
              </div>
            ) : (
              <>
                <div style={label}>Email</div>
                <input
                  className="cc-input"
                  style={{...input,marginBottom:24}}
                  type="email"
                  value={email}
                  onChange={e=>setEmail(e.target.value)}
                  onKeyDown={e=>{ if (e.key === 'Enter') handleResetRequest() }}
                  placeholder="you@email.com"
                />

                <button
                  className="cc-btn-gold"
                  style={goldBtn}
                  onClick={handleResetRequest}
                  disabled={loading}
                >
                  {loading && <span className="cc-spinner cc-spinner-sm" style={{borderColor:'rgba(30,10,92,0.25)',borderTopColor:'#1E0A5C'}}></span>}
                  {loading ? 'Please wait...' : 'Send reset link'}
                </button>
              </>
            )}

            <div style={{textAlign:'center',marginTop:22,fontSize:13,color:'rgba(255,255,255,0.45)',fontFamily:'sans-serif'}}>
              <span className="cc-chip" style={{display:'inline-block',color:'#F0C040',cursor:'pointer',fontWeight:600,borderBottom:'1px solid rgba(240,192,64,0.4)',paddingBottom:1}} onClick={()=>toggleForgotPassword(false)}>
                Back to sign in
              </span>
            </div>
          </div>
          ) : (
          <div key={isSignUp ? 'signup' : 'signin'} className="cc-swap">
            <div style={{fontSize:22,fontWeight:600,color:'white',marginBottom:6,fontFamily:'sans-serif',letterSpacing:'-0.2px'}}>
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </div>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.45)',marginBottom:26,fontFamily:'sans-serif'}}>
              {isSignUp ? 'Join your church mentorship community' : 'Sign in to your Circle'}
            </div>

            {error && (
              <div style={{fontSize:12,color:'#ff8a8a',marginBottom:16,background:'rgba(255,100,100,0.1)',border:'1px solid rgba(255,100,100,0.25)',padding:'10px 12px',borderRadius:10,fontFamily:'sans-serif',lineHeight:1.5}}>
                {error}
              </div>
            )}

            {isSignUp && (
              <>
                <div style={label}>Full name</div>
                <input
                  className="cc-input"
                  style={input}
                  value={fullName}
                  onChange={e=>setFullName(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Your full name"
                />
                <div style={label}>I am a</div>
                <select
                  className="cc-input"
                  style={{...input,background:'#2D1B7E',cursor:'pointer'}}
                  value={role}
                  onChange={e=>setRole(e.target.value)}
                >
                  <option value="student">Student</option>
                  <option value="mentor">Mentor</option>
                </select>
              </>
            )}

            <div style={label}>Email</div>
            <input
              className="cc-input"
              style={input}
              type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="you@email.com"
            />

            <div style={label}>Password</div>
            <input
              className="cc-input"
              style={{...input,marginBottom:24}}
              type="password"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="••••••••"
            />

            <button
              className="cc-btn-gold"
              style={goldBtn}
              onClick={handleAuth}
              disabled={loading}
            >
              {loading && <span className="cc-spinner cc-spinner-sm" style={{borderColor:'rgba(30,10,92,0.25)',borderTopColor:'#1E0A5C'}}></span>}
              {loading ? 'Please wait...' : isSignUp ? 'Join the Circle' : 'Sign in'}
            </button>

            {!isSignUp && (
              <div style={{textAlign:'center',marginTop:16,fontSize:13,fontFamily:'sans-serif'}}>
                <span className="cc-chip" style={{display:'inline-block',color:'rgba(255,255,255,0.55)',cursor:'pointer',borderBottom:'1px solid rgba(255,255,255,0.25)',paddingBottom:1}} onClick={()=>toggleForgotPassword(true)}>
                  Forgot password?
                </span>
              </div>
            )}

            <div style={{textAlign:'center',marginTop:isSignUp?22:14,fontSize:13,color:'rgba(255,255,255,0.45)',fontFamily:'sans-serif'}}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <span className="cc-chip" style={{display:'inline-block',color:'#F0C040',cursor:'pointer',fontWeight:600,borderBottom:'1px solid rgba(240,192,64,0.4)',paddingBottom:1}} onClick={()=>setIsSignUp(!isSignUp)}>
                {isSignUp ? 'Sign in' : 'Sign up'}
              </span>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
