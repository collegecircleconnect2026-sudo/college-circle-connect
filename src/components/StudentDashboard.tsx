import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useIsMobile } from '../hooks/useIsMobile';
import type { Match } from '../types';

export default function StudentDashboard({ profile }: { profile: any }) {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState('browse');
  const [mentors, setMentors] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [joinedCohorts, setJoinedCohorts] = useState<any[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  // Goals questionnaire shown before a mentor request is created.
  const [goalMentor, setGoalMentor] = useState<any>(null);
  const [goalField, setGoalField] = useState('');
  const [goalHelp, setGoalHelp] = useState('');
  const [goalType, setGoalType] = useState('');
  const [goalStage, setGoalStage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMentors();
    fetchCohorts();
    fetchMatches();
    fetchJoinedCohorts();
  }, []);

  async function fetchMentors() {
    const { data } = await supabase
      .from('mentors')
      .select('*, users(*)')
      .eq('is_available', true);
    setMentors(data || []);
  }

  async function fetchCohorts() {
    const { data } = await supabase
      .from('cohorts')
      .select('*, mentors(*, users(*)), cohort_members(*)');
    setCohorts(data || []);
  }

  async function fetchMatches() {
    const { data } = await supabase
      .from('matches')
      .select('*, mentors(*, users(*))')
      .eq('student_id', profile.id);
    setMatches(data || []);
  }

  async function fetchJoinedCohorts() {
    const { data } = await supabase
      .from('cohort_members')
      .select('*, cohorts(*, mentors(*, users(*)))')
      .eq('student_id', profile.id);
    setJoinedCohorts(data || []);
  }

  function openGoalForm(mentor: any) {
    setGoalMentor(mentor);
    setGoalField('');
    setGoalHelp('');
    setGoalType('');
    setGoalStage('');
  }

  function closeGoalForm() {
    setGoalMentor(null);
  }

  async function submitRequest() {
    if (!goalMentor || submitting) return;
    setSubmitting(true);
    await supabase
      .from('matches')
      .insert({
        student_id: profile.id,
        mentor_id: goalMentor.id,
        status: 'pending',
        goal_field: goalField.trim(),
        goal_help: goalHelp.trim(),
        goal_type: goalType,
        goal_stage: goalStage,
      });
    setSubmitting(false);
    closeGoalForm();
    fetchMatches();
    setSelectedMentor(null);
    setPage('my-requests');
  }

  async function joinCohort(cohortId: string) {
    await supabase
      .from('cohort_members')
      .insert({ cohort_id: cohortId, student_id: profile.id });
    fetchCohorts();
    fetchJoinedCohorts();
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
    hover: '#3D2A9E',
  };

  const s: any = {
    app: {
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      height: isMobile ? 'auto' : '100vh',
      minHeight: '100vh',
      fontFamily: 'sans-serif',
      background: C.bg,
    },
    sidebar: {
      width: isMobile ? '100%' : 210,
      background: C.sidebar,
      borderRight: isMobile ? 'none' : `0.5px solid ${C.border}`,
      borderBottom: isMobile ? `0.5px solid ${C.border}` : 'none',
      display: 'flex',
      flexDirection: 'column',
    },
    topBar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 18px',
    },
    menuBtn: {
      background: 'transparent',
      border: `0.5px solid ${C.border}`,
      borderRadius: 8,
      color: C.gold,
      fontSize: 13,
      padding: '6px 10px',
      cursor: 'pointer',
    },
    logo: { padding: '16px 18px', borderBottom: `0.5px solid ${C.border}` },
    logoTitle: { fontSize: 13, fontWeight: 500, color: C.gold },
    logoSub: { fontSize: 11, color: C.muted, marginTop: 2 },
    pill: {
      margin: '10px 18px 0',
      padding: '5px 10px',
      background: 'rgba(212,160,23,0.15)',
      borderRadius: 20,
      fontSize: 11,
      color: C.gold,
      fontWeight: 500,
      display: 'inline-block',
    },
    nav: { padding: '10px 0', flex: 1 },
    navSection: {
      padding: '6px 18px 4px',
      fontSize: 10,
      color: C.hint,
      textTransform: 'uppercase' as any,
      letterSpacing: 0.6,
      marginTop: 6,
    },
    navItem: (active: boolean) => ({
      padding: '7px 18px',
      fontSize: 13,
      color: active ? C.gold : C.muted,
      cursor: 'pointer',
      borderLeft: active ? `2px solid ${C.gold}` : '2px solid transparent',
      background: active ? 'rgba(212,160,23,0.1)' : 'transparent',
      fontWeight: active ? 500 : 400,
    }),
    signOut: { padding: '12px 18px', borderTop: `0.5px solid ${C.border}` },
    signOutBtn: {
      width: '100%',
      padding: '6px',
      border: `0.5px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 12,
      cursor: 'pointer',
      background: 'transparent',
      color: C.muted,
    },
    main: { flex: 1, overflowY: 'auto' as any, padding: 24 },
    ph: { marginBottom: 18 },
    pt: { fontSize: 17, fontWeight: 500, color: C.white },
    ps: { fontSize: 12, color: C.muted, marginTop: 3 },
    filterBar: {
      display: 'flex',
      gap: 6,
      marginBottom: 14,
      flexWrap: 'wrap' as any,
    },
    chip: (active: boolean) => ({
      padding: '5px 11px',
      border: `0.5px solid ${active ? C.gold : C.border}`,
      borderRadius: 20,
      fontSize: 12,
      cursor: 'pointer',
      color: active ? C.bg : C.muted,
      background: active ? C.gold : 'transparent',
    }),
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
      gap: 10,
    },
    card: {
      background: C.card,
      border: `0.5px solid ${C.border}`,
      borderRadius: 12,
      padding: 14,
      cursor: 'pointer',
    },
    av: (bg: string, fg: string, size?: number) => ({
      width: size || 42,
      height: size || 42,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 13,
      fontWeight: 500,
      background: bg,
      color: fg,
      marginBottom: 10,
    }),
    tag: (bg: string, fg: string) => ({
      display: 'inline-block',
      padding: '3px 8px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 500,
      background: bg,
      color: fg,
    }),
    reqRow: {
      background: C.card,
      border: `0.5px solid ${C.border}`,
      borderRadius: 12,
      padding: '12px 14px',
      marginBottom: 8,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    },
    btn: (primary: boolean) => ({
      padding: '7px 14px',
      background: primary ? C.gold : 'transparent',
      color: primary ? C.bg : C.muted,
      border: primary ? 'none' : `0.5px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 12,
      cursor: 'pointer',
      fontWeight: primary ? 700 : 400,
    }),
    profileBox: {
      background: C.card,
      border: `0.5px solid ${C.border}`,
      borderRadius: 12,
      padding: 20,
    },
    backBtn: {
      fontSize: 12,
      color: C.gold,
      cursor: 'pointer',
      marginBottom: 14,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
    },
    quote: {
      fontSize: 13,
      color: C.muted,
      lineHeight: 1.6,
      borderLeft: `2px solid ${C.gold}`,
      paddingLeft: 12,
      marginBottom: 10,
      borderRadius: 0,
    },
    cohortCard: {
      background: C.card,
      border: `0.5px solid ${C.border}`,
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
    },
  };

  const fieldColors: any = {
    Technology: ['rgba(212,160,23,0.15)', '#F0C040'],
    Healthcare: ['rgba(93,202,165,0.15)', '#5DCAA5'],
    Finance: ['rgba(55,138,221,0.15)', '#85B7EB'],
    Law: ['rgba(216,90,48,0.15)', '#F0997B'],
    Education: ['rgba(239,159,39,0.15)', '#FAC775'],
    Marketing: ['rgba(212,160,23,0.15)', '#F0C040'],
  };

  const getColor = (field: string) =>
    fieldColors[field] || ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.6)'];
  const hasPendingMatch = (mentorId: string) =>
    matches.some((m) => m.mentor_id === mentorId);
  const hasJoinedCohort = (cohortId: string) =>
    joinedCohorts.some((j) => j.cohort_id === cohortId);
  const filteredMentors =
    filter === 'all' ? mentors : mentors.filter((m) => m.field === filter);

  if (selectedMentor) {
    const [bg, fg] = getColor(selectedMentor.field);
    return (
      <div style={s.app}>
        <div style={s.sidebar}>
          <div style={s.logo}>
            <div style={s.logoTitle}>College Circle Connect</div>
            <div style={s.logoSub}>Hartford Memorial Baptist Church</div>
          </div>
          <div style={s.signOut}>
            <button
              style={s.signOutBtn}
              onClick={() => supabase.auth.signOut()}
            >
              Sign out
            </button>
          </div>
        </div>
        <div style={s.main} className="cc-fade">
          <div className="cc-chip" style={s.backBtn} onClick={() => setSelectedMentor(null)}>
            ← Back to mentors
          </div>
          <div style={s.profileBox}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginBottom: 16,
              }}
            >
              <div style={{ ...s.av(bg, fg, 54), marginBottom: 0 }}>
                {selectedMentor.users?.avatar_initials || '??'}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 500, color: C.white }}>
                  {selectedMentor.users?.full_name}
                </div>
                <div style={{ fontSize: 13, color: C.muted }}>
                  {selectedMentor.field} · {selectedMentor.company}
                </div>
                <span
                  style={{
                    ...s.tag(bg, fg),
                    marginTop: 4,
                    display: 'inline-block',
                  }}
                >
                  {selectedMentor.field}
                </span>
              </div>
            </div>
            {selectedMentor.personal_story && (
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: C.hint,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 8,
                  }}
                >
                  Their story
                </div>
                <div style={s.quote}>{selectedMentor.personal_story}</div>
              </div>
            )}
            {selectedMentor.career_journey && (
              <div style={{ marginBottom: 18 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: C.hint,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 8,
                  }}
                >
                  How they got here
                </div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                  {selectedMentor.career_journey}
                </div>
              </div>
            )}
            <button
              style={{
                ...s.btn(true),
                width: '100%',
                padding: 10,
                fontSize: 13,
                opacity: hasPendingMatch(selectedMentor.id) ? 0.5 : 1,
              }}
              onClick={() =>
                !hasPendingMatch(selectedMentor.id) &&
                openGoalForm(selectedMentor)
              }
              disabled={hasPendingMatch(selectedMentor.id)}
            >
              {hasPendingMatch(selectedMentor.id)
                ? 'Request sent'
                : 'Request this mentor'}
            </button>
          </div>
        </div>
        {goalMentor && (
          <GoalForm
            mentor={goalMentor}
            C={C}
            goalField={goalField}
            setGoalField={setGoalField}
            goalHelp={goalHelp}
            setGoalHelp={setGoalHelp}
            goalType={goalType}
            setGoalType={setGoalType}
            goalStage={goalStage}
            setGoalStage={setGoalStage}
            submitting={submitting}
            onCancel={closeGoalForm}
            onSubmit={submitRequest}
          />
        )}
      </div>
    );
  }

  return (
    <div style={s.app}>
      <div style={s.sidebar}>
        {isMobile ? (
          <div style={s.topBar}>
            <div>
              <div style={s.logoTitle}>College Circle Connect</div>
              <div style={s.logoSub}>Hartford Memorial Baptist Church</div>
            </div>
            <button style={s.menuBtn} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? 'Close' : 'Menu'}
            </button>
          </div>
        ) : (
          <div style={s.logo}>
            <div style={s.logoTitle}>College Circle Connect</div>
            <div style={s.logoSub}>Hartford Memorial Baptist Church</div>
          </div>
        )}
        {(!isMobile || menuOpen) && (
          <>
            <div style={{ padding: '8px 18px 0' }}>
              <span className="cc-chip" style={s.pill}>Student portal</span>
            </div>
            <div style={s.nav}>
              <div style={s.navSection}>Discover</div>
              <div
                className="cc-nav"
                style={s.navItem(page === 'browse')}
                onClick={() => {
                  setPage('browse');
                  setMenuOpen(false);
                }}
              >
                Browse mentors
              </div>
              <div
                className="cc-nav"
                style={s.navItem(page === 'cohorts')}
                onClick={() => {
                  setPage('cohorts');
                  setMenuOpen(false);
                }}
              >
                Group cohorts
              </div>
              <div style={s.navSection}>Me</div>
              <div
                className="cc-nav"
                style={s.navItem(page === 'my-requests')}
                onClick={() => {
                  setPage('my-requests');
                  setMenuOpen(false);
                }}
              >
                My requests
              </div>
            </div>
            <div style={s.signOut}>
              <button
                style={s.signOutBtn}
                onClick={() => supabase.auth.signOut()}
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
      <div style={s.main} className="cc-fade" key={page}>
        {page === 'browse' && (
          <>
            <div style={s.ph}>
              <div style={s.pt}>Find a mentor</div>
              <div style={s.ps}>Read their story then request a match</div>
            </div>
            <div style={s.filterBar}>
              {[
                'all',
                'Technology',
                'Healthcare',
                'Finance',
                'Law',
                'Education',
                'Marketing',
              ].map((f) => (
                <div
                  key={f}
                  className="cc-chip"
                  style={s.chip(filter === f)}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All fields' : f}
                </div>
              ))}
            </div>
            <div style={s.grid}>
              {filteredMentors.map((m) => {
                const [bg, fg] = getColor(m.field);
                return (
                  <div
                    key={m.id}
                    className="cc-card"
                    style={s.card}
                    onClick={() => setSelectedMentor(m)}
                  >
                    <div style={s.av(bg, fg)}>
                      {m.users?.avatar_initials || '??'}
                    </div>
                    <div
                      style={{ fontSize: 13, fontWeight: 500, color: C.white }}
                    >
                      {m.users?.full_name}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                      {m.field}
                    </div>
                    <div style={{ fontSize: 11, color: C.hint, marginTop: 1 }}>
                      {m.company}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={s.tag(bg, fg)}>{m.field}</span>
                      <span
                        style={{
                          fontSize: 11,
                          color: hasPendingMatch(m.id) ? '#5DCAA5' : C.gold,
                        }}
                      >
                        {hasPendingMatch(m.id) ? 'Requested' : 'View story →'}
                      </span>
                    </div>
                  </div>
                );
              })}
              {filteredMentors.length === 0 && (
                <div style={{ fontSize: 13, color: C.muted, marginTop: 20 }}>
                  No mentors in this field yet.
                </div>
              )}
            </div>
          </>
        )}

        {page === 'cohorts' && (
          <>
            <div style={s.ph}>
              <div style={s.pt}>Group cohorts</div>
              <div style={s.ps}>
                Join a small group led by a mentor in your field
              </div>
            </div>
            {cohorts.map((c) => {
              const [bg, fg] = getColor(c.field);
              const memberCount = c.cohort_members?.length || 0;
              const spotsLeft = c.max_spots - memberCount;
              const joined = hasJoinedCohort(c.id);
              return (
                <div key={c.id} className="cc-card" style={s.cohortCard}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: C.white,
                        }}
                      >
                        {c.title}
                      </div>
                      <div
                        style={{ fontSize: 12, color: C.muted, marginTop: 2 }}
                      >
                        Led by {c.mentors?.users?.full_name}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: C.muted }}>
                        {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                      </div>
                      <span
                        style={{
                          ...s.tag(bg, fg),
                          marginTop: 4,
                          display: 'inline-block',
                        }}
                      >
                        {c.field}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: C.muted,
                      marginBottom: 8,
                      lineHeight: 1.5,
                    }}
                  >
                    {c.description}
                  </div>
                  {c.next_session && (
                    <div
                      style={{ fontSize: 11, color: C.hint, marginBottom: 10 }}
                    >
                      Next session: {c.next_session}
                    </div>
                  )}
                  <button
                    style={s.btn(!joined)}
                    onClick={() => !joined && spotsLeft > 0 && joinCohort(c.id)}
                    disabled={joined || spotsLeft === 0}
                  >
                    {joined
                      ? 'Joined'
                      : spotsLeft === 0
                      ? 'Full'
                      : 'Join cohort'}
                  </button>
                </div>
              );
            })}
            {cohorts.length === 0 && (
              <div style={{ fontSize: 13, color: C.muted, marginTop: 20 }}>
                No cohorts available yet.
              </div>
            )}
          </>
        )}

        {page === 'my-requests' && (
          <>
            <div style={s.ph}>
              <div style={s.pt}>My requests</div>
              <div style={s.ps}>Track your mentor match requests</div>
            </div>
            {matches.length === 0 && (
              <div
                style={{
                  fontSize: 13,
                  color: C.muted,
                  marginTop: 20,
                  textAlign: 'center',
                }}
              >
                No requests yet — browse mentors to get started
              </div>
            )}
            {matches.map((m) => {
              const [bg, fg] = getColor(m.mentors?.field);

              if (m.status === 'active') {
                const phone = m.mentors?.phone || m.mentors?.users?.phone;
                return (
                  <div key={m.id} style={s.cohortCard}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 14,
                      }}
                    >
                      <div style={{ ...s.av(bg, fg, 42), marginBottom: 0 }}>
                        {m.mentors?.users?.avatar_initials || '??'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{ fontSize: 14, fontWeight: 500, color: C.white }}
                        >
                          {m.mentors?.users?.full_name}
                        </div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                          {m.mentors?.field} · {m.mentors?.company}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '3px 8px',
                          borderRadius: 20,
                          background: 'rgba(93,202,165,0.2)',
                          color: '#5DCAA5',
                        }}
                      >
                        Match confirmed
                      </span>
                    </div>

                    <div
                      style={{
                        background: 'rgba(212,160,23,0.08)',
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 14,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: C.hint,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          marginBottom: 6,
                        }}
                      >
                        Contact
                      </div>
                      <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                        {m.mentors?.users?.email}
                        {phone && <><br />{phone}</>}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: C.hint,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        marginBottom: 8,
                      }}
                    >
                      Next steps
                    </div>
                    <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
                      <div>1. Send your mentor an introductory message within 3 days.</div>
                      <div>2. Arrange your first meeting in a public place such as the church or a coffee shop.</div>
                      <div>3. Come prepared with 2-3 questions about their career path.</div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={m.id} className="cc-row" style={s.reqRow}>
                  <div style={{ ...s.av(bg, fg, 36), marginBottom: 0 }}>
                    {m.mentors?.users?.avatar_initials || '??'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontSize: 13, fontWeight: 500, color: C.white }}
                    >
                      {m.mentors?.users?.full_name}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted }}>
                      {m.mentors?.field} · {m.mentors?.company}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      padding: '3px 8px',
                      borderRadius: 20,
                      background:
                        m.status === 'declined'
                          ? 'rgba(255,100,100,0.2)'
                          : 'rgba(212,160,23,0.2)',
                      color: m.status === 'declined' ? '#ff6b6b' : '#F0C040',
                    }}
                  >
                    {m.status}
                  </span>
                </div>
              );
            })}
            {joinedCohorts.length > 0 && (
              <>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: C.white,
                    margin: '18px 0 10px',
                  }}
                >
                  Cohorts joined
                </div>
                {joinedCohorts.map((j) => (
                  <div key={j.id} className="cc-row" style={s.reqRow}>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: C.white,
                        }}
                      >
                        {j.cohorts?.title}
                      </div>
                      <div style={{ fontSize: 12, color: C.muted }}>
                        Led by {j.cohorts?.mentors?.users?.full_name}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        padding: '3px 8px',
                        borderRadius: 20,
                        background: 'rgba(93,202,165,0.2)',
                        color: '#5DCAA5',
                      }}
                    >
                      Joined
                    </span>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function GoalForm({
  mentor,
  C,
  goalField,
  setGoalField,
  goalHelp,
  setGoalHelp,
  goalType,
  setGoalType,
  goalStage,
  setGoalStage,
  submitting,
  onCancel,
  onSubmit,
}: any) {
  const canSubmit =
    goalField.trim() && goalHelp.trim() && goalType && goalStage && !submitting;

  const overlay: any = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(10,4,40,0.72)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 1000,
  };
  const modal: any = {
    background: C.card,
    border: `0.5px solid ${C.border}`,
    borderRadius: 14,
    padding: 22,
    width: '100%',
    maxWidth: 440,
    maxHeight: '90vh',
    overflowY: 'auto',
    fontFamily: 'sans-serif',
    boxSizing: 'border-box',
  };
  const label: any = {
    fontSize: 12,
    color: C.muted,
    marginBottom: 6,
    display: 'block',
  };
  const input: any = {
    width: '100%',
    padding: '10px 12px',
    border: `0.5px solid ${C.border}`,
    borderRadius: 8,
    fontSize: 13,
    boxSizing: 'border-box',
    background: '#1E0A5C',
    color: C.white,
    fontFamily: 'sans-serif',
    outline: 'none',
  };
  const textarea: any = { ...input, minHeight: 84, resize: 'vertical' };
  const field: any = { marginBottom: 16 };
  const optRow: any = { display: 'flex', gap: 8, flexWrap: 'wrap' };
  const opt = (active: boolean): any => ({
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: active ? 700 : 400,
    border: `0.5px solid ${active ? C.gold : C.border}`,
    background: active ? C.gold : 'transparent',
    color: active ? C.bg : C.muted,
  });

  return (
    <div style={overlay} onClick={onCancel}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 500, color: C.white }}>
          Before you request {mentor.users?.full_name}
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 4, marginBottom: 18 }}>
          A few quick questions so your mentor knows how to help.
        </div>

        <div style={field}>
          <label style={label}>What field are you interested in?</label>
          <input
            style={input}
            value={goalField}
            onChange={(e) => setGoalField(e.target.value)}
            placeholder="e.g. Software engineering, nursing, law..."
          />
        </div>

        <div style={field}>
          <label style={label}>What do you need help with?</label>
          <textarea
            style={textarea}
            value={goalHelp}
            onChange={(e) => setGoalHelp(e.target.value)}
            placeholder="Share what you're hoping to get out of this connection..."
          />
        </div>

        <div style={field}>
          <label style={label}>
            Are you looking for long-term mentorship or one-time advice?
          </label>
          <div style={optRow}>
            {['Long-term mentorship', 'One-time advice'].map((o) => (
              <div
                key={o}
                style={opt(goalType === o)}
                onClick={() => setGoalType(o)}
              >
                {o}
              </div>
            ))}
          </div>
        </div>

        <div style={field}>
          <label style={label}>What is your current stage?</label>
          <div style={optRow}>
            {['High school', 'College', 'Recent grad'].map((o) => (
              <div
                key={o}
                style={opt(goalStage === o)}
                onClick={() => setGoalStage(o)}
              >
                {o}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
          <button
            style={{
              flex: 1,
              padding: 10,
              background: 'transparent',
              color: C.muted,
              border: `0.5px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'sans-serif',
            }}
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            style={{
              flex: 2,
              padding: 10,
              background: C.gold,
              color: C.bg,
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              opacity: canSubmit ? 1 : 0.5,
              fontFamily: 'sans-serif',
            }}
            onClick={() => canSubmit && onSubmit()}
            disabled={!canSubmit}
          >
            {submitting ? 'Sending...' : 'Send request'}
          </button>
        </div>
      </div>
    </div>
  );
}
