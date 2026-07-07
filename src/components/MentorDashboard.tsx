import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useIsMobile } from '../hooks/useIsMobile'
import type { Match } from '../types'
import {
  C,
  useToasts,
  ToastStack,
  EmptyState,
  Onboarding,
  shouldShowOnboarding,
  markOnboarded,
  NotificationBell,
  CompletenessMeter,
  CohortCalendar,
  parseSessionDate,
  isStoryFeatured,
  StorySpotlight,
} from './ui'

export default function MentorDashboard({ profile }: { profile: any }) {
  const isMobile = useIsMobile()
  const { toasts, push } = useToasts()
  const [menuOpen, setMenuOpen] = useState(false)
  const [page, setPage] = useState('requests')
  const [mentorProfile, setMentorProfile] = useState<any>(null)
  const [profileLoadError, setProfileLoadError] = useState('')
  const [requests, setRequests] = useState<Match[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [cohorts, setCohorts] = useState<any[]>([])
  const [stories, setStories] = useState<any[]>([])
  const [showOnboarding, setShowOnboarding] = useState(() => shouldShowOnboarding(profile.id))

  useEffect(() => {
    fetchMentorProfile()
    fetchStories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchMentorProfile() {
    setProfileLoadError('')
    const { data, error } = await supabase.from('mentors').select('*').eq('user_id', profile.id).single()
    if (error) {
      setProfileLoadError(error.message)
      return
    }
    setMentorProfile(data)
    if (data) { fetchRequests(data.id); fetchMatches(data.id); fetchCohorts(data.id) }
  }

  async function fetchRequests(mentorId: string) {
    const { data, error } = await supabase.from('matches').select('*, users(*)').eq('mentor_id', mentorId).eq('status', 'pending')
    if (error) { push(`Couldn't load requests: ${error.message}`, 'error'); return }
    setRequests(data || [])
  }

  async function fetchMatches(mentorId: string) {
    const { data, error } = await supabase.from('matches').select('*, users(*)').eq('mentor_id', mentorId).eq('status', 'active')
    if (error) { push(`Couldn't load your mentees: ${error.message}`, 'error'); return }
    setMatches(data || [])
  }

  async function fetchCohorts(mentorId: string) {
    const { data, error } = await supabase.from('cohorts').select('*, cohort_members(*, users(*))').eq('mentor_id', mentorId)
    if (error) { push(`Couldn't load your cohorts: ${error.message}`, 'error'); return }
    setCohorts(data || [])
  }

  async function fetchStories() {
    // The spotlight is decorative — log failures rather than blocking the page.
    const { data, error } = await supabase.from('success_stories').select('*').eq('approved', true)
    if (error) { console.warn('Could not load success stories:', error.message); return }
    setStories(data || [])
  }

  async function handleRequest(matchId: string, action: 'active' | 'declined') {
    const { error } = await supabase.from('matches').update({
      status: action,
      matched_at: action === 'active' ? new Date().toISOString() : null
    }).eq('id', matchId)
    if (error) {
      push(`Couldn't update the request: ${error.message}`, 'error')
      return
    }
    push(action === 'active' ? 'Request accepted! The student can now see your contact info. 🎉' : 'Request declined.')
    if (mentorProfile) { fetchRequests(mentorProfile.id); fetchMatches(mentorProfile.id) }
  }

  const s: any = {
    app: {display:'flex',flexDirection:isMobile?'column':'row',height:isMobile?'auto':'100vh',minHeight:'100vh',fontFamily:'sans-serif',background:C.bg},
    sidebar: {width:isMobile?'100%':210,background:C.sidebar,borderRight:isMobile?'none':`1px solid ${C.border}`,borderBottom:isMobile?`1px solid ${C.border}`:'none',display:'flex',flexDirection:'column'},
    topBar: {display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 18px'},
    menuBtn: {background:'transparent',border:`1px solid ${C.border}`,borderRadius:8,color:C.gold,fontSize:13,fontWeight:600,padding:'6px 12px',cursor:'pointer'},
    logo: {padding:'16px 18px',borderBottom:`1px solid ${C.border}`},
    logoTitle: {fontSize:13,fontWeight:600,color:C.gold,letterSpacing:0.2},
    logoSub: {fontSize:11,color:C.muted,marginTop:2},
    pill: {margin:'10px 18px 0',padding:'5px 10px',background:'rgba(212,160,23,0.15)',borderRadius:20,fontSize:11,color:C.gold,fontWeight:600,letterSpacing:0.3,display:'inline-block'},
    nav: {padding:'10px 0',flex:1},
    navSection: {padding:'6px 18px 4px',fontSize:10,fontWeight:600,color:C.hint,textTransform:'uppercase' as any,letterSpacing:1,marginTop:6},
    navItem: (active:boolean) => ({padding:'8px 18px',fontSize:13,color:active?C.gold:C.muted,cursor:'pointer',borderLeft:active?`2px solid ${C.gold}`:'2px solid transparent',background:active?'rgba(212,160,23,0.1)':'transparent',fontWeight:active?600:400}),
    signOut: {padding:'12px 18px',borderTop:`1px solid ${C.border}`},
    signOutBtn: {width:'100%',padding:'8px',border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,cursor:'pointer',background:'transparent',color:C.muted},
    main: {flex:1,overflowY:'auto' as any,padding:isMobile?20:28},
    ph: {marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12},
    pt: {fontSize:20,fontWeight:600,color:C.white,letterSpacing:'-0.2px'},
    ps: {fontSize:13,color:C.muted,marginTop:4},
    reqRow: {background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:'12px 16px',marginBottom:10,display:'flex',alignItems:'center',gap:12,boxShadow:'0 2px 8px rgba(0,0,0,0.15)'},
    av: (bg:string,fg:string,size?:number) => ({width:size||36,height:size||36,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,background:bg,color:fg,flexShrink:0}),
    btn: (primary:boolean) => ({padding:'8px 16px',background:primary?C.gold:'transparent',color:primary?C.bg:'rgba(255,255,255,0.75)',border:primary?'none':`1px solid ${C.border}`,borderRadius:8,fontSize:12,cursor:'pointer',fontWeight:primary?700:500}),
    card: {background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:16,marginBottom:12,boxShadow:'0 2px 10px rgba(0,0,0,0.18)'},
    impactGrid: {display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:12,marginBottom:20},
    impactItem: {background:'rgba(212,160,23,0.08)',border:'1px solid rgba(212,160,23,0.15)',borderRadius:12,padding:16,textAlign:'center' as any},
    impactBig: {fontSize:30,fontWeight:600,color:C.gold},
    impactLabel: {fontSize:12,color:C.muted,marginTop:4},
    winDot: {width:8,height:8,borderRadius:'50%',background:C.gold,marginTop:5,flexShrink:0},
    errorBanner: {background:'rgba(255,100,100,0.1)',border:'1px solid rgba(255,100,100,0.3)',borderRadius:12,padding:'12px 16px',marginBottom:16,fontSize:13,color:'#ff9d9d',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap' as any,lineHeight:1.5},
    // Student goals summary card shown inside a request.
    goalsCard: {marginTop:14,background:'linear-gradient(135deg, rgba(212,160,23,0.1), rgba(212,160,23,0.03))',border:'1px solid rgba(212,160,23,0.25)',borderRadius:12,padding:14},
    goalsGrid: {display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:10,marginBottom:10},
    goalCell: {background:'rgba(30,10,92,0.35)',borderRadius:8,padding:'8px 10px'},
    goalCellLabel: {fontSize:10,fontWeight:700,color:C.gold,textTransform:'uppercase' as any,letterSpacing:0.8,marginBottom:3},
    goalCellValue: {fontSize:12.5,color:'rgba(255,255,255,0.85)',lineHeight:1.45},
  }

  const featuredStory = stories.find(isStoryFeatured)
  const calendarEvents = cohorts
    .map((c) => ({ date: parseSessionDate(c.next_session), title: c.title as string }))
    .filter((e): e is { date: Date; title: string } => e.date !== null)

  const bell = (
    <NotificationBell
      count={requests.length}
      label={requests.length > 0 ? `${requests.length} pending request${requests.length !== 1 ? 's' : ''}` : 'No pending requests'}
      onClick={() => { setPage('requests'); setMenuOpen(false) }}
    />
  )

  const header = (title: string, sub: string) => (
    <div style={s.ph}>
      <div>
        <div style={s.pt}>{title}</div>
        <div style={s.ps}>{sub}</div>
      </div>
      {bell}
    </div>
  )

  return (
    <div style={s.app}>
      <div style={s.sidebar}>
        {isMobile ? (
          <div style={s.topBar}>
            <div>
              <div style={s.logoTitle}>College Circle Connect</div>
              <div style={s.logoSub}>Hartford Memorial Baptist Church</div>
            </div>
            <button style={s.menuBtn} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? 'Close' : 'Menu'}</button>
          </div>
        ) : (
          <div style={s.logo}>
            <div style={s.logoTitle}>College Circle Connect</div>
            <div style={s.logoSub}>Hartford Memorial Baptist Church</div>
          </div>
        )}
        {(!isMobile || menuOpen) && (
          <>
            <div style={{padding:'8px 18px 0'}}><span className="cc-chip" style={s.pill}>Mentor portal</span></div>
            <div style={s.nav}>
              <div style={s.navSection}>Mentoring</div>
              <div className="cc-nav" style={s.navItem(page==='requests')} onClick={()=>{setPage('requests');setMenuOpen(false)}}>
                Incoming requests
                {requests.length > 0 && (
                  <span style={{marginLeft:8,fontSize:10,fontWeight:800,background:C.goldLight,color:C.bg,borderRadius:10,padding:'1px 6px'}}>
                    {requests.length}
                  </span>
                )}
              </div>
              <div className="cc-nav" style={s.navItem(page==='impact')} onClick={()=>{setPage('impact');setMenuOpen(false)}}>My impact</div>
              <div className="cc-nav" style={s.navItem(page==='cohorts')} onClick={()=>{setPage('cohorts');setMenuOpen(false)}}>My cohorts</div>
              <div style={s.navSection}>Account</div>
              <div className="cc-nav" style={s.navItem(page==='profile')} onClick={()=>{setPage('profile');setMenuOpen(false)}}>My profile</div>
            </div>
            <div style={s.signOut}>
              <button style={s.signOutBtn} onClick={() => supabase.auth.signOut()}>Sign out</button>
            </div>
          </>
        )}
      </div>

      <div style={s.main} className="cc-fade" key={page}>
        {profileLoadError && (
          <div style={s.errorBanner}>
            <span>We couldn't load your mentor profile: {profileLoadError}</span>
            <button style={{...s.btn(false),color:'#ff9d9d',borderColor:'rgba(255,100,100,0.4)'}} onClick={fetchMentorProfile}>Retry</button>
          </div>
        )}
        {page === 'requests' && (
          <>
            {header('Incoming requests', 'Students who want to connect with you')}
            {requests.length === 0 && (
              <EmptyState
                icon="🕊️"
                title="No pending requests right now"
                hint="When a student requests you as a mentor, it will show up here. In the meantime, make sure your story is up to date — it's what draws students in."
              />
            )}
            {requests.map(r => {
              const hasGoals = r.goal_field || r.goal_help || r.goal_type || r.goal_stage
              return (
              <div key={r.id} className="cc-row" style={s.card}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
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
                {hasGoals && (
                  <div style={s.goalsCard}>
                    <div style={{fontSize:11,fontWeight:700,color:C.gold,textTransform:'uppercase' as any,letterSpacing:1,marginBottom:10}}>
                      🎯 Their goals
                    </div>
                    <div style={s.goalsGrid}>
                      {r.goal_field && (
                        <div style={s.goalCell}>
                          <div style={s.goalCellLabel}>Field</div>
                          <div style={s.goalCellValue}>{r.goal_field}</div>
                        </div>
                      )}
                      {r.goal_type && (
                        <div style={s.goalCell}>
                          <div style={s.goalCellLabel}>Looking for</div>
                          <div style={s.goalCellValue}>{r.goal_type}</div>
                        </div>
                      )}
                      {r.goal_stage && (
                        <div style={s.goalCell}>
                          <div style={s.goalCellLabel}>Stage</div>
                          <div style={s.goalCellValue}>{r.goal_stage}</div>
                        </div>
                      )}
                    </div>
                    {r.goal_help && (
                      <div style={{...s.goalCell,marginBottom:0}}>
                        <div style={s.goalCellLabel}>What they need</div>
                        <div style={s.goalCellValue}>{r.goal_help}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )})}
            {matches.length > 0 && (
              <>
                <div style={{fontSize:11,fontWeight:600,color:C.hint,textTransform:'uppercase' as any,letterSpacing:1,margin:'22px 0 10px'}}>Active mentees</div>
                {matches.map(m => (
                  <div key={m.id} className="cc-row" style={s.reqRow}>
                    <div style={{...s.av(C.greenBg,C.green),marginBottom:0}}>{m.users?.avatar_initials || '??'}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:500,color:C.white}}>{m.users?.full_name}</div>
                      <div style={{fontSize:12,color:C.muted}}>{m.users?.email}</div>
                    </div>
                    <span style={{fontSize:11,fontWeight:500,padding:'3px 8px',borderRadius:20,background:C.greenBg,color:C.green}}>Active</span>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {page === 'impact' && (
          <>
            {header('My impact', 'The difference you are making at Hartford Memorial')}
            {featuredStory && <StorySpotlight story={featuredStory} />}
            <div style={s.impactGrid}>
              <div style={s.impactItem}><div style={s.impactBig}>{matches.length}</div><div style={s.impactLabel}>Active mentees</div></div>
              <div style={s.impactItem}><div style={s.impactBig}>{requests.length}</div><div style={s.impactLabel}>Pending requests</div></div>
              <div style={s.impactItem}><div style={s.impactBig}>{cohorts.length}</div><div style={s.impactLabel}>Cohorts led</div></div>
            </div>
            <div style={s.card}>
              <div style={{fontSize:13,fontWeight:600,color:C.white,marginBottom:12}}>Your active mentees</div>
              {matches.length === 0 && <div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>No active mentees yet — accept a request to get started.</div>}
              {matches.map(m => (
                <div key={m.id} style={{display:'flex',gap:8,alignItems:'flex-start',padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
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
            {header('My cohorts', 'Small groups you are leading')}
            {calendarEvents.length > 0 && <CohortCalendar events={calendarEvents} />}
            {cohorts.length === 0 && (
              <EmptyState
                icon="🌱"
                title="No cohorts yet"
                hint="Small groups you lead will appear here once they are set up. Ask your church admin about starting one."
              />
            )}
            {cohorts.map(c => (
              <div key={c.id} className="cc-card" style={s.card}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                  <div style={{fontSize:14,fontWeight:500,color:C.white}}>{c.title}</div>
                  <span style={{fontSize:11,fontWeight:500,padding:'3px 8px',borderRadius:20,background:C.greenBg,color:C.green}}>Active</span>
                </div>
                <div style={{fontSize:12,color:C.muted,marginBottom:8}}>{c.description}</div>
                <div style={{fontSize:11,color:C.hint,marginBottom:10}}>Next session: {c.next_session || 'TBD'}</div>
                <div style={{fontSize:12,color:C.muted}}>{c.cohort_members?.length || 0} of {c.max_spots ?? 0} spots filled</div>
              </div>
            ))}
          </>
        )}

        {page === 'profile' && (
          <>
            {header('My profile', 'This is what students see when they view your mentor card')}
            {mentorProfile && (
              <ProfileEditor
                mentorProfile={mentorProfile}
                onSave={fetchMentorProfile}
                push={push}
              />
            )}
            {!mentorProfile && !profileLoadError && (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12,padding:'40px 0'}}>
                <div className="cc-spinner"></div>
                <div style={{fontSize:13,color:C.muted}}>Loading your profile...</div>
              </div>
            )}
          </>
        )}
      </div>
      {showOnboarding && (
        <Onboarding
          title="Welcome, mentor — here's how it works"
          subtitle="Students browse mentor stories, send requests, and connect. Your story is the front door."
          isMobile={isMobile}
          steps={[
            { icon: '📖', title: 'Share your story', text: 'Fill in your profile — students choose mentors by reading how they got where they are.' },
            { icon: '📥', title: 'Review requests', text: 'Students send requests with their goals attached. Accept the ones you can pour into.' },
            { icon: '🤝', title: 'Connect', text: 'Once you accept, the student gets your contact info to arrange a first meeting.' },
          ]}
          onDismiss={() => { markOnboarded(profile.id); setShowOnboarding(false) }}
        />
      )}
      <ToastStack toasts={toasts} />
    </div>
  )
}

function ProfileEditor({ mentorProfile, onSave, push }: any) {
  const [field, setField] = useState(mentorProfile.field || '')
  const [company, setCompany] = useState(mentorProfile.company || '')
  const [story, setStory] = useState(mentorProfile.personal_story || '')
  const [journey, setJourney] = useState(mentorProfile.career_journey || '')
  const [available, setAvailable] = useState(!!mentorProfile.is_available)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (saving) return
    setSaving(true)
    const { error } = await supabase.from('mentors').update({
      field,
      company,
      personal_story: story,
      career_journey: journey,
      is_available: available
    }).eq('id', mentorProfile.id)
    setSaving(false)
    if (error) {
      push(`Couldn't save your profile: ${error.message}`, 'error')
      return
    }
    push('Profile saved!')
    onSave()
  }

  const inputStyle = {
    width:'100%',padding:'11px 12px',border:`1px solid ${C.border}`,
    borderRadius:10,fontSize:13,marginBottom:16,boxSizing:'border-box' as any,
    background:'#1E0A5C',color:C.white,fontFamily:'sans-serif',outline:'none'
  }
  const textareaStyle = {...inputStyle, minHeight:100, resize:'vertical' as any}
  const labelStyle = {fontSize:12,fontWeight:500,color:'rgba(255,255,255,0.7)',marginBottom:6,display:'block',fontFamily:'sans-serif'}

  // "Not set" is the signup placeholder, so it counts as unfilled.
  const meterItems = [
    { label: 'Field of work', done: !!field && field !== 'Not set' },
    { label: 'Company', done: !!company.trim() && company !== 'Not set' },
    { label: 'Your story', done: !!story.trim() },
    { label: 'Career journey', done: !!journey.trim() },
  ]

  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24,boxShadow:'0 4px 16px rgba(0,0,0,0.2)'}}>
      <CompletenessMeter items={meterItems} />

      <label style={labelStyle}>Field of work</label>
      <select className="cc-input" style={{...inputStyle,cursor:'pointer'}} value={field} onChange={e=>setField(e.target.value)}>
        {!['Technology','Healthcare','Finance','Law','Education','Marketing'].includes(field) && (
          <option value={field}>{field || 'Choose a field...'}</option>
        )}
        <option value="Technology">Technology</option>
        <option value="Healthcare">Healthcare</option>
        <option value="Finance">Finance</option>
        <option value="Law">Law</option>
        <option value="Education">Education</option>
        <option value="Marketing">Marketing</option>
      </select>

      <label style={labelStyle}>Company / Organization</label>
      <input className="cc-input" style={inputStyle} value={company} onChange={e=>setCompany(e.target.value)} placeholder="Where do you work?" />

      <label style={labelStyle}>Your story</label>
      <textarea className="cc-input" style={textareaStyle} value={story} onChange={e=>setStory(e.target.value)} placeholder="Share your journey in your own words — where you came from, what drove you, what you wish someone had told you..." />

      <label style={labelStyle}>How you got here</label>
      <textarea className="cc-input" style={textareaStyle} value={journey} onChange={e=>setJourney(e.target.value)} placeholder="Walk through your career path step by step..." />

      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
        <input type="checkbox" checked={available} onChange={e=>setAvailable(e.target.checked)} id="avail" />
        <label htmlFor="avail" style={{fontSize:13,color:C.muted,fontFamily:'sans-serif'}}>I am currently available to take on new mentees</label>
      </div>

      <button
        className="cc-btn-gold"
        style={{padding:'10px 22px',background:C.gold,color:C.bg,border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'sans-serif',letterSpacing:0.2,opacity:saving?0.7:1}}
        onClick={save}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save profile'}
      </button>
    </div>
  )
}
