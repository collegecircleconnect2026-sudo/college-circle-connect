import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useIsMobile } from '../hooks/useIsMobile';

export default function ChurchAdminDashboard(_props: { profile: any }) {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState('dashboard');
  const [members, setMembers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [newStory, setNewStory] = useState({ quote: '', outcome: '' });
  const [addingStory, setAddingStory] = useState(false);
  const [stats, setStats] = useState({
    students: 0,
    mentors: 0,
    active: 0,
    stories: 0,
  });

  useEffect(() => {
    fetchMembers();
    fetchMatches();
    fetchStories();
  }, []);

  async function fetchMembers() {
    const { data } = await supabase.from('users').select('*');
    setMembers(data || []);
    const students = (data || []).filter((u) => u.role === 'student').length;
    const mentors = (data || []).filter((u) => u.role === 'mentor').length;
    setStats((prev) => ({ ...prev, students, mentors }));
  }

  async function fetchMatches() {
    const { data } = await supabase
      .from('matches')
      .select('*, users(*), mentors(*, users(*))');
    setMatches(data || []);
    const active = (data || []).filter((m) => m.status === 'active').length;
    setStats((prev) => ({ ...prev, active }));
  }

  async function fetchStories() {
    const { data } = await supabase
      .from('success_stories')
      .select('*')
      .order('created_at', { ascending: false });
    setStories(data || []);
    setStats((prev) => ({ ...prev, stories: (data || []).length }));
  }

  async function approveStory(id: string) {
    await supabase
      .from('success_stories')
      .update({ approved: true })
      .eq('id', id);
    fetchStories();
  }

  async function addStory() {
    await supabase
      .from('success_stories')
      .insert({
        quote: newStory.quote,
        outcome: newStory.outcome,
        approved: true,
      });
    setNewStory({ quote: '', outcome: '' });
    setAddingStory(false);
    fetchStories();
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
    statGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(4,1fr)',
      gap: 10,
      marginBottom: 18,
    },
    statCard: {
      background: 'rgba(212,160,23,0.08)',
      borderRadius: 8,
      padding: 12,
    },
    sl: { fontSize: 11, color: C.muted },
    sv: { fontSize: 20, fontWeight: 500, color: C.gold, marginTop: 3 },
    card: {
      background: C.card,
      border: `0.5px solid ${C.border}`,
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
    },
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
    av: (bg: string, fg: string) => ({
      width: 36,
      height: 36,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 11,
      fontWeight: 500,
      background: bg,
      color: fg,
      flexShrink: 0,
    }),
    btn: (primary: boolean) => ({
      padding: '6px 13px',
      background: primary ? C.gold : 'transparent',
      color: primary ? C.bg : C.muted,
      border: primary ? 'none' : `0.5px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 12,
      cursor: 'pointer',
      fontWeight: primary ? 700 : 400,
    }),
    input: {
      width: '100%',
      padding: '8px 10px',
      border: `0.5px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 13,
      marginBottom: 10,
      boxSizing: 'border-box' as any,
      background: '#1E0A5C',
      color: C.white,
    },
    textarea: {
      width: '100%',
      padding: '8px 10px',
      border: `0.5px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 13,
      marginBottom: 10,
      boxSizing: 'border-box' as any,
      background: '#1E0A5C',
      color: C.white,
      minHeight: 80,
      resize: 'vertical' as any,
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
      border: `0.5px solid ${C.border}`,
      borderRadius: 12,
      padding: '14px 16px',
      marginBottom: 8,
    },
  };

  const roleColors: any = {
    student: ['rgba(55,138,221,0.2)', '#85B7EB'],
    mentor: ['rgba(212,160,23,0.2)', '#F0C040'],
    church_admin: ['rgba(93,202,165,0.2)', '#5DCAA5'],
  };

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
              <span style={s.pill}>Church admin</span>
            </div>
            <div style={s.nav}>
              <div style={s.navSection}>Overview</div>
              <div
                style={s.navItem(page === 'dashboard')}
                onClick={() => {
                  setPage('dashboard');
                  setMenuOpen(false);
                }}
              >
                Dashboard
              </div>
              <div
                style={s.navItem(page === 'members')}
                onClick={() => {
                  setPage('members');
                  setMenuOpen(false);
                }}
              >
                Members
              </div>
              <div
                style={s.navItem(page === 'matches')}
                onClick={() => {
                  setPage('matches');
                  setMenuOpen(false);
                }}
              >
                All matches
              </div>
              <div
                style={s.navItem(page === 'stories')}
                onClick={() => {
                  setPage('stories');
                  setMenuOpen(false);
                }}
              >
                Success stories
              </div>
              <div
                style={s.navItem(page === 'nudges')}
                onClick={() => {
                  setPage('nudges');
                  setMenuOpen(false);
                }}
              >
                Check-in nudges
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

      <div style={s.main}>
        {page === 'dashboard' && (
          <>
            <div style={s.ph}>
              <div style={s.pt}>Dashboard</div>
              <div style={s.ps}>
                Hartford Memorial Baptist Church · Detroit, MI
              </div>
            </div>
            <div style={s.statGrid}>
              <div style={s.statCard}>
                <div style={s.sl}>Students</div>
                <div style={s.sv}>{stats.students}</div>
              </div>
              <div style={s.statCard}>
                <div style={s.sl}>Mentors</div>
                <div style={s.sv}>{stats.mentors}</div>
              </div>
              <div style={s.statCard}>
                <div style={s.sl}>Active matches</div>
                <div style={s.sv}>{stats.active}</div>
              </div>
              <div style={s.statCard}>
                <div style={s.sl}>Success stories</div>
                <div style={s.sv}>{stats.stories}</div>
              </div>
            </div>
            <div style={s.card}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: C.white,
                  marginBottom: 12,
                }}
              >
                Recent matches
              </div>
              {matches.length === 0 && (
                <div style={{ fontSize: 13, color: C.muted }}>
                  No matches yet.
                </div>
              )}
              {matches.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: `0.5px solid ${C.border}`,
                  }}
                >
                  <span style={{ fontSize: 13, color: C.white }}>
                    {m.users?.full_name} → {m.mentors?.users?.full_name}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      padding: '2px 8px',
                      borderRadius: 20,
                      background:
                        m.status === 'active'
                          ? 'rgba(93,202,165,0.2)'
                          : 'rgba(212,160,23,0.2)',
                      color: m.status === 'active' ? '#5DCAA5' : '#F0C040',
                    }}
                  >
                    {m.status}
                  </span>
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
            {members.length === 0 && (
              <div style={{ fontSize: 13, color: C.muted, marginTop: 20 }}>
                No members yet.
              </div>
            )}
            {members.map((m) => {
              const [bg, fg] = roleColors[m.role] || [
                'rgba(255,255,255,0.1)',
                'rgba(255,255,255,0.6)',
              ];
              return (
                <div key={m.id} style={s.reqRow}>
                  <div style={s.av(bg, fg)}>{m.avatar_initials || '??'}</div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontSize: 13, fontWeight: 500, color: C.white }}
                    >
                      {m.full_name}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted }}>
                      {m.email}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      padding: '3px 8px',
                      borderRadius: 20,
                      background: bg,
                      color: fg,
                    }}
                  >
                    {m.role}
                  </span>
                </div>
              );
            })}
          </>
        )}

        {page === 'matches' && (
          <>
            <div style={s.ph}>
              <div style={s.pt}>All matches</div>
              <div style={s.ps}>Every mentor-student pair at your church</div>
            </div>
            {matches.length === 0 && (
              <div style={{ fontSize: 13, color: C.muted, marginTop: 20 }}>
                No matches yet.
              </div>
            )}
            {matches.map((m) => (
              <div key={m.id} style={s.reqRow}>
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontSize: 13, fontWeight: 500, color: C.white }}
                  >
                    {m.users?.full_name} → {m.mentors?.users?.full_name}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    {m.mentors?.field}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    padding: '3px 8px',
                    borderRadius: 20,
                    background:
                      m.status === 'active'
                        ? 'rgba(93,202,165,0.2)'
                        : m.status === 'declined'
                        ? 'rgba(255,100,100,0.2)'
                        : 'rgba(212,160,23,0.2)',
                    color:
                      m.status === 'active'
                        ? '#5DCAA5'
                        : m.status === 'declined'
                        ? '#ff6b6b'
                        : '#F0C040',
                  }}
                >
                  {m.status}
                </span>
              </div>
            ))}
          </>
        )}

        {page === 'stories' && (
          <>
            <div style={s.ph}>
              <div style={s.pt}>Success stories</div>
              <div style={s.ps}>Wins from your church community</div>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: 12,
              }}
            >
              <button
                style={s.btn(true)}
                onClick={() => setAddingStory(!addingStory)}
              >
                + Add story
              </button>
            </div>
            {addingStory && (
              <div style={s.card}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: C.white,
                    marginBottom: 12,
                  }}
                >
                  New success story
                </div>
                <input
                  style={s.input}
                  placeholder="Outcome (e.g. Accepted to U of M Medical School)"
                  value={newStory.outcome}
                  onChange={(e) =>
                    setNewStory({ ...newStory, outcome: e.target.value })
                  }
                />
                <textarea
                  style={s.textarea}
                  placeholder="Student quote about their experience..."
                  value={newStory.quote}
                  onChange={(e) =>
                    setNewStory({ ...newStory, quote: e.target.value })
                  }
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={s.btn(true)} onClick={addStory}>
                    Save story
                  </button>
                  <button
                    style={s.btn(false)}
                    onClick={() => setAddingStory(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {stories.length === 0 && (
              <div style={{ fontSize: 13, color: C.muted, marginTop: 20 }}>
                No stories yet — add your first one!
              </div>
            )}
            {stories.map((story) => (
              <div key={story.id} style={s.card}>
                <div style={s.quote}>{story.quote}</div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: '#5DCAA5',
                      background: 'rgba(93,202,165,0.2)',
                      padding: '3px 8px',
                      borderRadius: 20,
                    }}
                  >
                    {story.outcome}
                  </span>
                  {!story.approved ? (
                    <button
                      style={s.btn(true)}
                      onClick={() => approveStory(story.id)}
                    >
                      Approve
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, color: C.hint }}>
                      Published
                    </span>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {page === 'nudges' && (
          <>
            <div style={s.ph}>
              <div style={s.pt}>Check-in nudges</div>
              <div style={s.ps}>
                Automated emails at the 2-week and 6-week mark after a match
              </div>
            </div>
            <div style={s.card}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: C.white,
                  marginBottom: 10,
                }}
              >
                How it works
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    background: 'rgba(212,160,23,0.08)',
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 500, color: C.gold }}>
                    Week 2 nudge
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                    Reminds both parties to connect and resends contact info.
                  </div>
                </div>
                <div
                  style={{
                    background: 'rgba(212,160,23,0.08)',
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 500, color: C.gold }}>
                    Week 6 nudge
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                    Celebrates progress and invites students to share their
                    story.
                  </div>
                </div>
              </div>
            </div>
            {matches
              .filter((m) => m.status === 'active')
              .map((m) => (
                <div key={m.id} style={s.nudgeCard}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{ fontSize: 13, fontWeight: 500, color: C.white }}
                    >
                      {m.users?.full_name} → {m.mentors?.users?.full_name}
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
                      Active
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: C.hint }}>
                    Matched{' '}
                    {m.matched_at
                      ? new Date(m.matched_at).toLocaleDateString()
                      : 'recently'}{' '}
                    · Nudges send automatically at week 2 and week 6
                  </div>
                </div>
              ))}
            {matches.filter((m) => m.status === 'active').length === 0 && (
              <div style={{ fontSize: 13, color: C.muted, marginTop: 20 }}>
                No active matches yet — nudges will appear here once students
                are matched.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
