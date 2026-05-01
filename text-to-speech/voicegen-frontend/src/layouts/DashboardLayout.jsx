import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useGeneration } from '../context/GenerationContext';
import {
    Mic, AudioWaveform, History, Settings,
    LogOut, Menu, X, User, Sun, Moon
} from 'lucide-react';
import './DashboardLayout.css';

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { darkMode, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const { ttsLoading, cloneLoading } = useGeneration();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/login'); };

    const navItems = [
        { icon: Mic, label: 'Text-to-Speech', path: '/dashboard/tts', loading: ttsLoading },
        { icon: AudioWaveform, label: 'Voice Cloning', path: '/dashboard/clone', loading: cloneLoading },
        { icon: History, label: 'History', path: '/dashboard/history' },
        { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
    ];

    return (
        <div className="dashboard-layout">
            {/* Mobile Header */}
            <div className="mobile-header">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="menu-btn">
                    {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <span className="mobile-logo">بول Urdu TTS</span>
                <button onClick={toggleTheme} className="menu-btn">
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <span className="logo-urdu">بول</span>
                        <span className="logo-text">Urdu</span>
                    </div>
                </div>

                <div className="user-profile-mini">
                    <div className="avatar"><User size={20} /></div>
                    <div className="user-info">
                        <span className="username">{user?.username || 'Guest'}</span>
                        <span className="user-role">Free Plan</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                            {item.loading && <span className="nav-generating-dot" title="Generating..." />}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button onClick={toggleTheme} className="theme-toggle-btn">
                        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-content">
                <Outlet />
            </main>

            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}
        </div>
    );
}
