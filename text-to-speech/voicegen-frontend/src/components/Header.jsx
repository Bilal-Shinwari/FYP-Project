import { Link } from 'react-router-dom';
import { Home, Sparkles, Info, Play, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './Header.css';

export default function Header() {
    const { darkMode, toggleTheme } = useTheme();

    return (
        <header className="header">
            <div className="container">
                <div className="header-content">
                    <Link to="/" className="logo">
                        <span className="logo-urdu">بول</span>
                        <span className="logo-text">Urdu TTS</span>
                    </Link>

                    <nav className="nav">
                        <Link to="/" className="nav-link">
                            <Home size={18} />
                            <span>Home</span>
                        </Link>
                        <Link to="/features" className="nav-link">
                            <Sparkles size={18} />
                            <span>Features</span>
                        </Link>
                        <Link to="/about" className="nav-link">
                            <Info size={18} />
                            <span>About</span>
                        </Link>
                        <button className="theme-toggle-header" onClick={toggleTheme} aria-label="Toggle theme">
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <Link to="/dashboard" className="nav-link nav-link-primary">
                            <Play size={18} />
                            <span>Try Demo</span>
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
}
