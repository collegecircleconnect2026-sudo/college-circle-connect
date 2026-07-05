import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './components/Auth'
import StudentDashboard from './components/StudentDashboard'
import MentorDashboard from './components/MentorDashboard'
import ChurchAdminDashboard from './components/ChurchAdminDashboard'

function App() {
  const [session, setSession] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else { setUserProfile(null); setLoading(false) }
    })
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    setUserProfile(data)
    setLoading(false)
  }

  const loadingScreen = (message: string) => (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,height:'100vh',fontFamily:'sans-serif',background:'#1E0A5C'}}>
      <div className="cc-spinner"></div>
      <div style={{fontSize:13,color:'rgba(255,255,255,0.6)'}}>{message}</div>
    </div>
  )

  if (loading) return loadingScreen('Loading your Circle...')

  if (!session) return <Auth />

  if (!userProfile) return loadingScreen('Setting up your profile...')

  if (userProfile.role === 'mentor') return <MentorDashboard profile={userProfile} />
  if (userProfile.role === 'church_admin') return <ChurchAdminDashboard profile={userProfile} />
  return <StudentDashboard profile={userProfile} />
}

export default App