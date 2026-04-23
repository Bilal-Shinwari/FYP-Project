import { Link } from 'react-router-dom';
import { Home, Sparkles, Info, Play } from 'lucide-react';
import './Header.css';

export default function Header() {
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
