import { useState, useEffect } from 'react';
import { History, Clock, Play, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './DashboardComponents.css';

export default function HistoryPage() {
    const { token } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const API_BASE = "http://localhost:8000";

    useEffect(() => {
        if (token) {
            fetchHistory();
        }
    }, [token]);

    const fetchHistory = async () => {
        try {
            const response = await fetch(`${API_BASE}/history`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch history');

            const data = await response.json();
            setHistory(data);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="dashboard-card">
            <div className="card-header">
                <div className="card-icon-wrapper">
                    <History size={24} />
                </div>
                <div>
                    <h2>Generation History</h2>
                    <p>View your past audio generations</p>
                </div>
            </div>

            <div className="card-content">
                {loading ? (
                    <div className="loading-state">Loading history...</div>
                ) : error ? (
                    <div className="error-message">Error: {error}</div>
                ) : history.length === 0 ? (
                    <div className="empty-state">
                        <Clock size={48} className="empty-icon" />
                        <p>No history found. Generate some audio first!</p>
                    </div>
                ) : (
                    <div className="history-list">
                        {history.map((item) => (
                            <div key={item.id} className="history-item">
                                <div className="history-info">
                                    <div className="history-header">
                                        <span className={`badge ${item.model_type === 'clone' ? 'badge-accent' : ''}`}>
                                            {item.model_type === 'clone' ? 'Voice Clone' : 'TTS'}
                                        </span>
                                        <span className="history-date">{formatDate(item.created_at)}</span>
                                    </div>
                                    <p className="history-text" title={item.input_text}>{item.input_text}</p>
                                </div>
                                <div className="history-actions">
                                    <audio controls src={`${API_BASE}/static/${item.audio_path.split('\\').pop().split('/').pop()}`} className="history-audio" />
                                    <a
                                        href={`${API_BASE}/static/${item.audio_path.split('\\').pop().split('/').pop()}`}
                                        download
                                        className="action-btn"
                                        title="Download"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Download size={18} />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
