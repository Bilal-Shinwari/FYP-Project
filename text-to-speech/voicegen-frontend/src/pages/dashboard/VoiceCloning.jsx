import { useState, useEffect } from "react";
import { AudioWaveform, Upload, Sliders, Play, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AudioVisualizer3D from '../../components/AudioVisualizer3D';
import './DashboardComponents.css';

export default function VoiceCloning() {
    const [text, setText] = useState("");
    const [file, setFile] = useState(null);
    const [tau, setTau] = useState(0.9);
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
        if (!file) {
            setError("Please upload a voice sample");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("text", text);
            formData.append("tau", String(tau));
            formData.append("ref", file);

            const res = await fetch("http://localhost:8000/clone", {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            if (!res.ok) {
                throw new Error("Failed to clone voice");
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
                    <AudioWaveform size={24} />
                </div>
                <div>
                    <h2>Voice Cloning</h2>
                    <p>Upload a sample to create a personalized voice</p>
                </div>
            </div>

            <div className="card-content">
                <div className="input-group">
                    <label>Voice Sample</label>
                    <div className="file-upload-wrapper">
                        <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="file-input"
                            id="voice-sample"
                        />
                        <label htmlFor="voice-sample" className="file-label">
                            <Upload size={20} />
                            <span>{file ? file.name : "Choose audio file (WAV/MP3)"}</span>
                        </label>
                        <p className="hint">Upload a clear 10-30s audio sample</p>
                    </div>
                </div>

                <div className="input-group">
                    <label>Text to Speak</label>
                    <textarea
                        className="text-input"
                        placeholder="اردو متن یہاں لکھیں..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={4}
                    />
                </div>

                <div className="input-group">
                    <label>
                        Temperature (Similarity): <span className="highlight">{tau}</span>
                    </label>
                    <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={tau}
                        onChange={(e) => setTau(parseFloat(e.target.value))}
                        className="range-input"
                    />
                    <div className="range-labels">
                        <span>More Stable (0.1)</span>
                        <span>More Creative (1.0)</span>
                    </div>
                </div>

                <button
                    className="primary-btn"
                    onClick={generate}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 size={20} className="spin" />
                            Cloning Voice...
                        </>
                    ) : (
                        <>
                            <Play size={20} />
                            Generate Cloned Voice
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
                            <span>Voice Cloned Successfully</span>
                        </div>
                        <AudioVisualizer3D audioUrl={audioUrl} autoPlay={true} />
                    </div>
                )}
            </div>
        </div>
    );
}
