import { useState } from 'react'
import { supabase } from '../supabase'
import { useIsMobile } from '../hooks/useIsMobile'

export default function Auth() {
  const isMobile = useIsMobile()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('student')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAuth() {
    setLoading(true)
    setError('')
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
     if (data.user) {
  await supabase.from('users').insert({
    id: data.user.id,
    full_name: fullName,
    email,
    role,
    avatar_initials: fullName.split(' ').map((n:string) => n[0]).join('').slice(0,2).toUpperCase()
  })
  if (role === 'mentor') {
    await supabase.from('mentors').insert({
      user_id: data.user.id,
      field: 'Not set',
      company: 'Not set',
      is_available: true
    })
  }
}
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight:'100vh',
      display:'flex',
      flexDirection: isMobile ? 'column' : 'row',
      background:'#1E0A5C',
      fontFamily:"'Georgia', serif",
    }}>
      <div style={{
        flex:1,
        display:'flex',
        flexDirection:'column',
        alignItems:'center',
        justifyContent:'center',
        padding: isMobile ? '32px 24px' : '40px',
        borderRight: isMobile ? 'none' : '0.5px solid rgba(212,160,23,0.2)',
        borderBottom: isMobile ? '0.5px solid rgba(212,160,23,0.2)' : 'none',
      }}>
        <div style={{maxWidth:400,width:'100%'}}>
          <div style={{
            width:60,height:60,borderRadius:'50%',
            border:'2px solid #D4A017',
            display:'flex',alignItems:'center',justifyContent:'center',
            marginBottom:20,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="1.5">
              <path d="M12 2L12 6M12 18L12 22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12L6 12M18 12L22 12M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93"/>
            </svg>
          </div>
          <div style={{fontSize:13,color:'#D4A017',fontFamily:'sans-serif',letterSpacing:2,textTransform:'uppercase',marginBottom:8}}>
            Hartford Memorial Baptist Church
          </div>
          <div style={{fontSize:32,fontWeight:400,color:'white',lineHeight:1.2,marginBottom:8}}>
            College Circle Connect
          </div>
          <div style={{width:40,height:2,background:'#D4A017',marginBottom:16}}></div>
          <div style={{fontSize:14,color:'rgba(255,255,255,0.5)',lineHeight:1.7,fontFamily:'sans-serif',fontStyle:'italic'}}>
            "As iron sharpens iron, so one person sharpens another."
          </div>
          <div style={{fontSize:12,color:'rgba(212,160,23,0.7)',marginTop:6,fontFamily:'sans-serif'}}>
            — Proverbs 27:17
          </div>
          <div style={{marginTop:32,fontSize:13,color:'rgba(255,255,255,0.4)',fontFamily:'sans-serif',lineHeight:1.7}}>
            Connecting students with seasoned professionals from our church community — so that faith and purpose walk hand in hand into every career.
          </div>
        </div>
      </div>

      <div style={{
        flex:1,
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        padding: isMobile ? '32px 24px' : '40px',
      }}>
        <div style={{maxWidth:380,width:'100%'}}>
          <div style={{fontSize:20,fontWeight:400,color:'white',marginBottom:4,fontFamily:'sans-serif'}}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.4)',marginBottom:28,fontFamily:'sans-serif'}}>
            {isSignUp ? 'Join your church mentorship community' : 'Sign in to your Circle'}
          </div>

          {error && (
            <div style={{fontSize:12,color:'#ff6b6b',marginBottom:16,background:'rgba(255,100,100,0.1)',padding:'10px 12px',borderRadius:8,fontFamily:'sans-serif'}}>
              {error}
            </div>
          )}

          {isSignUp && (
            <>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',marginBottom:6,fontFamily:'sans-serif'}}>Full name</div>
              <input
                style={{width:'100%',padding:'11px 14px',border:'0.5px solid rgba(212,160,23,0.3)',borderRadius:8,fontSize:13,marginBottom:16,boxSizing:'border-box' as any,background:'rgba(255,255,255,0.05)',color:'white',fontFamily:'sans-serif',outline:'none'}}
                value={fullName}
                onChange={e=>setFullName(e.target.value)}
                placeholder="Your full name"
              />
              <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',marginBottom:6,fontFamily:'sans-serif'}}>I am a</div>
              <select
                style={{width:'100%',padding:'11px 14px',border:'0.5px solid rgba(212,160,23,0.3)',borderRadius:8,fontSize:13,marginBottom:16,boxSizing:'border-box' as any,background:'#2D1B7E',color:'white',fontFamily:'sans-serif',outline:'none'}}
                value={role}
                onChange={e=>setRole(e.target.value)}
              >
                <option value="student">Student</option>
                <option value="mentor">Mentor</option>
              </select>
            </>
          )}

          <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',marginBottom:6,fontFamily:'sans-serif'}}>Email</div>
          <input
            style={{width:'100%',padding:'11px 14px',border:'0.5px solid rgba(212,160,23,0.3)',borderRadius:8,fontSize:13,marginBottom:16,boxSizing:'border-box' as any,background:'rgba(255,255,255,0.05)',color:'white',fontFamily:'sans-serif',outline:'none'}}
            type="email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            placeholder="you@email.com"
          />

          <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',marginBottom:6,fontFamily:'sans-serif'}}>Password</div>
          <input
            style={{width:'100%',padding:'11px 14px',border:'0.5px solid rgba(212,160,23,0.3)',borderRadius:8,fontSize:13,marginBottom:24,boxSizing:'border-box' as any,background:'rgba(255,255,255,0.05)',color:'white',fontFamily:'sans-serif',outline:'none'}}
            type="password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <button
            style={{width:'100%',padding:'12px',background:'#D4A017',color:'#1E0A5C',border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'sans-serif',letterSpacing:.3}}
            onClick={handleAuth}
            disabled={loading}
          >
            {loading ? 'Please wait...' : isSignUp ? 'Join the Circle' : 'Sign in'}
          </button>

          <div style={{textAlign:'center',marginTop:20,fontSize:13,color:'rgba(255,255,255,0.4)',fontFamily:'sans-serif'}}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <span style={{color:'#D4A017',cursor:'pointer',fontWeight:500}} onClick={()=>setIsSignUp(!isSignUp)}>
              {isSignUp ? 'Sign in' : 'Sign up'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
