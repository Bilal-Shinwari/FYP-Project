import { Users, Target, Brain, Code, Palette, Shield, Cpu } from "lucide-react";
import "./About.css";

export default function About() {
    return (
        <div className="about-page">
            {/* HERO */}
            <div className="page-hero">
                <div className="hero-background">
                    <div className="hero-pattern"></div>
                </div>

                <div className="container">
                    <div className="page-hero-content">
                        <div className="hero-icon">
                            <Users size={48} />
                        </div>
                        <h1 className="page-hero-title">About Urdu TTS</h1>
                        <p className="page-hero-description">
                            Bringing Urdu text to life with clear, natural, and personal voices powered by cutting-edge AI technology.
                        </p>
                    </div>
                </div>
            </div>

            <div className="container">
                {/* MISSION */}
                <section className="about-section">
                    <div className="section-icon">
                        <Target size={32} />
                    </div>
                    <h2 className="section-heading">Our Mission</h2>

                    <div className="section-content">
                        <p className="section-text">
                            We want Urdu content to be heard, not just read. Our goal is to make a simple,
                            fast, and high-quality Urdu Text-to-Speech system that anyone can use — students,
                            teachers, creators, and people with visual impairments.
                        </p>
                        <p className="section-text">
                            We focus on clarity, natural emotion, and privacy. Everything is designed to be
                            easy to access and ready for real-world use.
                        </p>
                    </div>
                </section>
            </div>

            {/* TEAM (full width band) */}
            <section className="about-section team-section">
                <div className="team-inner">
                    <div className="section-icon">
                        <Users size={32} />
                    </div>
                    <h2 className="section-heading">Our Team</h2>

                    <p className="team-intro">
                        Behind this Urdu Text-to-Speech project is a small but passionate team that worked
                        on every part of the system — from research and AI models to web development and deployment.
                    </p>

                    <div className="team-grid">
                        <div className="team-card">
                            <div className="team-icon-wrapper">
                                <Brain size={28} />
                            </div>
                            <h3 className="team-name">Muhammad Bilal</h3>
                            <p className="team-role">AI &amp; Model Lead</p>
                            <p className="team-description">
                                Fine-tuned and optimized TTS and voice cloning models for natural Urdu speech.
                            </p>
                        </div>

                        <div className="team-card team-card-highlight">
                            <div className="team-icon-wrapper">
                                <Code size={28} />
                            </div>
                            <h3 className="team-name">Rohail Ahmad</h3>
                            <p className="team-role">Full Stack Lead</p>
                            <p className="team-description">
                                Built the web interface, backend, API, and handled deployment.
                            </p>
                        </div>

                        <div className="team-card">
                            <div className="team-icon-wrapper">
                                <Palette size={28} />
                            </div>
                            <h3 className="team-name">Fiza Wahab</h3>
                            <p className="team-role">Data &amp; Design Lead</p>
                            <p className="team-description">
                                Handled dataset curation, system documentation, and overall design consistency.
                            </p>
                        </div>
                    </div>

                    <div className="supervisor-box">
                        <p className="supervisor-text">
                            <strong>Supervised by:</strong> Dr. Arshad Iqbal (Academic Supervisor) &amp; Muhammad Murtaza Khan
                            (Industry Supervisor, Sybrid Pvt. Ltd)
                        </p>
                    </div>
                </div>
            </section>

            <div className="container">
                {/* TECHNOLOGY */}
                <section className="about-section">
                    <div className="section-icon">
                        <Cpu size={32} />
                    </div>
                    <h2 className="section-heading">Our Technology</h2>

                    <p className="section-intro">
                        The system uses modern deep-learning models for Urdu speech and optional voice cloning.
                        You can control speed, pitch, and style to match the content.
                    </p>

                    <div className="tech-grid">
                        <div className="tech-card">
                            <div className="tech-icon-wrapper">
                                <Brain size={28} />
                            </div>
                            <div className="tech-content">
                                <h4 className="tech-title">Neural Networks</h4>
                                <p className="tech-desc">Natural Urdu pronunciation and flow with deep learning</p>
                            </div>
                        </div>

                        <div className="tech-card">
                            <div className="tech-icon-wrapper">
                                <Shield size={28} />
                            </div>
                            <div className="tech-content">
                                <h4 className="tech-title">Privacy First</h4>
                                <p className="tech-desc">Safe processing for text and voice data with encryption</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
