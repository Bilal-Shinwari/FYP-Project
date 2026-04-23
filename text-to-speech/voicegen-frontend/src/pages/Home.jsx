import { Link } from 'react-router-dom';
import { ArrowRight, Mic, AudioWaveform, Zap, CheckCircle } from 'lucide-react';
import './Home.css';

export default function Home() {
    return (
        <div className="home">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-background">
                    <div className="hero-pattern"></div>
                </div>
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <AudioWaveform size={16} />
                            <span>AI-Powered Urdu Speech</span>
                        </div>
                        <h1 className="hero-title">
                            Urdu Text-to-Speech that <span className="highlight">Sounds Human</span>
                        </h1>
                        <p className="hero-subtitle">
                            Transform your Urdu text into a warm, realistic voice that feels human.
                            Perfect for students, creators, and anyone who wants Urdu content to sound
                            alive and emotional — not robotic.
                        </p>
                        <div className="hero-buttons">
                            <Link to="/dashboard" className="btn btn-primary">
                                <span>Get Started Free</span>
                                <ArrowRight size={20} />
                            </Link>
                            <Link to="/features" className="btn btn-secondary">
                                <span>Explore Features</span>
                            </Link>
                        </div>
                        <div className="hero-features">
                            <div className="hero-feature-item">
                                <CheckCircle size={18} />
                                <span>Natural Urdu Voice</span>
                            </div>
                            <div className="hero-feature-item">
                                <CheckCircle size={18} />
                                <span>Voice Cloning</span>
                            </div>
                            <div className="hero-feature-item">
                                <CheckCircle size={18} />
                                <span>Fast & Free</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Preview */}
            <section className="features-preview">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Powerful Features</h2>
                        <p className="section-subtitle">Everything you need for natural Urdu speech</p>
                    </div>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">
                                <Mic className="feature-icon" size={32} />
                            </div>
                            <h3 className="feature-title">Text-to-Speech</h3>
                            <p className="feature-description">
                                Type or paste Urdu text and turn it into a natural, human-sounding voice
                                in just one click. Adjust style, tone, and speed easily.
                            </p>
                            <Link to="/dashboard" className="feature-link">
                                Try it now <ArrowRight size={16} />
                            </Link>
                        </div>

                        <div className="feature-card feature-card-highlight">
                            <div className="feature-icon-wrapper">
                                <AudioWaveform className="feature-icon" size={32} />
                            </div>
                            <h3 className="feature-title">Voice Cloning</h3>
                            <p className="feature-description">
                                Create your own Urdu voice using a short audio sample. Our AI learns
                                your tone and style to make the sound truly personal.
                            </p>
                            <Link to="/dashboard" className="feature-link">
                                Clone voice <ArrowRight size={16} />
                            </Link>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon-wrapper">
                                <Zap className="feature-icon" size={32} />
                            </div>
                            <h3 className="feature-title">Fast Processing</h3>
                            <p className="feature-description">
                                Get results in seconds! Our smart system works smoothly on any device
                                without heavy setup or installation.
                            </p>
                            <Link to="/features" className="feature-link">
                                Learn more <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
