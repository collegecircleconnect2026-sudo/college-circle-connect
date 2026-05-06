import { useState } from 'react';
import { supabase } from '../supabase';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAuth() {
    setLoading(true);
    setError('');
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      if (data.user) {
        await supabase.from('users').insert({
          id: data.user.id,
          full_name: fullName,
          email,
          role,
          avatar_initials: fullName
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
        });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
    }
    setLoading(false);
  }

  const s: any = {
    wrap: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1E0A5C',
      fontFamily: 'sans-serif',
    },
    box: {
      background: '#2D1B7E',
      border: '0.5px solid #3D2A9E',
      borderRadius: 16,
      padding: 32,
      width: 360,
    },
    logo: { fontSize: 18, fontWeight: 500, color: '#D4A017', marginBottom: 4 },
    sub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 24 },
    label: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.7)',
      marginBottom: 4,
      display: 'block',
    },
    input: {
      width: '100%',
      padding: '9px 12px',
      border: '0.5px solid #3D2A9E',
      borderRadius: 8,
      fontSize: 13,
      marginBottom: 14,
      boxSizing: 'border-box' as any,
      background: '#1E0A5C',
      color: 'white',
    },
    select: {
      width: '100%',
      padding: '9px 12px',
      border: '0.5px solid #3D2A9E',
      borderRadius: 8,
      fontSize: 13,
      marginBottom: 14,
      boxSizing: 'border-box' as any,
      background: '#1E0A5C',
      color: 'white',
    },
    btn: {
      width: '100%',
      padding: '10px',
      background: '#D4A017',
      color: '#1E0A5C',
      border: 'none',
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 700,
      cursor: 'pointer',
      marginTop: 4,
    },
    toggle: {
      textAlign: 'center' as any,
      marginTop: 16,
      fontSize: 13,
      color: 'rgba(255,255,255,0.5)',
    },
    link: { color: '#D4A017', cursor: 'pointer', fontWeight: 500 },
    err: {
      fontSize: 12,
      color: '#ff6b6b',
      marginBottom: 12,
      background: 'rgba(255,100,100,0.1)',
      padding: '8px 10px',
      borderRadius: 6,
    },
  };

  return (
    <div style={s.wrap}>
      <div style={s.box}>
        <div style={s.logo}>Hartford Memorial Baptist Church</div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: 'white',
            marginBottom: 2,
          }}
        >
          College Circle Connect
        </div>
        <div style={s.sub}>
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </div>
        {error && <div style={s.err}>{error}</div>}
        {isSignUp && (
          <>
            <label style={s.label}>Full name</label>
            <input
              style={s.input}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
            <label style={s.label}>I am a</label>
            <select
              style={s.select}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="student">Student</option>
              <option value="mentor">Mentor</option>
            </select>
          </>
        )}
        <label style={s.label}>Email</label>
        <input
          style={s.input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
        />
        <label style={s.label}>Password</label>
        <input
          style={s.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        <button style={s.btn} onClick={handleAuth} disabled={loading}>
          {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
        </button>
        <div style={s.toggle}>
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <span style={s.link} onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Sign in' : 'Sign up'}
          </span>
        </div>
      </div>
    </div>
  );
}
