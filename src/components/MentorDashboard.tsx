import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function MentorDashboard({ profile }: { profile: any }) {
  const [page, setPage] = useState('requests')
  const [mentorProfile, setMentorProfile] = useState<any>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [cohorts, setCohorts] = useState<any[]>([])

  useEffect(() => { fetchMentorProfile() }, [])

  async function fetchMentorProfile() {
    const { data } = await supabase.from('mentors').select('*').eq('user_id', profile.id).single()
    setMentorProfile(data)
    if (data) { fetchRequests(data.id); fetchMatches(data.id); fetchCohorts(data.id) }
  }

  async function fetchRequests(mentorId: string) {
    const { data } = await supabase.from('matches').select('*, users(*)').eq('mentor_id', mentorId).eq('status', 'pending')
    setRequests(data || [])
  }

  async function fetchMatches(mentorId: string) {
    const { data } = await supabase.from('matches').select('*, users(*)').eq('mentor_id', mentorId).eq('status', 'active')
    setMatches(data || [])
  }

  async function fetchCohorts(mentorId: string) {
    const { data } = await supabase.from('cohorts').select('*, cohort_members(*, users(*))').eq('mentor_id', mentorId)
    setCohorts(data || [])
  }

  async function handleRequest(matchId: string, action: 'active' | 'declined') {
    await supabase.from('matches').update({
      status: action,
      matched_at: action === 'active' ? new Date().toISOString() : null
    }).eq('id', matchId)
    if (mentorProfile) { fetchRequests(mentorProfile.id); fetchMatches(mentorProfile.id) }
  }

  const C = {
    bg: '#1E0A5C',
    sidebar: '#2D1B7E',
    card: '#2D1B7E',
    border: '#3D2A9E',
    gold: '#D4A017',
    goldLight: '#F0C040',
    white: '#FFFFFF',
    muted: 'rgba(255,255,255,0.6)',
    hint: 'rgba(255,255,255,0.35)',
  }

  const s: any = {
    app: {display:'flex',height:'100vh',fontFamily:'sans-serif',background:C.bg},
    sidebar: {width:210,background:C.sidebar,borderRight:`0.5px solid ${C.border}`,display:'flex',flexDirection:'column'},
    logo: {padding:'16px 18px',borderBottom:`0.5px solid ${C.border}`},
    logoTitle: {fontSize:13,fontWeight:500,color:C.gold},
    logoSub: {fontSize:11,color:C.muted,marginTop:2},
    pill: {margin:'10px 18px 0',padding:'5px 10px',background:'rgba(212,160,23,0.15)',borderRadius:20,fontSize:11,color:C.gold,fontWeight:500,display:'inline-block'},
    nav: {padding:'10px 0',flex:1},
    navSection: {padding:'6px 18px 4px',fontSize:10,color:C.hint,textTransform:'uppercase' as any,letterSpacing:0.6,marginTop:6},
    navItem: (active:boolean) => ({padding:'7px 18px',fontSize:13,color:active?C.gold:C.muted,cursor:'pointer',borderLeft:active?`2px solid ${C.gold}`:'2px solid transparent',background:active?'rgba(212,160,23,0.1)':'transparent',fontWeight:active?500:400}),
    signOut: {padding:'12px 18px',borderTop:`0.5px solid ${C.border}`},
    signOutBtn: {width:'100%',padding:'6px',border:`0.5px solid ${C.border}`,borderRadius:8,fontSize:12,cursor:'pointer',background:'transparent',color:C.muted},
    main: {flex:1,overflowY:'auto' as any,padding:24},
    ph: {marginBottom:18},
    pt: {fontSize:17,fontWeight:500,color:C.white},
    ps: {fontSize:12,color:C.muted,marginTop:3},
    reqRow: {background:C.card,border:`0.5px solid ${C.border}`,borderRadius:12,padding:'12px 14px',marginBottom:8,display:'flex',alignItems:'center',gap:10},
    av: (bg:string,fg:string,size?:number) => ({width:size||36,height:size||36,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:500,background:bg,color:fg,flexShrink:0}),
    btn: (primary:boolean) => ({padding:'6px 13px',background:primary?C.gold:'transparent',color:primary?C.bg:C.muted,border:primary?'none':`0.5px solid ${C.border}`,borderRadius:8,fontSize:12,cursor:'pointer',fontWeight:primary?700:400}),
    card: {background:C.card,border:`0.5px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:10},
    impactGrid: {display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16},
    impactItem: {background:'rgba(212,160,23,0.08)',borderRadius:8,padding:14,textAlign:'center' as any},
    impactBig: {fontSize:30,fontWeight:500,color:C.gold},
    impactLabel: {fontSize:12,color:C.muted,marginTop:2},
    winDot: {width:8,height:8,borderRadius:'50%',background:C.gold,marginTop:5,flexShrink:0},
    quote: {fontSize:13,color:C.muted,lineHeight:1.6,borderLeft:`2px solid ${C.gold}`,paddingLeft:12,marginBottom:0,borderRadius:0},
  }

  return (
    <div style={s.app}>
      <div style={s.sidebar}>
        <div style={s.logo}>
          <div style={s.logoTitle}>College Circle Connect</div>
          <div style={s.logoSub}>Hartford Memorial Baptist Church</div>
        </div>
        <div style={{padding:'8px 18px 0'}}><span style={s.pill}>Mentor portal</span></div>
        <div style={s.nav}>
          <div style={s.navSection}>Mentoring</div>
          <div style={s.navItem(page==='requests')} onClick={()=>setPage('requests')}>Incoming requests</div>
          <div style={s.navItem(page==='impact')} onClick={()=>setPage('impact')}>My impact</div>
          <div style={s.navItem(page==='cohorts')} onClick={()=>setPage('cohorts')}>My cohorts</div>
          <div style={s.navSection}>Account</div>
          <div style={s.navItem(page==='profile')} onClick={()=>setPage('profile')}>My profile</div>
        </div>
        <div style={s.signOut}>
          <button style={s.signOutBtn} onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </div>

      <div style={s.main}>
        {page === 'requests' && (
          <>
            <div style={s.ph}><div style={s.pt}>Incoming requests</div><div style={s.ps}>Students who want to connect with you</div></div>
            {requests.length === 0 && <div style={{fontSize:13,color:C.muted,marginTop:20}}>No pending requests right now.</div>}
            {requests.map(r => (
              <div key={r.id} style={s.reqRow}>
                <div style={{...s.av('rgba(212,160,23,0.2)',C.goldLight),marginBottom:0}}>{r.users?.avatar_initials || '??'}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500,color:C.white}}>{r.users?.full_name}</div>
                  <div style={{fontSize:12,color:C.muted}}>{r.users?.field_of_interest || 'Student'}</div>
                </div>
                <div style={{display:'flex',gap:6}}>
                  <button style={s.btn(true)} onClick={() => handleRequest(r.id, 'active')}>Accept</button>
                  <button style={s.btn(false)} onClick={() => handleRequest(r.id, 'declined')}>Decline</button>
                </div>
              </div>
            ))}
            {matches.length > 0 && (
              <>
                <div style={{fontSize:13,fontWeight:500,color:C.white,margin:'18px 0 10px'}}>Active mentees</div>
                {matches.map(m => (
                  <div key={m.id} style={s.reqRow}>
                    <div style={{...s.av('rgba(93,202,165,0.2)','#5DCAA5'),marginBottom:0}}>{m.users?.avatar_initials || '??'}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:500,color:C.white}}>{m.users?.full_name}</div>
                      <div style={{fontSize:12,color:C.muted}}>{m.users?.email}</div>
                    </div>
                    <span style={{fontSize:11,fontWeight:500,padding:'3px 8px',borderRadius:20,background:'rgba(93,202,165,0.2)',color:'#5DCAA5'}}>Active</span>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {page === 'impact' && (
          <>
            <div style={s.ph}><div style={s.pt}>My impact</div><div style={s.ps}>The difference you are making at Hartford Memorial</div></div>
            <div style={s.impactGrid}>
              <div style={s.impactItem}><div style={s.impactBig}>{matches.length}</div><div style={s.impactLabel}>Active mentees</div></div>
              <div style={s.impactItem}><div style={s.impactBig}>{requests.length}</div><div style={s.impactLabel}>Pending requests</div></div>
              <div style={s.impactItem}><div style={s.impactBig}>{cohorts.length}</div><div style={s.impactLabel}>Cohorts led</div></div>
            </div>
            <div style={s.card}>
              <div style={{fontSize:13,fontWeight:500,color:C.white,marginBottom:12}}>Your active mentees</div>
              {matches.length === 0 && <div style={{fontSize:13,color:C.muted}}>No active mentees yet — accept a request to get started.</div>}
              {matches.map(m => (
                <div key={m.id} style={{display:'flex',gap:8,alignItems:'flex-start',padding:'8px 0',borderBottom:`0.5px solid ${C.border}`}}>
                  <div style={s.winDot}></div>
                  <div>
                    <div style={{fontSize:13,color:C.white}}>{m.users?.full_name}</div>
                    <div style={{fontSize:11,color:C.hint,marginTop:2}}>{m.users?.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {page === 'cohorts' && (
          <>
            <div style={s.ph}><div style={s.pt}>My cohorts</div><div style={s.ps}>Small groups you are leading</div></div>
            {cohorts.length === 0 && <div style={{fontSize:13,color:C.muted,marginTop:20}}>No cohorts yet.</div>}
            {cohorts.map(c => (
              <div key={c.id} style={s.card}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                  <div style={{fontSize:14,fontWeight:500,color:C.white}}>{c.title}</div>
                  <span style={{fontSize:11,fontWeight:500,padding:'3px 8px',borderRadius:20,background:'rgba(93,202,165,0.2)',color:'#5DCAA5'}}>Active</span>
                </div>
                <div style={{fontSize:12,color:C.muted,marginBottom:8}}>{c.description}</div>
                <div style={{fontSize:11,color:C.hint,marginBottom:10}}>Next session: {c.next_session || 'TBD'}</div>
                <div style={{fontSize:12,color:C.muted}}>{c.cohort_members?.length || 0} of {c.max_spots} spots filled</div>
              </div>
            ))}
          </>
        )}

        {page === 'profile' && (
          <>
            <div style={s.ph}><div style={s.pt}>My profile</div><div style={s.ps}>This is what students see when they view your mentor card</div></div>
            {mentorProfile && <ProfileEditor mentorProfile={mentorProfile} onSave={fetchMentorProfile} C={C} />}
            {!mentorProfile && <div style={{fontSize:13,color:C.muted,marginTop:20}}>Loading your profile...</div>}
          </>
        )}
      </div>
    </div>
  )
}

function ProfileEditor({ mentorProfile, onSave, C }: any) {
  const [field, setField] = useState(mentorProfile.field || '')
  const [company, setCompany] = useState(mentorProfile.company || '')
  const [story, setStory] = useState(mentorProfile.personal_story || '')
  const [journey, setJourney] = useState(mentorProfile.career_journey || '')
  const [available, setAvailable] = useState(mentorProfile.is_available)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    await supabase.from('mentors').update({
      field,
      company,
      personal_story: story,
      career_journey: journey,
      is_available: available
    }).eq('id', mentorProfile.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onSave()
  }

  const inputStyle = {
    width:'100%',padding:'10px 12px',border:`0.5px solid ${C.border}`,
    borderRadius:8,fontSize:13,marginBottom:14,boxSizing:'border-box' as any,
    background:'#1E0A5C',color:C.white,fontFamily:'sans-serif',outline:'none'
  }
  const textareaStyle = {...inputStyle, minHeight:100, resize:'vertical' as any}
  const labelStyle = {fontSize:12,color:C.muted,marginBottom:5,display:'block',fontFamily:'sans-serif'}

  return (
    <div style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:12,padding:20}}>
      <label style={labelStyle}>Field of work</label>
      <select style={inputStyle} value={field} onChange={e=>setField(e.target.value)}>
        <option value="Technology">Technology</option>
        <option value="Healthcare">Healthcare</option>
        <option value="Finance">Finance</option>
        <option value="Law">Law</option>
        <option value="Education">Education</option>
        <option value="Marketing">Marketing</option>
      </select>

      <label style={labelStyle}>Company / Organization</label>
      <input style={inputStyle} value={company} onChange={e=>setCompany(e.target.value)} placeholder="Where do you work?" />

      <label style={labelStyle}>Your story</label>
      <textarea style={textareaStyle} value={story} onChange={e=>setStory(e.target.value)} placeholder="Share your journey in your own words — where you came from, what drove you, what you wish someone had told you..." />

      <label style={labelStyle}>How you got here</label>
      <textarea style={textareaStyle} value={journey} onChange={e=>setJourney(e.target.value)} placeholder="Walk through your career path step by step..." />

      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
        <input type="checkbox" checked={available} onChange={e=>setAvailable(e.target.checked)} id="avail" />
        <label htmlFor="avail" style={{fontSize:13,color:C.muted,fontFamily:'sans-serif'}}>I am currently available to take on new mentees</label>
      </div>

      <button
        style={{padding:'10px 20px',background:saved?'#1D9E75':C.gold,color:saved?'white':C.bg,border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'sans-serif'}}
        onClick={save}
        disabled={saving}
      >
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save profile'}
      </button>
    </div>
  )
}
