import { useState, type KeyboardEvent } from 'react'
import { supabase } from '../supabase'
import { useIsMobile } from '../hooks/useIsMobile'

// Shown when the app is opened from a Supabase password-recovery link
// (App.tsx renders this on the PASSWORD_RECOVERY auth event). The recovery
// link signs the user in, so updateUser can set the new password directly.
export default function ResetPassword({ onComplete }: { onComplete: () => void }) {
  const isMobile = useIsMobile()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit() {
    if (loading || success) return
    setError('')
    if (password.length < 6) {
      setError('Your password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError("Those passwords don't match.")
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    setLoading(false)
    setSuccess(true)
    // Give the success message a moment to land before heading into the app.
    setTimeout(onComplete, 1500)
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit()
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

  return (
    <div className="cc-fade" style={{
      position: 'relative',
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1E0A5C',
      fontFamily: "'Georgia', serif",
      padding: isMobile ? '32px 24px' : '48px',
    }}>
      <div aria-hidden style={{position:'fixed',inset:0,overflow:'hidden',pointerEvents:'none',zIndex:0}}>
        <div className="cc-auth-glow cc-auth-glow-a"></div>
        <div className="cc-auth-glow cc-auth-glow-b"></div>
        <div className="cc-auth-glow cc-auth-glow-c"></div>
      </div>

      <div className="cc-rise" style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: 400,
        width: '100%',
        background: 'rgba(45,27,126,0.42)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(212,160,23,0.22)',
        borderRadius: 20,
        padding: isMobile ? '28px 22px' : '36px 32px',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 60px rgba(0,0,0,0.35), 0 0 48px rgba(212,160,23,0.07)',
        boxSizing: 'border-box' as any,
      }}>
        <div className="cc-emblem" style={{
          width:48,height:48,borderRadius:'50%',
          border:'1.5px solid #D4A017',
          background:'rgba(212,160,23,0.08)',
          display:'flex',alignItems:'center',justifyContent:'center',
          marginBottom:20,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="1.5">
            <rect x="5" y="10" width="14" height="10" rx="2"/>
            <path d="M8 10V7a4 4 0 0 1 8 0v3"/>
          </svg>
        </div>

        <div style={{fontSize:22,fontWeight:600,color:'white',marginBottom:6,fontFamily:'sans-serif',letterSpacing:'-0.2px'}}>
          Choose a new password
        </div>
        <div style={{fontSize:13,color:'rgba(255,255,255,0.45)',marginBottom:26,fontFamily:'sans-serif'}}>
          {success ? 'All set — welcome back' : 'Almost back in your Circle'}
        </div>

        {error && (
          <div style={{fontSize:12,color:'#ff8a8a',marginBottom:16,background:'rgba(255,100,100,0.1)',border:'1px solid rgba(255,100,100,0.25)',padding:'10px 12px',borderRadius:10,fontFamily:'sans-serif',lineHeight:1.5}}>
            {error}
          </div>
        )}

        {success ? (
          <div style={{fontSize:13,color:'#F0C040',background:'rgba(212,160,23,0.1)',border:'1px solid rgba(212,160,23,0.3)',padding:'12px 14px',borderRadius:10,fontFamily:'sans-serif',lineHeight:1.6}}>
            Your password has been updated. Taking you to your Circle...
          </div>
        ) : (
          <>
            <div style={label}>New password</div>
            <input
              className="cc-input"
              style={input}
              type="password"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="At least 6 characters"
            />

            <div style={label}>Confirm new password</div>
            <input
              className="cc-input"
              style={{...input,marginBottom:24}}
              type="password"
              value={confirmPassword}
              onChange={e=>setConfirmPassword(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="••••••••"
            />

            <button
              className="cc-btn-gold"
              style={{
                width:'100%',
                padding:'13px',
                background:'linear-gradient(135deg,#F0C040,#D4A017)',
                color:'#1E0A5C',
                border:'none',
                borderRadius:10,
                fontSize:14,
                fontWeight:700,
                cursor: loading ? 'wait' : 'pointer',
                fontFamily:'sans-serif',
                letterSpacing:.4,
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                gap:8,
                opacity: loading ? 0.8 : 1,
              }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading && <span className="cc-spinner cc-spinner-sm" style={{borderColor:'rgba(30,10,92,0.25)',borderTopColor:'#1E0A5C'}}></span>}
              {loading ? 'Please wait...' : 'Update password'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
