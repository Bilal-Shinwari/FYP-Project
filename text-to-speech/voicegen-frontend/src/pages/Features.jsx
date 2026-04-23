import { Volume2, Sparkles, Shield, Zap } from 'lucide-react';
import './Features.css';

export default function Features() {
    return (
        <div className="features-page">
            <div className="page-hero">
                <div className="hero-background">
                    <div className="hero-pattern"></div>
                </div>
                <div className="container">
                    <div className="page-hero-content">
                        <div className="hero-icon">
                            <Sparkles size={48} />
                        </div>
                        <h1 className="page-hero-title">Powerful Features</h1>
                        <p className="page-hero-description">
                            Discover the main features of our Urdu Text-to-Speech System — designed to make
                            Urdu sound natural, emotional, and easy to generate for everyone.
                        </p>
                    </div>
                </div>
            </div>

            <div className="container">
                <section className="feature-section">
                    <div className="feature-content">
                        <div className="feature-text">
                            <div className="feature-label">
                                <Volume2 size={20} />
                                <span>Core Technology</span>
                            </div>
                            <h2 className="feature-heading">Advanced Urdu Text-to-Speech</h2>
                            <ul className="feature-list">
                                <li>
                                    <Zap size={18} className="list-icon" />
                                    <span>Converts written Urdu text into smooth, natural-sounding speech</span>
                                </li>
                                <li>
                                    <Zap size={18} className="list-icon" />
                                    <span>Powered by deep learning models for high-quality synthesis</span>
                                </li>
                                <li>
                                    <Zap size={18} className="list-icon" />
                                    <span>Adjust speed, pitch, and tone to create the voice you like</span>
                                </li>
                                <li>
                                    <Zap size={18} className="list-icon" />
                                    <span>Real-time processing ensures quick and clear voice output</span>
                                </li>
                            </ul>
                        </div>
                        <div className="feature-visual">
                            <div className="feature-badge-large">
                                <Volume2 size={64} />
                            </div>
                            <p className="feature-badge-text">Premium Audio Quality</p>
                        </div>
                    </div>
                </section>

                <section className="feature-section feature-section-alt">
                    <div className="feature-content feature-content-reverse">
                        <div className="feature-visual">
                            <div className="feature-badge-large">
                                <Sparkles size={64} />
                            </div>
                            <p className="feature-badge-text">AI Voice Cloning</p>
                        </div>
                        <div className="feature-text">
                            <div className="feature-label">
                                <Sparkles size={20} />
                                <span>Personalization</span>
                            </div>
                            <h2 className="feature-heading">Voice Cloning & Customization</h2>
                            <ul className="feature-list">
                                <li>
                                    <Shield size={18} className="list-icon" />
                                    <span>Create your own Urdu voice using a few seconds of recorded audio</span>
                                </li>
                                <li>
                                    <Shield size={18} className="list-icon" />
                                    <span>Zero-shot cloning — get personalized speech with limited data</span>
                                </li>
                                <li>
                                    <Shield size={18} className="list-icon" />
                                    <span>Keeps your tone, accent, and emotion for realistic results</span>
                                </li>
                                <li>
                                    <Shield size={18} className="list-icon" />
                                    <span>Safe and private — your data stays secure during processing</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
