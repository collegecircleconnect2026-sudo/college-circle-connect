import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './components/Auth'
import ResetPassword from './components/ResetPassword'
import StudentDashboard from './components/StudentDashboard'
import MentorDashboard from './components/MentorDashboard'
import ChurchAdminDashboard from './components/ChurchAdminDashboard'

function App() {
  const [session, setSession] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [profileError, setProfileError] = useState('')
  const [loading, setLoading] = useState(true)
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Supabase fires PASSWORD_RECOVERY when the app is opened from a reset
      // link. Flag it so we show the reset-password form instead of the
      // dashboards until the user has chosen a new password.
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else { setUserProfile(null); setProfileError(''); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) {
      setProfileError(error.message)
      setUserProfile(null)
    } else {
      setProfileError('')
      setUserProfile(data)
    }
    setLoading(false)
  }

  const loadingScreen = (message: string) => (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,height:'100vh',fontFamily:'sans-serif',background:'#1E0A5C'}}>
      <div className="cc-spinner"></div>
      <div style={{fontSize:13,color:'rgba(255,255,255,0.6)'}}>{message}</div>
    </div>
  )

  if (loading) return loadingScreen('Loading your Circle...')

  if (recovering && session) {
    return (
      <ResetPassword
        onComplete={() => {
          setRecovering(false)
          // Drop the /reset-password path so a reload lands on the normal app.
          window.history.replaceState(null, '', '/')
        }}
      />
    )
  }

  if (!session) return <Auth />

  // The signed-in user's profile row could not be loaded (network problem,
  // or the row was never created). Instead of hanging on a spinner forever,
  // surface the error with a way out.
  if (!userProfile) {
    return (
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:14,height:'100vh',fontFamily:'sans-serif',background:'#1E0A5C',padding:24,textAlign:'center'}}>
        <div style={{fontSize:26}}>⛅</div>
        <div style={{fontSize:16,fontWeight:600,color:'white'}}>We couldn't load your profile</div>
        <div style={{fontSize:13,color:'rgba(255,255,255,0.6)',maxWidth:380,lineHeight:1.6}}>
          {profileError || 'Your account exists but its profile is missing. Try again, or sign out and sign back up.'}
        </div>
        <div style={{display:'flex',gap:10,marginTop:6}}>
          <button
            className="cc-btn-gold"
            style={{padding:'10px 20px',background:'linear-gradient(135deg,#F0C040,#D4A017)',color:'#1E0A5C',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'sans-serif'}}
            onClick={() => { setLoading(true); fetchProfile(session.user.id) }}
          >
            Try again
          </button>
          <button
            style={{padding:'10px 20px',background:'transparent',color:'rgba(255,255,255,0.75)',border:'1px solid #3D2A9E',borderRadius:8,fontSize:13,cursor:'pointer',fontFamily:'sans-serif'}}
            onClick={() => supabase.auth.signOut()}
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  if (userProfile.role === 'mentor') return <MentorDashboard profile={userProfile} />
  if (userProfile.role === 'church_admin') return <ChurchAdminDashboard profile={userProfile} />
  return <StudentDashboard profile={userProfile} />
}

export default App
