import { useState, useEffect } from "react";
import { API_BASE } from '../../config';
import { Mic, Play, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AudioVisualizer3D from '../../components/AudioVisualizer3D';
import './DashboardComponents.css';

export default function TextToSpeech() {
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [error, setError] = useState("");
    const { token } = useAuth();

    useEffect(() => {
        return () => {
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, [audioUrl]);

    const generate = async () => {
        setError("");
        setAudioUrl(null);
        if (!text.trim()) {
            setError("Please enter some text");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("text", text);

            const res = await fetch(`${API_BASE}/tts_simple`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || "Failed to generate speech");
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-card">
            <div className="card-header">
                <div className="card-icon-wrapper">
                    <Mic size={24} />
                </div>
                <div>
                    <h2>Text-to-Speech</h2>
                    <p>Convert Urdu text into natural sounding speech</p>
                </div>
            </div>

            <div className="card-content">
                <textarea
                    className="text-input"
                    placeholder="اردو متن یہاں لکھیں..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={6}
                />

                <button
                    className="primary-btn"
                    onClick={generate}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 size={20} className="spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Play size={20} />
                            Generate Speech
                        </>
                    )}
                </button>

                {error && (
                    <div className="error-msg">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                {audioUrl && (
                    <div className="success-box">
                        <div className="success-header">
                            <CheckCircle2 size={20} />
                            <span>Generated Successfully</span>
                        </div>
                        <AudioVisualizer3D audioUrl={audioUrl} autoPlay={true} />
                    </div>
                )}
            </div>
        </div>
    );
}
