import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  C,
  useToasts,
  ToastStack,
  EmptyState,
  CohortCalendar,
  parseSessionDate,
  isStoryFeatured,
  storyQuoteText,
  FEATURED_PREFIX,
  StorySpotlight,
} from './ui';

export default function ChurchAdminDashboard(_props: { profile: any }) {
  const isMobile = useIsMobile();
  const { toasts, push } = useToasts();
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState('dashboard');
  const [members, setMembers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [newStory, setNewStory] = useState({ quote: '', outcome: '' });
  const [addingStory, setAddingStory] = useState(false);
  const [savingStory, setSavingStory] = useState(false);

  // Table controls.
  const [memberSearch, setMemberSearch] = useState('');
  const [memberSort, setMemberSort] = useState<{ key: string; dir: 1 | -1 }>({ key: 'full_name', dir: 1 });
  const [matchSearch, setMatchSearch] = useState('');
  const [matchSort, setMatchSort] = useState<{ key: string; dir: 1 | -1 }>({ key: 'status', dir: 1 });

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshAll() {
    setLoading(true);
    setLoadError('');
    await Promise.all([fetchMembers(), fetchMatches(), fetchStories(), fetchCohorts()]);
    setLoading(false);
  }

  async function fetchMembers() {
    const { data, error } = await supabase.from('users').select('*');
    if (error) { setLoadError(error.message); return; }
    setMembers(data || []);
  }

  async function fetchMatches() {
    const { data, error } = await supabase
      .from('matches')
      .select('*, users(*), mentors(*, users(*))');
    if (error) { setLoadError(error.message); return; }
    setMatches(data || []);
  }

  async function fetchStories() {
    const { data, error } = await supabase
      .from('success_stories')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { setLoadError(error.message); return; }
    setStories(data || []);
  }

  async function fetchCohorts() {
    const { data, error } = await supabase
      .from('cohorts')
      .select('*, cohort_members(*)');
    if (error) { setLoadError(error.message); return; }
    setCohorts(data || []);
  }

  async function approveStory(id: string) {
    const { error } = await supabase
      .from('success_stories')
      .update({ approved: true })
      .eq('id', id);
    if (error) { push(`Couldn't approve the story: ${error.message}`, 'error'); return; }
    push('Story approved and published!');
    fetchStories();
  }

  async function addStory() {
    if (savingStory) return;
    if (!newStory.quote.trim() || !newStory.outcome.trim()) {
      push('Please fill in both the outcome and the quote.', 'error');
      return;
    }
    setSavingStory(true);
    const { error } = await supabase
      .from('success_stories')
      .insert({
        quote: newStory.quote.trim(),
        outcome: newStory.outcome.trim(),
        approved: true,
      });
    setSavingStory(false);
    if (error) { push(`Couldn't save the story: ${error.message}`, 'error'); return; }
    setNewStory({ quote: '', outcome: '' });
    setAddingStory(false);
    push('Success story added! 🎉');
    fetchStories();
  }

  // Featuring is tracked as a star prefix in the existing `quote` column (the
  // schema has no featured column and can't be changed). Only one story is
  // featured at a time; featuring a new one un-features the previous.
  async function toggleFeatured(story: any) {
    if (isStoryFeatured(story)) {
      const { error } = await supabase
        .from('success_stories')
        .update({ quote: storyQuoteText(story) })
        .eq('id', story.id);
      if (error) { push(`Couldn't update the spotlight: ${error.message}`, 'error'); return; }
      push('Story removed from the spotlight.');
    } else {
      for (const other of stories.filter((s) => s.id !== story.id && isStoryFeatured(s))) {
        const { error } = await supabase
          .from('success_stories')
          .update({ quote: storyQuoteText(other) })
          .eq('id', other.id);
        if (error) { push(`Couldn't update the spotlight: ${error.message}`, 'error'); return; }
      }
      const { error } = await supabase
        .from('success_stories')
        .update({ quote: FEATURED_PREFIX + storyQuoteText(story) })
        .eq('id', story.id);
      if (error) { push(`Couldn't feature the story: ${error.message}`, 'error'); return; }
      push('Story featured! It now shows on student and mentor dashboards. ✨');
    }
    fetchStories();
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
    ph: { marginBottom: 20 },
    pt: { fontSize: 20, fontWeight: 600, color: C.white, letterSpacing: '-0.2px' },
    ps: { fontSize: 13, color: C.muted, marginTop: 4 },
    sectionLabel: {
      fontSize: 11,
      fontWeight: 600,
      color: C.hint,
      textTransform: 'uppercase' as any,
      letterSpacing: 1,
      margin: '4px 0 8px',
    },
    statGrid: (cols: number) => ({
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr 1fr' : `repeat(${cols},1fr)`,
      gap: 12,
      marginBottom: 18,
    }),
    statCard: {
      background: 'rgba(212,160,23,0.08)',
      border: '1px solid rgba(212,160,23,0.15)',
      borderRadius: 12,
      padding: 14,
    },
    sl: { fontSize: 11, fontWeight: 500, color: C.muted, textTransform: 'uppercase' as any, letterSpacing: 0.6 },
    sv: { fontSize: 24, fontWeight: 600, color: C.gold, marginTop: 4 },
    card: {
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
    },
    cardTitle: { fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 4 },
    cardSub: { fontSize: 11.5, color: C.hint, marginBottom: 12 },
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
    input: {
      width: '100%',
      padding: '11px 12px',
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      fontSize: 13,
      marginBottom: 12,
      boxSizing: 'border-box' as any,
      background: '#1E0A5C',
      color: C.white,
      fontFamily: 'sans-serif',
      outline: 'none',
    },
    textarea: {
      width: '100%',
      padding: '11px 12px',
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      fontSize: 13,
      marginBottom: 12,
      boxSizing: 'border-box' as any,
      background: '#1E0A5C',
      color: C.white,
      fontFamily: 'sans-serif',
      outline: 'none',
      minHeight: 80,
      resize: 'vertical' as any,
    },
    searchInput: {
      width: '100%',
      maxWidth: 320,
      padding: '9px 13px',
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      fontSize: 13,
      marginBottom: 12,
      boxSizing: 'border-box' as any,
      background: 'rgba(255,255,255,0.05)',
      color: C.white,
      fontFamily: 'sans-serif',
      outline: 'none',
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
    nudgeCard: {
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: '14px 16px',
      marginBottom: 10,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    },
    tableWrap: {
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      overflowX: 'auto' as any,
      boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
    },
    table: { width: '100%', borderCollapse: 'collapse' as any, fontSize: 13, minWidth: 480 },
    th: {
      textAlign: 'left' as any,
      padding: '11px 14px',
      fontSize: 10.5,
      fontWeight: 700,
      color: C.hint,
      textTransform: 'uppercase' as any,
      letterSpacing: 0.8,
      borderBottom: `1px solid ${C.border}`,
      cursor: 'pointer',
      userSelect: 'none' as any,
      whiteSpace: 'nowrap' as any,
    },
    td: { padding: '11px 14px', color: C.muted, borderBottom: `1px solid ${C.border}`, verticalAlign: 'middle' as any },
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

  const roleColors: any = {
    student: ['rgba(55,138,221,0.2)', '#85B7EB'],
    mentor: ['rgba(212,160,23,0.2)', '#F0C040'],
    church_admin: ['rgba(93,202,165,0.2)', '#5DCAA5'],
  };

  const statusPill = (status: string) => (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        padding: '3px 8px',
        borderRadius: 20,
        whiteSpace: 'nowrap',
        background:
          status === 'active' || status === 'complete'
            ? C.greenBg
            : status === 'declined'
            ? C.redBg
            : 'rgba(212,160,23,0.2)',
        color:
          status === 'active' || status === 'complete'
            ? C.green
            : status === 'declined'
            ? C.red
            : C.goldLight,
      }}
    >
      {status}
    </span>
  );

  // ---- Derived stats ----
  const byRole = (role: string) => members.filter((u) => u.role === role).length;
  const byStatus = (status: string) => matches.filter((m) => m.status === status).length;

  // ---- Sorting / searching ----
  const memberValue = (m: any, key: string) => (m[key] || '').toString().toLowerCase();
  const filteredMembers = members
    .filter((m) => {
      const q = memberSearch.trim().toLowerCase();
      if (!q) return true;
      return `${m.full_name || ''} ${m.email || ''} ${m.role || ''}`.toLowerCase().includes(q);
    })
    .sort((a, b) => memberValue(a, memberSort.key).localeCompare(memberValue(b, memberSort.key)) * memberSort.dir);

  const matchValue = (m: any, key: string) => {
    if (key === 'student') return (m.users?.full_name || '').toLowerCase();
    if (key === 'mentor') return (m.mentors?.users?.full_name || '').toLowerCase();
    if (key === 'field') return (m.mentors?.field || '').toLowerCase();
    if (key === 'matched_at') return m.matched_at || '';
    return (m.status || '').toLowerCase();
  };
  const filteredMatches = matches
    .filter((m) => {
      const q = matchSearch.trim().toLowerCase();
      if (!q) return true;
      return `${m.users?.full_name || ''} ${m.mentors?.users?.full_name || ''} ${m.mentors?.field || ''} ${m.status || ''}`
        .toLowerCase()
        .includes(q);
    })
    .sort((a, b) => matchValue(a, matchSort.key).localeCompare(matchValue(b, matchSort.key)) * matchSort.dir);

  const sortHeader = (
    label: string,
    key: string,
    sort: { key: string; dir: 1 | -1 },
    setSort: (v: { key: string; dir: 1 | -1 }) => void
  ) => (
    <th
      style={s.th}
      onClick={() => setSort({ key, dir: sort.key === key ? ((sort.dir * -1) as 1 | -1) : 1 })}
    >
      {label}
      <span style={{ marginLeft: 5, color: sort.key === key ? C.gold : 'rgba(255,255,255,0.2)' }}>
        {sort.key === key ? (sort.dir === 1 ? '▲' : '▼') : '↕'}
      </span>
    </th>
  );

  const featuredStory = stories.find(isStoryFeatured);
  const calendarEvents = cohorts
    .map((c) => ({ date: parseSessionDate(c.next_session), title: c.title as string }))
    .filter((e): e is { date: Date; title: string } => e.date !== null);

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
              <span className="cc-chip" style={s.pill}>Church admin</span>
            </div>
            <div style={s.nav}>
              <div style={s.navSection}>Overview</div>
              {[
                ['dashboard', 'Dashboard'],
                ['members', 'Members'],
                ['matches', 'All matches'],
                ['stories', 'Success stories'],
                ['nudges', 'Check-in nudges'],
              ].map(([key, label]) => (
                <div
                  key={key}
                  className="cc-nav"
                  style={s.navItem(page === key)}
                  onClick={() => { setPage(key); setMenuOpen(false); }}
                >
                  {label}
                </div>
              ))}
            </div>
            <div style={s.signOut}>
              <button style={s.signOutBtn} onClick={() => supabase.auth.signOut()}>
                Sign out
              </button>
            </div>
          </>
        )}
      </div>

      <div style={s.main} className="cc-fade" key={page}>
        {loadError && (
          <div style={s.errorBanner}>
            <span>Something didn't load right: {loadError}</span>
            <button style={{ ...s.btn(false), color: '#ff9d9d', borderColor: 'rgba(255,100,100,0.4)' }} onClick={refreshAll}>
              Retry
            </button>
          </div>
        )}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '80px 0' }}>
            <div className="cc-spinner"></div>
            <div style={{ fontSize: 13, color: C.muted }}>Loading your community...</div>
          </div>
        ) : (
          <>
            {page === 'dashboard' && (
              <>
                <div style={s.ph}>
                  <div style={s.pt}>Dashboard</div>
                  <div style={s.ps}>Hartford Memorial Baptist Church · Detroit, MI</div>
                </div>

                <div style={s.sectionLabel}>Members by role</div>
                <div style={s.statGrid(3)}>
                  <div style={s.statCard}><div style={s.sl}>Students</div><div style={s.sv}>{byRole('student')}</div></div>
                  <div style={s.statCard}><div style={s.sl}>Mentors</div><div style={s.sv}>{byRole('mentor')}</div></div>
                  <div style={s.statCard}><div style={s.sl}>Church admins</div><div style={s.sv}>{byRole('church_admin')}</div></div>
                </div>

                <div style={s.sectionLabel}>Matches by status</div>
                <div style={s.statGrid(4)}>
                  <div style={s.statCard}><div style={s.sl}>Pending</div><div style={s.sv}>{byStatus('pending')}</div></div>
                  <div style={s.statCard}><div style={s.sl}>Active</div><div style={s.sv}>{byStatus('active')}</div></div>
                  <div style={s.statCard}><div style={s.sl}>Complete</div><div style={s.sv}>{byStatus('complete')}</div></div>
                  <div style={s.statCard}><div style={s.sl}>Declined</div><div style={s.sv}>{byStatus('declined')}</div></div>
                </div>

                <div style={s.sectionLabel}>Programs</div>
                <div style={s.statGrid(3)}>
                  <div style={s.statCard}><div style={s.sl}>Active cohorts</div><div style={s.sv}>{cohorts.length}</div></div>
                  <div style={s.statCard}><div style={s.sl}>Cohort seats filled</div><div style={s.sv}>{cohorts.reduce((n, c) => n + (c.cohort_members?.length || 0), 0)}</div></div>
                  <div style={s.statCard}><div style={s.sl}>Success stories</div><div style={s.sv}>{stories.length}</div></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap: 12 }}>
                  <div style={s.card}>
                    <div style={s.cardTitle}>Matches confirmed over time</div>
                    <div style={s.cardSub}>By the month a mentor accepted, last 6 months</div>
                    <MatchesOverTimeChart matches={matches} />
                  </div>
                  <div style={s.card}>
                    <div style={s.cardTitle}>Most-requested fields</div>
                    <div style={s.cardSub}>Across all match requests</div>
                    <TopFieldsList matches={matches} />
                  </div>
                </div>

                {calendarEvents.length > 0 && (
                  <>
                    <div style={{ ...s.sectionLabel, marginTop: 14 }}>Upcoming cohort sessions</div>
                    <CohortCalendar events={calendarEvents} />
                  </>
                )}

                <div style={s.card}>
                  <div style={{ ...s.cardTitle, marginBottom: 12 }}>Recent matches</div>
                  {matches.length === 0 && (
                    <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                      No matches yet — they will show up here as students and mentors connect.
                    </div>
                  )}
                  {matches.slice(0, 5).map((m) => (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 0',
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      <span style={{ fontSize: 13, color: C.white }}>
                        {m.users?.full_name || 'Unknown student'} → {m.mentors?.users?.full_name || 'Unknown mentor'}
                      </span>
                      {statusPill(m.status)}
                    </div>
                  ))}
                </div>
              </>
            )}

            {page === 'members' && (
              <>
                <div style={s.ph}>
                  <div style={s.pt}>Members</div>
                  <div style={s.ps}>Everyone in your church circle</div>
                </div>
                {members.length === 0 ? (
                  <EmptyState
                    icon="🏠"
                    title="No members yet"
                    hint="Students and mentors will appear here as they join the Circle."
                  />
                ) : (
                  <>
                    <input
                      className="cc-input"
                      style={s.searchInput}
                      placeholder="Search members by name, email or role..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                    />
                    <div style={s.tableWrap}>
                      <table style={s.table}>
                        <thead>
                          <tr>
                            {sortHeader('Name', 'full_name', memberSort, setMemberSort)}
                            {sortHeader('Email', 'email', memberSort, setMemberSort)}
                            {sortHeader('Role', 'role', memberSort, setMemberSort)}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMembers.map((m) => {
                            const [bg, fg] = roleColors[m.role] || ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.6)'];
                            return (
                              <tr key={m.id}>
                                <td style={{ ...s.td, color: C.white }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                                    <span
                                      style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 10,
                                        fontWeight: 600,
                                        background: bg,
                                        color: fg,
                                        flexShrink: 0,
                                      }}
                                    >
                                      {m.avatar_initials || '??'}
                                    </span>
                                    {m.full_name || '—'}
                                  </span>
                                </td>
                                <td style={s.td}>{m.email || '—'}</td>
                                <td style={s.td}>
                                  <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 20, background: bg, color: fg, whiteSpace: 'nowrap' }}>
                                    {m.role}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                          {filteredMembers.length === 0 && (
                            <tr>
                              <td style={{ ...s.td, borderBottom: 'none' }} colSpan={3}>
                                No members match "{memberSearch}".
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}

            {page === 'matches' && (
              <>
                <div style={s.ph}>
                  <div style={s.pt}>All matches</div>
                  <div style={s.ps}>Every mentor-student pair at your church</div>
                </div>
                {matches.length === 0 ? (
                  <EmptyState
                    icon="🤝"
                    title="No matches yet"
                    hint="Mentor-student pairs will appear here once requests are accepted."
                  />
                ) : (
                  <>
                    <input
                      className="cc-input"
                      style={s.searchInput}
                      placeholder="Search by student, mentor, field or status..."
                      value={matchSearch}
                      onChange={(e) => setMatchSearch(e.target.value)}
                    />
                    <div style={s.tableWrap}>
                      <table style={s.table}>
                        <thead>
                          <tr>
                            {sortHeader('Student', 'student', matchSort, setMatchSort)}
                            {sortHeader('Mentor', 'mentor', matchSort, setMatchSort)}
                            {sortHeader('Field', 'field', matchSort, setMatchSort)}
                            {sortHeader('Status', 'status', matchSort, setMatchSort)}
                            {sortHeader('Matched', 'matched_at', matchSort, setMatchSort)}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMatches.map((m) => (
                            <tr key={m.id}>
                              <td style={{ ...s.td, color: C.white }}>{m.users?.full_name || '—'}</td>
                              <td style={{ ...s.td, color: C.white }}>{m.mentors?.users?.full_name || '—'}</td>
                              <td style={s.td}>{m.mentors?.field || '—'}</td>
                              <td style={s.td}>{statusPill(m.status)}</td>
                              <td style={s.td}>
                                {m.matched_at ? new Date(m.matched_at).toLocaleDateString() : '—'}
                              </td>
                            </tr>
                          ))}
                          {filteredMatches.length === 0 && (
                            <tr>
                              <td style={{ ...s.td, borderBottom: 'none' }} colSpan={5}>
                                No matches match "{matchSearch}".
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}

            {page === 'stories' && (
              <>
                <div style={s.ph}>
                  <div style={s.pt}>Success stories</div>
                  <div style={s.ps}>Wins from your church community</div>
                </div>
                {featuredStory && <StorySpotlight story={featuredStory} />}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                  <button style={s.btn(true)} onClick={() => setAddingStory(!addingStory)}>
                    + Add story
                  </button>
                </div>
                {addingStory && (
                  <div style={s.card}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 12 }}>
                      New success story
                    </div>
                    <input
                      className="cc-input"
                      style={s.input}
                      placeholder="Outcome (e.g. Accepted to U of M Medical School)"
                      value={newStory.outcome}
                      onChange={(e) => setNewStory({ ...newStory, outcome: e.target.value })}
                    />
                    <textarea
                      className="cc-input"
                      style={s.textarea}
                      placeholder="Student quote about their experience..."
                      value={newStory.quote}
                      onChange={(e) => setNewStory({ ...newStory, quote: e.target.value })}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={s.btn(true)} onClick={addStory} disabled={savingStory}>
                        {savingStory ? 'Saving...' : 'Save story'}
                      </button>
                      <button style={s.btn(false)} onClick={() => setAddingStory(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {stories.length === 0 && (
                  <EmptyState
                    icon="🌟"
                    title="No stories yet"
                    hint="Add your first success story to celebrate a win from your community — they inspire the next generation of students."
                  />
                )}
                {stories.map((story) => {
                  const featured = isStoryFeatured(story);
                  return (
                    <div
                      key={story.id}
                      className="cc-card"
                      style={{
                        ...s.card,
                        border: featured ? '1px solid rgba(212,160,23,0.5)' : s.card.border,
                      }}
                    >
                      {featured && (
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: C.goldLight, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                          ⭐ Featured on dashboards
                        </div>
                      )}
                      <div style={s.quote}>{storyQuoteText(story)}</div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: 8,
                          gap: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: C.green,
                            background: C.greenBg,
                            padding: '3px 8px',
                            borderRadius: 20,
                          }}
                        >
                          {story.outcome}
                        </span>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {!story.approved ? (
                            <button style={s.btn(true)} onClick={() => approveStory(story.id)}>
                              Approve
                            </button>
                          ) : (
                            <>
                              <span style={{ fontSize: 11, color: C.hint }}>Published</span>
                              <button style={s.btn(false)} onClick={() => toggleFeatured(story)}>
                                {featured ? 'Remove from spotlight' : '☆ Feature'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {page === 'nudges' && (
              <>
                <div style={s.ph}>
                  <div style={s.pt}>Check-in nudges</div>
                  <div style={s.ps}>Automated emails at the 2-week and 6-week mark after a match</div>
                </div>
                <div style={s.card}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 10 }}>
                    How it works
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                    <div style={{ background: 'rgba(212,160,23,0.08)', borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: C.gold }}>Week 2 nudge</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                        Reminds both parties to connect and resends contact info.
                      </div>
                    </div>
                    <div style={{ background: 'rgba(212,160,23,0.08)', borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: C.gold }}>Week 6 nudge</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                        Celebrates progress and invites students to share their story.
                      </div>
                    </div>
                  </div>
                </div>
                {matches
                  .filter((m) => m.status === 'active')
                  .map((m) => (
                    <div key={m.id} className="cc-card" style={s.nudgeCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: C.white }}>
                          {m.users?.full_name || 'Unknown student'} → {m.mentors?.users?.full_name || 'Unknown mentor'}
                        </div>
                        {statusPill('active')}
                      </div>
                      <div style={{ fontSize: 11, color: C.hint }}>
                        Matched{' '}
                        {m.matched_at ? new Date(m.matched_at).toLocaleDateString() : 'recently'}{' '}
                        · Nudges send automatically at week 2 and week 6
                      </div>
                    </div>
                  ))}
                {matches.filter((m) => m.status === 'active').length === 0 && (
                  <EmptyState
                    icon="💌"
                    title="No active matches yet"
                    hint="Nudges will appear here once students are matched with mentors."
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
      <ToastStack toasts={toasts} />
    </div>
  );
}

/* ---- Matches-over-time bar chart (inline SVG, no libraries) ---- */

function MatchesOverTimeChart({ matches }: { matches: any[] }) {
  const [hover, setHover] = useState(-1);

  // Last six months, oldest first.
  const now = new Date();
  const months: { y: number; m: number; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      y: d.getFullYear(),
      m: d.getMonth(),
      label: d.toLocaleString('en-US', { month: 'short' }),
    });
  }
  const counts = months.map(({ y, m }) =>
    matches.filter((match) => {
      if (!match.matched_at) return false;
      const d = new Date(match.matched_at);
      return !isNaN(d.getTime()) && d.getFullYear() === y && d.getMonth() === m;
    }).length
  );

  const total = counts.reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...counts);
  const maxIdx = counts.indexOf(Math.max(...counts));

  const W = 520;
  const H = 190;
  const padL = 26;
  const padR = 8;
  const padT = 14;
  const padB = 24;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const slot = plotW / months.length;
  const barW = Math.min(24, slot * 0.45);
  const yFor = (v: number) => padT + plotH - (v / max) * plotH;

  // Clean integer gridline ticks.
  const step = Math.max(1, Math.ceil(max / 3));
  const ticks: number[] = [];
  for (let v = step; v <= max; v += step) ticks.push(v);

  // Bar path: 4px rounded data-end, square at the baseline.
  const barPath = (x: number, v: number) => {
    const h = ((v / max) * plotH);
    const r = Math.min(4, h);
    const top = padT + plotH - h;
    const bottom = padT + plotH;
    return `M ${x} ${bottom}
            L ${x} ${top + r}
            Q ${x} ${top} ${x + r} ${top}
            L ${x + barW - r} ${top}
            Q ${x + barW} ${top} ${x + barW} ${top + r}
            L ${x + barW} ${bottom} Z`;
  };

  if (total === 0) {
    return (
      <div style={{ fontSize: 12.5, color: C.hint, lineHeight: 1.6, padding: '18px 0' }}>
        No confirmed matches in the last six months — the chart will fill in as mentors accept requests.
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label={`Bar chart of matches confirmed per month over the last six months. Total ${total}.`}
    >
      {/* Recessive hairline gridlines with integer ticks. */}
      {ticks.map((v) => (
        <g key={v}>
          <line x1={padL} y1={yFor(v)} x2={W - padR} y2={yFor(v)} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <text x={padL - 6} y={yFor(v) + 3} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.35)" fontFamily="sans-serif">
            {v}
          </text>
        </g>
      ))}
      {/* Baseline. */}
      <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="rgba(255,255,255,0.16)" strokeWidth="1" />

      {months.map(({ label }, i) => {
        const x = padL + i * slot + (slot - barW) / 2;
        const v = counts[i];
        const isHover = hover === i;
        return (
          <g key={label + i}>
            {v > 0 && (
              <path d={barPath(x, v)} fill={isHover ? '#F0C040' : '#D4A017'}>
                <title>{`${label}: ${v} match${v !== 1 ? 'es' : ''} confirmed`}</title>
              </path>
            )}
            {/* Selective direct labels: the peak and the current month only. */}
            {v > 0 && (i === maxIdx || i === months.length - 1 || isHover) && (
              <text
                x={x + barW / 2}
                y={yFor(v) - 5}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="rgba(255,255,255,0.75)"
                fontFamily="sans-serif"
              >
                {v}
              </text>
            )}
            {/* Month label. */}
            <text
              x={padL + i * slot + slot / 2}
              y={H - 8}
              textAnchor="middle"
              fontSize="9.5"
              fill={isHover ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)'}
              fontFamily="sans-serif"
            >
              {label}
            </text>
            {/* Full-slot hover target, larger than the mark itself. */}
            <rect
              x={padL + i * slot}
              y={padT}
              width={slot}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(-1)}
            >
              <title>{`${label}: ${v} match${v !== 1 ? 'es' : ''} confirmed`}</title>
            </rect>
          </g>
        );
      })}
    </svg>
  );
}

/* ---- Most-requested fields ranked bar list (divs only) ---- */

function TopFieldsList({ matches }: { matches: any[] }) {
  const counts: Record<string, number> = {};
  matches.forEach((m) => {
    const field = m.mentors?.field || m.goal_field || 'Other';
    counts[field] = (counts[field] || 0) + 1;
  });
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = Math.max(1, ...ranked.map(([, n]) => n));

  if (ranked.length === 0) {
    return (
      <div style={{ fontSize: 12.5, color: C.hint, lineHeight: 1.6, padding: '18px 0' }}>
        No requests yet — the most sought-after fields will rank here.
      </div>
    );
  }

  return (
    <div>
      {ranked.map(([field, count], i) => (
        <div key={field} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.85)', fontWeight: i === 0 ? 600 : 400 }}>
              <span style={{ color: C.hint, marginRight: 8, fontSize: 11 }}>{i + 1}</span>
              {field}
            </span>
            <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{count}</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${(count / max) * 100}%`,
                height: '100%',
                borderRadius: 4,
                background: i === 0 ? 'linear-gradient(90deg,#D4A017,#F0C040)' : 'rgba(212,160,23,0.55)',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
