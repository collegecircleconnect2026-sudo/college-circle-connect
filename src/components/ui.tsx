// Shared UI primitives for the three dashboards: theme colors, toasts,
// onboarding, empty states, the match progress stepper, notification bell,
// profile completeness meter, cohort calendar and success-story spotlight.
// Everything is styled inline against the app's purple-and-gold theme.
import { useState } from 'react';

export const C = {
  bg: '#1E0A5C',
  sidebar: '#2D1B7E',
  card: '#2D1B7E',
  border: '#3D2A9E',
  gold: '#D4A017',
  goldLight: '#F0C040',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.6)',
  hint: 'rgba(255,255,255,0.35)',
  green: '#5DCAA5',
  greenBg: 'rgba(93,202,165,0.2)',
  red: '#ff6b6b',
  redBg: 'rgba(255,100,100,0.2)',
};

/* ---------------- Toasts ---------------- */

export interface Toast {
  id: number;
  text: string;
  kind: 'success' | 'error';
}

let toastId = 0;

// Small toast queue. Each dashboard calls `push('Request sent!')` after an
// action and renders `<ToastStack toasts={toasts} />` once at its root.
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  function push(text: string, kind: Toast['kind'] = 'success') {
    const id = ++toastId;
    setToasts((t) => [...t, { id, text, kind }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4200);
  }
  return { toasts, push };
}

export function ToastStack({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        left: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8,
        zIndex: 3000,
        pointerEvents: 'none',
        fontFamily: 'sans-serif',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="cc-toast"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            maxWidth: 340,
            padding: '11px 16px',
            borderRadius: 12,
            background: t.kind === 'error' ? '#3A1250' : '#2D1B7E',
            border: `1px solid ${t.kind === 'error' ? 'rgba(255,100,100,0.5)' : 'rgba(212,160,23,0.5)'}`,
            boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
            color: 'white',
            fontSize: 13,
            lineHeight: 1.45,
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: 12,
              fontWeight: 700,
              background: t.kind === 'error' ? C.redBg : 'rgba(212,160,23,0.25)',
              color: t.kind === 'error' ? C.red : C.goldLight,
            }}
          >
            {t.kind === 'error' ? '!' : '✓'}
          </span>
          {t.text}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Empty states ---------------- */

export function EmptyState({
  icon,
  title,
  hint,
  actionLabel,
  onAction,
}: {
  icon: string;
  title: string;
  hint: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '44px 20px',
        border: `1px dashed ${C.border}`,
        borderRadius: 14,
        background: 'rgba(255,255,255,0.02)',
        marginTop: 8,
      }}
    >
      <div style={{ fontSize: 30, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.white, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6, maxWidth: 380, margin: '0 auto' }}>{hint}</div>
      {actionLabel && onAction && (
        <button
          className="cc-btn-gold"
          style={{
            marginTop: 16,
            padding: '9px 18px',
            background: C.gold,
            color: C.bg,
            border: 'none',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'sans-serif',
          }}
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/* ---------------- First-time onboarding ---------------- */

const onboardingKey = (userId: string) => `ccc-onboarded-v1-${userId}`;

export function shouldShowOnboarding(userId: string): boolean {
  try {
    return !window.localStorage.getItem(onboardingKey(userId));
  } catch {
    return false;
  }
}

export function markOnboarded(userId: string) {
  try {
    window.localStorage.setItem(onboardingKey(userId), '1');
  } catch {
    // localStorage unavailable (private mode) — the overlay just shows again next visit.
  }
}

export interface OnboardingStep {
  icon: string;
  title: string;
  text: string;
}

export function Onboarding({
  title,
  subtitle,
  steps,
  isMobile,
  onDismiss,
}: {
  title: string;
  subtitle: string;
  steps: OnboardingStep[];
  isMobile: boolean;
  onDismiss: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,4,40,0.82)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 2000,
        fontFamily: 'sans-serif',
        overflowY: 'auto',
      }}
    >
      <div
        className="cc-fade"
        style={{
          background: C.card,
          border: '1px solid rgba(212,160,23,0.35)',
          borderRadius: 20,
          padding: isMobile ? '28px 20px' : '36px 34px',
          width: '100%',
          maxWidth: 680,
          boxSizing: 'border-box',
          boxShadow: '0 24px 70px rgba(0,0,0,0.5), 0 0 60px rgba(212,160,23,0.08)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
          Welcome to the Circle
        </div>
        <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 600, color: C.white, marginBottom: 6, letterSpacing: '-0.3px' }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 26, lineHeight: 1.6 }}>{subtitle}</div>
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 12,
            alignItems: 'stretch',
            marginBottom: 26,
          }}
        >
          {steps.map((step, i) => (
            <div key={step.title} style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  flex: 1,
                  width: '100%',
                  background: 'rgba(212,160,23,0.07)',
                  border: '1px solid rgba(212,160,23,0.2)',
                  borderRadius: 14,
                  padding: '18px 14px',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 8 }}>{step.icon}</div>
                <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
                  STEP {i + 1}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.white, marginBottom: 6 }}>{step.title}</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55 }}>{step.text}</div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ color: C.gold, fontSize: 18, flexShrink: 0, transform: isMobile ? 'rotate(90deg)' : 'none' }}>→</div>
              )}
            </div>
          ))}
        </div>
        <button
          className="cc-btn-gold"
          style={{
            padding: '12px 30px',
            background: 'linear-gradient(135deg,#F0C040,#D4A017)',
            color: C.bg,
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'sans-serif',
            letterSpacing: 0.3,
          }}
          onClick={onDismiss}
        >
          Got it — let's go
        </button>
      </div>
    </div>
  );
}

