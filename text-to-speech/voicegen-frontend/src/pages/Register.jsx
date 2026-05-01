import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { API_BASE } from '../config';
import './Auth.css';

export default function Register() {
    const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

    const passwordStrength = () => {
        const p = form.password;
        if (!p) return 0;
        let s = 0;
        if (p.length >= 8) s++;
        if (/[A-Z]/.test(p)) s++;
        if (/[0-9]/.test(p)) s++;
        if (/[^A-Za-z0-9]/.test(p)) s++;
        return s;
    };

    const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];
    const ps = passwordStrength();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: form.username, email: form.email, password: form.password }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Registration failed');
            }
            const data = await res.json();
            login(data.access_token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* Left brand panel */}
            <div className="auth-brand">
                <Link to="/" className="auth-brand-logo">
                    <span className="auth-logo-urdu">بول</span>
                    <span className="auth-logo-text">Urdu TTS</span>
                </Link>
                <div className="auth-brand-body">
                    <h2>Start speaking<br />in Urdu today</h2>
                    <p>Create your free account and generate natural Urdu speech instantly.</p>
                    <ul className="auth-brand-features">
                        <li><span className="feat-dot" />Free to get started</li>
                        <li><span className="feat-dot" />No credit card required</li>
                        <li><span className="feat-dot" />Powered by fine-tuned AI</li>
                    </ul>
                </div>
            </div>

            {/* Right form panel */}
            <div className="auth-form-panel">
                <div className="auth-form-inner">
                    <div className="auth-form-header">
                        <h1>Create account</h1>
                        <p>Sign up to get started for free</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="auth-fields-row">
                            <div className="auth-field">
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={form.username}
                                    onChange={set('username')}
                                    placeholder="Choose a username"
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="auth-field">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={set('email')}
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <label>Password</label>
                            <div className="auth-password-wrap">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={set('password')}
                                    placeholder="Create a password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(s => !s)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {form.password && (
                                <div className="password-strength">
                                    <div className="strength-bars">
                                        {[1,2,3,4].map(i => (
                                            <span
                                                key={i}
                                                className="strength-bar"
                                                style={{ background: i <= ps ? strengthColor[ps] : 'var(--gray-200)' }}
                                            />
                                        ))}
                                    </div>
                                    <span style={{ color: strengthColor[ps], fontSize: '0.78rem', fontWeight: 500 }}>
                                        {strengthLabel[ps]}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="auth-field">
                            <label>Confirm Password</label>
                            <div className="auth-password-wrap">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.confirmPassword}
                                    onChange={set('confirmPassword')}
                                    placeholder="Repeat your password"
                                    required
                                />
                                {form.confirmPassword && (
                                    <span className="password-match-icon">
                                        {form.password === form.confirmPassword
                                            ? <CheckCircle2 size={16} color="#22c55e" />
                                            : <AlertCircle size={16} color="#ef4444" />}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button type="submit" className="auth-submit" disabled={loading}>
                            {loading ? (
                                <><Loader2 size={18} className="spin" /> Creating account…</>
                            ) : (
                                <>Create Account <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <p className="auth-switch">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
