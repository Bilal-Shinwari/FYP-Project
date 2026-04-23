import { Link } from 'react-router-dom';
import { Home, Mail, Linkedin, Github } from 'lucide-react';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-section">
                        <h3 className="footer-title">
                            <span className="footer-logo-urdu">بول</span> Urdu TTS
                        </h3>
                        <p className="footer-description">
                            Your companion for creating natural Urdu voices using cutting-edge AI technology.
                            Convert your text into lifelike audio and explore new ways to express your ideas.
                        </p>
                    </div>

                    <div className="footer-section">
                        <h4 className="footer-heading">Quick Links</h4>
                        <nav className="footer-links">
                            <Link to="/" className="footer-link">
                                <Home size={16} />
                                <span>Home</span>
                            </Link>
                            <Link to="/features" className="footer-link">
                                <span>Features</span>
                            </Link>
                            <Link to="/about" className="footer-link">
                                <span>About</span>
                            </Link>
                            <Link to="/dashboard" className="footer-link">
                                <span>Dashboard</span>
                            </Link>
                        </nav>
                    </div>

                    <div className="footer-section">
                        <h4 className="footer-heading">Connect</h4>
                        <p className="footer-text">
                            Have questions or feedback? Reach out anytime!
                        </p>
                        <div className="footer-social">
                            <a href="mailto:contact@bolurdu.com" className="social-link">
                                <Mail size={20} />
                            </a>
                            <a href="#" className="social-link">
                                <Linkedin size={20} />
                            </a>
                            <a href="#" className="social-link">
                                <Github size={20} />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p className="footer-copyright">
                        © 2026 بول Urdu. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