/* ---------------- Match progress stepper ---------------- */

// Visual Requested → Accepted → Connected tracker driven by match status.
// pending = waiting on step 2, active = connected & exchanging contact info,
// complete = mentorship finished.
export function MatchStepper({ status }: { status: string }) {
  const steps = ['Requested', 'Accepted', 'Connected'];
  // Index of the last completed step.
  const reached = status === 'complete' ? 2 : status === 'active' ? 1 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', margin: '14px 0 4px' }}>
      {steps.map((label, i) => {
        const done = i <= reached;
        const isCurrent = i === reached + 1 || (done && i === 2);
        return (
          <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            {i > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 11,
                  right: '50%',
                  width: '100%',
                  height: 2,
                  background: i <= reached ? C.gold : C.border,
                  zIndex: 0,
                }}
              />
            )}
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                zIndex: 1,
                background: done ? C.gold : C.card,
                color: done ? C.bg : C.hint,
                border: `2px solid ${done ? C.gold : isCurrent ? 'rgba(212,160,23,0.5)' : C.border}`,
                boxSizing: 'border-box',
              }}
            >
              {done ? '✓' : i + 1}
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 10.5,
                fontWeight: done ? 700 : 500,
                color: done ? C.goldLight : C.hint,
                letterSpacing: 0.3,
                textAlign: 'center',
              }}
            >
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Notification bell ---------------- */

