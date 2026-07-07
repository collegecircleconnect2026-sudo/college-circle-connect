import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useIsMobile } from '../hooks/useIsMobile';
import type { Match } from '../types';
import {
  C,
  useToasts,
  ToastStack,
  EmptyState,
  Onboarding,
  shouldShowOnboarding,
  markOnboarded,
  MatchStepper,
  NotificationBell,
  CompletenessMeter,
  CohortCalendar,
  parseSessionDate,
  isStoryFeatured,
  StorySpotlight,
} from './ui';

const FIELDS = ['Technology', 'Healthcare', 'Finance', 'Law', 'Education', 'Marketing'];

export default function StudentDashboard({ profile }: { profile: any }) {
  const isMobile = useIsMobile();
  const { toasts, push } = useToasts();
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState('browse');
  const [mentors, setMentors] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [joinedCohorts, setJoinedCohorts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  // The editable copy of the signed-in student's users row (the `profile`
  // prop goes stale once they save changes on the profile page).
  const [me, setMe] = useState<any>(profile);
  const [showOnboarding, setShowOnboarding] = useState(() => shouldShowOnboarding(profile.id));

  // Browse filters.
  const [filter, setFilter] = useState('all');
  const [availFilter, setAvailFilter] = useState<'available' | 'all'>('available');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Which match statuses this student has already seen, for the bell badge.
  const seenKey = `ccc-match-status-seen-${profile.id}`;
  const [seenMap, setSeenMap] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(window.localStorage.getItem(seenKey) || '{}');
    } catch {
      return {};
    }
  });

  // Goals questionnaire shown before a mentor request is created.
  const [goalMentor, setGoalMentor] = useState<any>(null);
  const [goalField, setGoalField] = useState('');
  const [goalHelp, setGoalHelp] = useState('');
  const [goalType, setGoalType] = useState('');
  const [goalStage, setGoalStage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshAll() {
    setLoading(true);
    setLoadError('');
    await Promise.all([fetchMentors(), fetchCohorts(), fetchMatches(), fetchJoinedCohorts(), fetchStories()]);
    setLoading(false);
  }

  async function fetchMentors() {
    const { data, error } = await supabase.from('mentors').select('*, users(*)');
    if (error) { setLoadError(error.message); return; }
    setMentors(data || []);
  }

  async function fetchCohorts() {
    const { data, error } = await supabase
      .from('cohorts')
      .select('*, mentors(*, users(*)), cohort_members(*)');
    if (error) { setLoadError(error.message); return; }
    setCohorts(data || []);
  }

  async function fetchMatches() {
    const { data, error } = await supabase
      .from('matches')
      .select('*, mentors(*, users(*))')
      .eq('student_id', profile.id);
    if (error) { setLoadError(error.message); return; }
    setMatches(data || []);
  }

  async function fetchJoinedCohorts() {
    const { data, error } = await supabase
      .from('cohort_members')
      .select('*, cohorts(*, mentors(*, users(*)))')
      .eq('student_id', profile.id);
    if (error) { setLoadError(error.message); return; }
    setJoinedCohorts(data || []);
  }

  async function fetchStories() {
    // The spotlight is a nice-to-have; a failure here (e.g. RLS) shouldn't
    // block the whole dashboard, so it is logged instead of fatal.
    const { data, error } = await supabase
      .from('success_stories')
      .select('*')
      .eq('approved', true);
    if (error) { console.warn('Could not load success stories:', error.message); return; }
    setStories(data || []);
  }

  // Bell badge: matches whose status moved past "pending" since last seen.
  const notifCount = matches.filter(
    (m) => m.status !== 'pending' && seenMap[m.id] !== m.status
  ).length;

  useEffect(() => {
    if (page !== 'my-requests' || matches.length === 0) return;
    const map: Record<string, string> = {};
    matches.forEach((m) => { map[m.id] = m.status; });
    setSeenMap(map);
    try { window.localStorage.setItem(seenKey, JSON.stringify(map)); } catch { /* private mode */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, matches]);

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
    const { error } = await supabase
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
    if (error) {
      push(`Couldn't send your request: ${error.message}`, 'error');
      return;
    }
    closeGoalForm();
    setSelectedMentor(null);
    push('Request sent! 🙌');
    fetchMatches();
    setPage('my-requests');
  }

  async function joinCohort(cohortId: string) {
    const { error } = await supabase
      .from('cohort_members')
      .insert({ cohort_id: cohortId, student_id: profile.id });
    if (error) {
      push(`Couldn't join the cohort: ${error.message}`, 'error');
      return;
    }
    push('You joined the cohort! 🎉');
    fetchCohorts();
    fetchJoinedCohorts();
  }

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
      borderRight: isMobile ? 'none' : `1px solid ${C.border}`,
      borderBottom: isMobile ? `1px solid ${C.border}` : 'none',
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
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      color: C.gold,
      fontSize: 13,
      fontWeight: 600,
      padding: '6px 12px',
      cursor: 'pointer',
    },
    logo: { padding: '16px 18px', borderBottom: `1px solid ${C.border}` },
    logoTitle: { fontSize: 13, fontWeight: 600, color: C.gold, letterSpacing: 0.2 },
    logoSub: { fontSize: 11, color: C.muted, marginTop: 2 },
    pill: {
      margin: '10px 18px 0',
      padding: '5px 10px',
      background: 'rgba(212,160,23,0.15)',
      borderRadius: 20,
      fontSize: 11,
      color: C.gold,
      fontWeight: 600,
      letterSpacing: 0.3,
      display: 'inline-block',
    },
    nav: { padding: '10px 0', flex: 1 },
    navSection: {
      padding: '6px 18px 4px',
      fontSize: 10,
      fontWeight: 600,
      color: C.hint,
      textTransform: 'uppercase' as any,
      letterSpacing: 1,
      marginTop: 6,
    },
    navItem: (active: boolean) => ({
      padding: '8px 18px',
      fontSize: 13,
      color: active ? C.gold : C.muted,
      cursor: 'pointer',
      borderLeft: active ? `2px solid ${C.gold}` : '2px solid transparent',
      background: active ? 'rgba(212,160,23,0.1)' : 'transparent',
      fontWeight: active ? 600 : 400,
    }),
    signOut: { padding: '12px 18px', borderTop: `1px solid ${C.border}` },
    signOutBtn: {
      width: '100%',
      padding: '8px',
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 12,
      cursor: 'pointer',
      background: 'transparent',
      color: C.muted,
    },
    main: { flex: 1, overflowY: 'auto' as any, padding: isMobile ? 20 : 28 },
    ph: {
      marginBottom: 20,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    pt: { fontSize: 20, fontWeight: 600, color: C.white, letterSpacing: '-0.2px' },
    ps: { fontSize: 13, color: C.muted, marginTop: 4 },
    filterBar: {
      display: 'flex',
      gap: 8,
      marginBottom: 12,
      flexWrap: 'wrap' as any,
    },
    chip: (active: boolean) => ({
      padding: '6px 12px',
      border: `1px solid ${active ? C.gold : C.border}`,
      borderRadius: 20,
      fontSize: 12,
      fontWeight: active ? 600 : 400,
      cursor: 'pointer',
      color: active ? C.bg : C.muted,
      background: active ? C.gold : 'transparent',
    }),
    searchInput: {
      flex: '1 1 200px',
      padding: '9px 13px',
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      fontSize: 13,
      background: 'rgba(255,255,255,0.05)',
      color: C.white,
      fontFamily: 'sans-serif',
      outline: 'none',
      boxSizing: 'border-box' as any,
    },
    select: {
      padding: '9px 12px',
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      fontSize: 12,
      background: C.card,
      color: C.muted,
      fontFamily: 'sans-serif',
      outline: 'none',
      cursor: 'pointer',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
      gap: 12,
    },
    card: {
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: 16,
      cursor: 'pointer',
      boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
      position: 'relative' as any,
    },
    av: (bg: string, fg: string, size?: number) => ({
      width: size || 42,
      height: size || 42,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 13,
      fontWeight: 600,
      background: bg,
      color: fg,
      marginBottom: 10,
    }),
    tag: (bg: string, fg: string) => ({
      display: 'inline-block',
      padding: '3px 9px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: 0.2,
      background: bg,
      color: fg,
    }),
    greatMatch: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 9px',
      borderRadius: 20,
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: 0.3,
      background: 'rgba(212,160,23,0.18)',
      color: C.goldLight,
      border: '1px solid rgba(212,160,23,0.45)',
    },
    reqRow: {
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: '12px 16px',
      marginBottom: 10,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    },
    btn: (primary: boolean) => ({
      padding: '8px 16px',
      background: primary ? C.gold : 'transparent',
      color: primary ? C.bg : 'rgba(255,255,255,0.75)',
      border: primary ? 'none' : `1px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 12,
      cursor: 'pointer',
      fontWeight: primary ? 700 : 500,
    }),
    profileBox: {
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: 24,
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
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
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: 18,
      marginBottom: 12,
      boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
    },
    errorBanner: {
      background: 'rgba(255,100,100,0.1)',
      border: '1px solid rgba(255,100,100,0.3)',
      borderRadius: 12,
      padding: '12px 16px',
      marginBottom: 16,
      fontSize: 13,
      color: '#ff9d9d',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap' as any,
      lineHeight: 1.5,
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
  // A mentor is "requested" while a match is pending/active/complete. Declined
  // matches no longer block, so a student can request again after a decline.
  const activeRequestFor = (mentorId: string) =>
    matches.find((m) => m.mentor_id === mentorId && m.status !== 'declined');
  const wasDeclinedBy = (mentorId: string) =>
    matches.some((m) => m.mentor_id === mentorId && m.status === 'declined');
  const hasJoinedCohort = (cohortId: string) =>
    joinedCohorts.some((j) => j.cohort_id === cohortId);

  // "Why this mentor" hint: the student's field of interest lines up with the
  // mentor's field.
  const myField = (me.field_of_interest || '').trim().toLowerCase();
  const isGreatMatch = (m: any) => {
    const f = (m.field || '').trim().toLowerCase();
    return !!myField && !!f && (f === myField || f.includes(myField) || myField.includes(f));
  };

  const companies = Array.from(
    new Set(mentors.map((m) => m.company).filter((c: any) => c && c !== 'Not set'))
  ).sort() as string[];

  const q = search.trim().toLowerCase();
  const filteredMentors = mentors.filter((m) => {
    if (filter !== 'all' && m.field !== filter) return false;
    if (availFilter === 'available' && !m.is_available) return false;
    if (companyFilter !== 'all' && m.company !== companyFilter) return false;
    if (q) {
      const hay = `${m.users?.full_name || ''} ${m.field || ''} ${m.company || ''} ${m.personal_story || ''} ${m.career_journey || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const filtersActive = filter !== 'all' || availFilter !== 'available' || companyFilter !== 'all' || q !== '';

  const featuredStory = stories.find(isStoryFeatured);
  const calendarEvents = cohorts
    .map((c) => ({ date: parseSessionDate(c.next_session), title: c.title as string }))
    .filter((e): e is { date: Date; title: string } => e.date !== null);

  const bell = (
    <NotificationBell
      count={notifCount}
      label={notifCount > 0 ? `${notifCount} request update${notifCount !== 1 ? 's' : ''}` : 'No new updates'}
      onClick={() => { setPage('my-requests'); setSelectedMentor(null); setMenuOpen(false); }}
    />
  );

  const header = (title: string, sub: string) => (
    <div style={s.ph}>
      <div>
        <div style={s.pt}>{title}</div>
        <div style={s.ps}>{sub}</div>
      </div>
      {bell}
    </div>
  );

  const errorBanner = loadError && (
    <div style={s.errorBanner}>
      <span>Something didn't load right: {loadError}</span>
      <button style={{ ...s.btn(false), color: '#ff9d9d', borderColor: 'rgba(255,100,100,0.4)' }} onClick={refreshAll}>
        Retry
      </button>
    </div>
  );

  const sidebar = (
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
              style={s.navItem(page === 'browse' && !selectedMentor)}
              onClick={() => { setPage('browse'); setSelectedMentor(null); setMenuOpen(false); }}
            >
              Browse mentors
            </div>
            <div
              className="cc-nav"
              style={s.navItem(page === 'cohorts' && !selectedMentor)}
              onClick={() => { setPage('cohorts'); setSelectedMentor(null); setMenuOpen(false); }}
            >
              Group cohorts
            </div>
            <div style={s.navSection}>Me</div>
            <div
              className="cc-nav"
              style={s.navItem(page === 'my-requests' && !selectedMentor)}
              onClick={() => { setPage('my-requests'); setSelectedMentor(null); setMenuOpen(false); }}
            >
              My requests
              {notifCount > 0 && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 10,
                    fontWeight: 800,
                    background: C.goldLight,
                    color: C.bg,
                    borderRadius: 10,
                    padding: '1px 6px',
                  }}
                >
                  {notifCount}
                </span>
              )}
            </div>
            <div
              className="cc-nav"
              style={s.navItem(page === 'profile' && !selectedMentor)}
              onClick={() => { setPage('profile'); setSelectedMentor(null); setMenuOpen(false); }}
            >
              My profile
            </div>
          </div>
          <div style={s.signOut}>
            <button style={s.signOutBtn} onClick={() => supabase.auth.signOut()}>
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );

  const goalFormModal = goalMentor && (
    <GoalForm
      mentor={goalMentor}
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
  );

  if (selectedMentor) {
    const [bg, fg] = getColor(selectedMentor.field);
    const alreadyRequested = !!activeRequestFor(selectedMentor.id);
    const declined = wasDeclinedBy(selectedMentor.id);
    const canRequest = !alreadyRequested && selectedMentor.is_available;
    return (
      <div style={s.app}>
        {sidebar}
        <div style={s.main} className="cc-fade">
          <div className="cc-chip" style={s.backBtn} onClick={() => setSelectedMentor(null)}>
            ← Back to mentors
          </div>
          <div style={s.profileBox}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
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
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <span style={s.tag(bg, fg)}>{selectedMentor.field}</span>
                  {isGreatMatch(selectedMentor) && (
                    <span style={s.greatMatch}>✨ Great match for you</span>
                  )}
                  {!selectedMentor.is_available && (
                    <span style={s.tag('rgba(255,255,255,0.08)', C.hint)}>Not taking mentees right now</span>
                  )}
                </div>
              </div>
            </div>
            {selectedMentor.personal_story && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: C.hint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  Their story
                </div>
                <div style={s.quote}>{selectedMentor.personal_story}</div>
              </div>
            )}
            {selectedMentor.career_journey && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: C.hint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  How they got here
                </div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                  {selectedMentor.career_journey}
                </div>
              </div>
            )}
            <button
              className="cc-btn-gold"
              style={{
                ...s.btn(true),
                width: '100%',
                padding: 10,
                fontSize: 13,
                opacity: canRequest ? 1 : 0.5,
                cursor: canRequest ? 'pointer' : 'not-allowed',
              }}
              onClick={() => canRequest && openGoalForm(selectedMentor)}
              disabled={!canRequest}
            >
              {alreadyRequested
                ? 'Request sent'
                : !selectedMentor.is_available
                ? 'Currently unavailable'
                : declined
                ? 'Request again'
                : 'Request this mentor'}
            </button>
          </div>
        </div>
        {goalFormModal}
        <ToastStack toasts={toasts} />
      </div>
    );
  }

  return (
    <div style={s.app}>
      {sidebar}
      <div style={s.main} className="cc-fade" key={page}>
        {errorBanner}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '80px 0' }}>
            <div className="cc-spinner"></div>
            <div style={{ fontSize: 13, color: C.muted }}>Gathering your Circle...</div>
          </div>
        ) : (
          <>
            {page === 'browse' && (
              <>
                {header('Find a mentor', 'Read their story then request a match')}
                {featuredStory && <StorySpotlight story={featuredStory} />}
                <div style={s.filterBar}>
                  {['all', ...FIELDS].map((f) => (
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
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  <input
                    className="cc-input"
                    style={s.searchInput}
                    placeholder="Search by name, company or story..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <select
                    className="cc-input"
                    style={s.select}
                    value={availFilter}
                    onChange={(e) => setAvailFilter(e.target.value as 'available' | 'all')}
                  >
                    <option value="available">Available now</option>
                    <option value="all">All mentors</option>
                  </select>
                  <select
                    className="cc-input"
                    style={s.select}
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                  >
                    <option value="all">All companies</option>
                    {companies.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div style={s.grid}>
                  {filteredMentors.map((m) => {
                    const [bg, fg] = getColor(m.field);
                    const requested = !!activeRequestFor(m.id);
                    return (
                      <div
                        key={m.id}
                        className="cc-card"
                        style={s.card}
                        onClick={() => setSelectedMentor(m)}
                      >
                        {isGreatMatch(m) && (
                          <span style={{ ...s.greatMatch, position: 'absolute', top: 12, right: 12 }}>
                            ✨ Great match
                          </span>
                        )}
                        <div style={s.av(bg, fg)}>
                          {m.users?.avatar_initials || '??'}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: C.white }}>
                          {m.users?.full_name}
                        </div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                          {m.field}
                        </div>
                        <div style={{ fontSize: 11, color: C.hint, marginTop: 1 }}>
                          {m.company}
                        </div>
                        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={s.tag(bg, fg)}>{m.field}</span>
                          <span style={{ fontSize: 11, color: requested ? C.green : m.is_available ? C.gold : C.hint }}>
                            {requested ? 'Requested' : m.is_available ? 'View story →' : 'Unavailable'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {filteredMentors.length === 0 && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <EmptyState
                        icon="🔍"
                        title={filtersActive ? 'No mentors match those filters' : 'No mentors in the Circle yet'}
                        hint={
                          filtersActive
                            ? "Try widening your search — the right mentor might be one filter away."
                            : 'New mentors join the Circle regularly. Check back soon!'
                        }
                        actionLabel={filtersActive ? 'Clear filters' : undefined}
                        onAction={
                          filtersActive
                            ? () => { setFilter('all'); setAvailFilter('all'); setCompanyFilter('all'); setSearch(''); }
                            : undefined
                        }
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {page === 'cohorts' && (
              <>
                {header('Group cohorts', 'Join a small group led by a mentor in your field')}
                {calendarEvents.length > 0 && <CohortCalendar events={calendarEvents} />}
                {cohorts.map((c) => {
                  const [bg, fg] = getColor(c.field);
                  const memberCount = c.cohort_members?.length || 0;
                  const spotsLeft = Math.max(0, (c.max_spots ?? 0) - memberCount);
                  const joined = hasJoinedCohort(c.id);
                  return (
                    <div key={c.id} className="cc-card" style={s.cohortCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: C.white }}>
                            {c.title}
                          </div>
                          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                            Led by {c.mentors?.users?.full_name || 'a Circle mentor'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 12, color: C.muted }}>
                            {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                          </div>
                          <span style={{ ...s.tag(bg, fg), marginTop: 4, display: 'inline-block' }}>
                            {c.field}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, lineHeight: 1.5 }}>
                        {c.description}
                      </div>
                      {c.next_session && (
                        <div style={{ fontSize: 11, color: C.hint, marginBottom: 10 }}>
                          Next session: {c.next_session}
                        </div>
                      )}
                      <button
                        style={s.btn(!joined)}
                        onClick={() => !joined && spotsLeft > 0 && joinCohort(c.id)}
                        disabled={joined || spotsLeft === 0}
                      >
                        {joined ? 'Joined' : spotsLeft === 0 ? 'Full' : 'Join cohort'}
                      </button>
                    </div>
                  );
                })}
                {cohorts.length === 0 && (
                  <EmptyState
                    icon="🌱"
                    title="No cohorts planted yet"
                    hint="Group cohorts will appear here once mentors open them up — small groups are where the best conversations happen."
                  />
                )}
              </>
            )}

            {page === 'my-requests' && (
              <>
                {header('My requests', 'Track your mentor match requests')}
                {matches.length === 0 && (
                  <EmptyState
                    icon="📬"
                    title="Your mailbox is empty (for now)"
                    hint="Browse mentors, read their stories, and send your first match request — your future mentor is waiting."
                    actionLabel="Browse mentors"
                    onAction={() => setPage('browse')}
                  />
                )}
                {matches.map((m) => {
                  const [bg, fg] = getColor(m.mentors?.field);

                  if (m.status === 'active' || m.status === 'complete') {
                    const phone = m.mentors?.phone || m.mentors?.users?.phone;
                    return (
                      <div key={m.id} style={s.cohortCard}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                          <div style={{ ...s.av(bg, fg, 42), marginBottom: 0 }}>
                            {m.mentors?.users?.avatar_initials || '??'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 500, color: C.white }}>
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
                              background: C.greenBg,
                              color: C.green,
                            }}
                          >
                            {m.status === 'complete' ? 'Mentorship complete' : 'Match confirmed'}
                          </span>
                        </div>

                        <MatchStepper status={m.status} />

                        <div style={{ background: 'rgba(212,160,23,0.08)', borderRadius: 8, padding: 12, margin: '14px 0' }}>
                          <div style={{ fontSize: 11, fontWeight: 500, color: C.hint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                            Contact
                          </div>
                          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                            {m.mentors?.users?.email}
                            {phone && <><br />{phone}</>}
                          </div>
                        </div>

                        {m.status === 'active' && (
                          <>
                            <div style={{ fontSize: 11, fontWeight: 500, color: C.hint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                              Next steps
                            </div>
                            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
                              <div>1. Send your mentor an introductory message within 3 days.</div>
                              <div>2. Arrange your first meeting in a public place such as the church or a coffee shop.</div>
                              <div>3. Come prepared with 2-3 questions about their career path.</div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div key={m.id} className="cc-row" style={{ ...s.cohortCard, padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ ...s.av(bg, fg, 36), marginBottom: 0 }}>
                          {m.mentors?.users?.avatar_initials || '??'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: C.white }}>
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
                            background: m.status === 'declined' ? C.redBg : 'rgba(212,160,23,0.2)',
                            color: m.status === 'declined' ? C.red : C.goldLight,
                          }}
                        >
                          {m.status === 'declined' ? 'Declined' : 'Pending'}
                        </span>
                      </div>
                      {m.status === 'pending' && <MatchStepper status={m.status} />}
                      {m.status === 'declined' && (
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 10, lineHeight: 1.5 }}>
                          This mentor couldn't take you on right now — don't be discouraged, another mentor in the Circle would love to help.
                        </div>
                      )}
                    </div>
                  );
                })}
                {joinedCohorts.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.hint, textTransform: 'uppercase' as any, letterSpacing: 1, margin: '22px 0 10px' }}>
                      Cohorts joined
                    </div>
                    {joinedCohorts.map((j) => (
                      <div key={j.id} className="cc-row" style={s.reqRow}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: C.white }}>
                            {j.cohorts?.title}
                          </div>
                          <div style={{ fontSize: 12, color: C.muted }}>
                            Led by {j.cohorts?.mentors?.users?.full_name || 'a Circle mentor'}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            padding: '3px 8px',
                            borderRadius: 20,
                            background: C.greenBg,
                            color: C.green,
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

            {page === 'profile' && (
              <>
                {header('My profile', 'Help mentors get to know you')}
                <StudentProfileEditor
                  me={me}
                  onSaved={(updated: any) => { setMe(updated); push('Profile saved!'); }}
                  onError={(msg: string) => push(`Couldn't save your profile: ${msg}`, 'error')}
                />
              </>
            )}
          </>
        )}
      </div>
      {goalFormModal}
      {showOnboarding && (
        <Onboarding
          title="Find a mentor in three simple steps"
          subtitle="College Circle Connect pairs you with seasoned professionals from your church family."
          isMobile={isMobile}
          steps={[
            { icon: '🔎', title: 'Browse', text: 'Explore mentors from your church community and read their stories.' },
            { icon: '✉️', title: 'Request', text: 'Answer four quick questions about your goals and send a match request.' },
            { icon: '🤝', title: 'Connect', text: "When they accept, you'll get their contact info to set up your first meeting." },
          ]}
          onDismiss={() => { markOnboarded(profile.id); setShowOnboarding(false); }}
        />
      )}
      <ToastStack toasts={toasts} />
    </div>
  );
}

function StudentProfileEditor({
  me,
  onSaved,
  onError,
}: {
  me: any;
  onSaved: (updated: any) => void;
  onError: (msg: string) => void;
}) {
  const [fullName, setFullName] = useState(me.full_name || '');
  const [fieldOfInterest, setFieldOfInterest] = useState(me.field_of_interest || '');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) return;
    const name = fullName.trim();
    if (!name) {
      onError('your full name cannot be empty');
      return;
    }
    setSaving(true);
    const initials = name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
    const { error } = await supabase
      .from('users')
      .update({ full_name: name, field_of_interest: fieldOfInterest || null, avatar_initials: initials })
      .eq('id', me.id);
    setSaving(false);
    if (error) {
      onError(error.message);
      return;
    }
    onSaved({ ...me, full_name: name, field_of_interest: fieldOfInterest || null, avatar_initials: initials });
  }

  const inputStyle = {
    width: '100%',
    padding: '11px 12px',
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    fontSize: 13,
    marginBottom: 16,
    boxSizing: 'border-box' as any,
    background: '#1E0A5C',
    color: C.white,
    fontFamily: 'sans-serif',
    outline: 'none',
  };
  const labelStyle = {
    fontSize: 12,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
    display: 'block',
    fontFamily: 'sans-serif',
  };

  const meterItems = [
    { label: 'Email', done: !!me.email },
    { label: 'Full name', done: !!fullName.trim() },
    { label: 'Field of interest', done: !!fieldOfInterest },
  ];

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
      <CompletenessMeter items={meterItems} />

      <label style={labelStyle}>Full name</label>
      <input
        className="cc-input"
        style={inputStyle}
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Your full name"
      />

      <label style={labelStyle}>Field of interest</label>
      <select
        className="cc-input"
        style={{ ...inputStyle, cursor: 'pointer' }}
        value={fieldOfInterest}
        onChange={(e) => setFieldOfInterest(e.target.value)}
      >
        <option value="">Choose your field...</option>
        {FIELDS.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>
      <div style={{ fontSize: 11.5, color: C.hint, marginTop: -8, marginBottom: 16, lineHeight: 1.5 }}>
        Picking a field helps us highlight mentors who are a great match for you.
      </div>

      <label style={labelStyle}>Email</label>
      <input className="cc-input" style={{ ...inputStyle, opacity: 0.6 }} value={me.email || ''} disabled />

      <button
        className="cc-btn-gold"
        style={{
          padding: '10px 22px',
          background: C.gold,
          color: C.bg,
          border: 'none',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'sans-serif',
          letterSpacing: 0.2,
          opacity: saving ? 0.7 : 1,
        }}
        onClick={save}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save profile'}
      </button>
    </div>
  );
}

function GoalForm({
  mentor,
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
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 1000,
  };
  const modal: any = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 440,
    maxHeight: '90vh',
    overflowY: 'auto',
    fontFamily: 'sans-serif',
    boxSizing: 'border-box',
    boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
  };
  const label: any = {
    fontSize: 12,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
    display: 'block',
  };
  const input: any = {
    width: '100%',
    padding: '11px 12px',
    border: `1px solid ${C.border}`,
    borderRadius: 10,
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
    padding: '8px 13px',
    borderRadius: 8,
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: active ? 700 : 500,
    border: `1px solid ${active ? C.gold : C.border}`,
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
            className="cc-input"
            style={input}
            value={goalField}
            onChange={(e) => setGoalField(e.target.value)}
            placeholder="e.g. Software engineering, nursing, law..."
          />
        </div>

        <div style={field}>
          <label style={label}>What do you need help with?</label>
          <textarea
            className="cc-input"
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
                className="cc-chip"
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
                className="cc-chip"
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
              color: 'rgba(255,255,255,0.75)',
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'sans-serif',
            }}
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="cc-btn-gold"
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
