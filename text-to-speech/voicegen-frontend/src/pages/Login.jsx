import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { API_BASE } from '../config';
import './Auth.css';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);
            const res = await fetch(`${API_BASE}/token`, { method: 'POST', body: formData });
            if (!res.ok) throw new Error('Invalid username or password');
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
                    <h2>Natural Urdu Voice,<br />Powered by AI</h2>
                    <p>Convert text to natural Urdu speech or clone any voice in seconds.</p>
                    <ul className="auth-brand-features">
                        <li><span className="feat-dot" />High-quality Urdu synthesis</li>
                        <li><span className="feat-dot" />Voice cloning from short samples</li>
                        <li><span className="feat-dot" />Fine-tuned ChatterBox model</li>
                    </ul>
                </div>
            </div>

            {/* Right form panel */}
            <div className="auth-form-panel">
                <div className="auth-form-inner">
                    <div className="auth-form-header">
                        <h1>Welcome back</h1>
                        <p>Sign in to your account</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="auth-field">
                            <label>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                autoFocus
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label>Password</label>
                            <div className="auth-password-wrap">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
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
                        </div>

                        <button type="submit" className="auth-submit" disabled={loading}>
                            {loading ? (
                                <><Loader2 size={18} className="spin" /> Signing in…</>
                            ) : (
                                <>Sign In <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <p className="auth-switch">
                        Don't have an account? <Link to="/register">Create one</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