export function NotificationBell({
  count,
  label,
  onClick,
}: {
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      style={{
        position: 'relative',
        width: 38,
        height: 38,
        borderRadius: 10,
        border: `1px solid ${count > 0 ? 'rgba(212,160,23,0.55)' : C.border}`,
        background: count > 0 ? 'rgba(212,160,23,0.12)' : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={count > 0 ? C.goldLight : C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {count > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            minWidth: 17,
            height: 17,
            padding: '0 4px',
            borderRadius: 10,
            background: C.goldLight,
            color: C.bg,
            fontSize: 10,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
            fontFamily: 'sans-serif',
          }}
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}

/* ---------------- Profile completeness meter ---------------- */

export function CompletenessMeter({ items }: { items: { label: string; done: boolean }[] }) {
  const done = items.filter((i) => i.done).length;
  const pct = items.length === 0 ? 0 : Math.round((done / items.length) * 100);
  const nextItem = items.find((i) => !i.done);
  return (
    <div
      style={{
        background: 'rgba(212,160,23,0.07)',
        border: '1px solid rgba(212,160,23,0.2)',
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 18,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.white }}>Profile completeness</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: pct === 100 ? C.green : C.goldLight }}>{pct}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 6, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 6,
            background: pct === 100 ? C.green : 'linear-gradient(90deg,#D4A017,#F0C040)',
            transition: 'width 0.5s ease',
          }}
        />
      </div>
      <div style={{ fontSize: 11.5, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
        {pct === 100
          ? 'Your profile is complete — looking sharp! ✨'
          : `${done} of ${items.length} sections filled in. Next up: ${nextItem?.label.toLowerCase()}.`}
      </div>
    </div>
  );
}

/* ---------------- Cohort calendar ---------------- */

export interface CalendarEvent {
  date: Date;
  title: string;
}

// Turns a cohort's `next_session` value into a Date if it looks like one.
// Values like "Tuesdays at 7pm" simply aren't placed on the calendar.
export function parseSessionDate(value: any): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function CohortCalendar({ events }: { events: CalendarEvent[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  function shift(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsOn = (day: number) =>
    events.filter((e) => e.date.getFullYear() === year && e.date.getMonth() === month && e.date.getDate() === day);
  const monthEvents = events
    .filter((e) => e.date.getFullYear() === year && e.date.getMonth() === month)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const isToday = (day: number) =>
    now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;

  const navBtn = {
    width: 28,
    height: 28,
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    background: 'transparent',
    color: C.gold,
    fontSize: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as const;

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: 18,
        marginBottom: 16,
        boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>
          {MONTHS[month]} {year}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={navBtn} onClick={() => shift(-1)} aria-label="Previous month">‹</button>
          <button style={navBtn} onClick={() => shift(1)} aria-label="Next month">›</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {DOW.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: C.hint, padding: '2px 0', letterSpacing: 0.5 }}>
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const dayEvents = eventsOn(day);
          const has = dayEvents.length > 0;
          return (
            <div
              key={i}
              title={dayEvents.map((e) => e.title).join(', ')}
              style={{
                height: 38,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                borderRadius: 8,
                fontSize: 11.5,
                color: has ? C.goldLight : isToday(day) ? C.white : C.muted,
                fontWeight: has || isToday(day) ? 700 : 400,
                background: has ? 'rgba(212,160,23,0.14)' : 'transparent',
                border: isToday(day) ? `1px solid ${C.gold}` : '1px solid transparent',
                boxSizing: 'border-box',
              }}
            >
              {day}
              {has && <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.gold }} />}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
        {monthEvents.length === 0 ? (
          <div style={{ fontSize: 11.5, color: C.hint }}>No sessions scheduled this month.</div>
        ) : (
          monthEvents.map((e, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.gold, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: C.muted }}>
                <span style={{ color: C.goldLight, fontWeight: 600 }}>
                  {MONTHS[e.date.getMonth()].slice(0, 3)} {e.date.getDate()}
                </span>
                {' · '}
                {e.title}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ---------------- Featured success story ---------------- */

// The success_stories table has no dedicated "featured" column and the schema
// can't be changed, so the featured flag is tracked as a star prefix stored in
// the existing `quote` column. Display code always strips it via
// storyQuoteText(), and the admin toggle adds/removes it.
export const FEATURED_PREFIX = '⭐ ';

export function isStoryFeatured(story: any): boolean {
  return typeof story?.quote === 'string' && story.quote.startsWith(FEATURED_PREFIX.trim());
}

export function storyQuoteText(story: any): string {
  const q = story?.quote;
  if (typeof q !== 'string') return '';
  return q.startsWith(FEATURED_PREFIX.trim()) ? q.slice(FEATURED_PREFIX.trim().length).trimStart() : q;
}

export function StorySpotlight({ story }: { story: any }) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(212,160,23,0.12), rgba(45,27,126,0.4))',
        border: '1px solid rgba(212,160,23,0.4)',
        borderRadius: 14,
        padding: '18px 20px',
        marginBottom: 18,
        boxShadow: '0 4px 18px rgba(0,0,0,0.22), 0 0 30px rgba(212,160,23,0.06)',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
        ✨ Success story spotlight
      </div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)', lineHeight: 1.6, fontStyle: 'italic', fontFamily: "'Georgia', serif" }}>
        “{storyQuoteText(story)}”
      </div>
      {story.outcome && (
        <span
          style={{
            display: 'inline-block',
            marginTop: 10,
            fontSize: 12,
            fontWeight: 600,
            color: C.green,
            background: C.greenBg,
            padding: '3px 10px',
            borderRadius: 20,
          }}
        >
          {story.outcome}
        </span>
      )}
    </div>
  );
}
