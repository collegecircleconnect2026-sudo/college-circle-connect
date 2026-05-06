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

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'sans-serif',color:'#534AB7'}}>
      Loading...
    </div>
  )

  if (!session) return <Auth />

  if (!userProfile) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'sans-serif'}}>
      Setting up your profile...
    </div>
  )

  if (userProfile.role === 'mentor') return <MentorDashboard profile={userProfile} />
  if (userProfile.role === 'church_admin') return <ChurchAdminDashboard profile={userProfile} />
  return <StudentDashboard profile={userProfile} />
}

export default App