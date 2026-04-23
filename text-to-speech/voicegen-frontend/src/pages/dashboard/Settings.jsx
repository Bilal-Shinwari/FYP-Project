import { Settings, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './DashboardComponents.css';

export default function SettingsPage() {
    const { user, logout } = useAuth();

    return (
        <div className="dashboard-card">
            <div className="card-header">
                <div className="card-icon-wrapper">
                    <Settings size={24} />
                </div>
                <div>
                    <h2>Settings</h2>
                    <p>Manage your account preferences</p>
                </div>
            </div>

            <div className="card-content">
                <div className="settings-section">
                    <h3>Account Information</h3>
                    <div className="info-row">
                        <div className="label">Username</div>
                        <div className="value">{user?.username}</div>
                    </div>
                    <div className="info-row">
                        <div className="label">Email</div>
                        <div className="value">{user?.email}</div>
                    </div>
                    <div className="info-row">
                        <div className="label">Plan</div>
                        <div className="value badge">Free Tier</div>
                    </div>
                </div>

                <button className="danger-btn" onClick={logout}>
                    <LogOut size={20} />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
