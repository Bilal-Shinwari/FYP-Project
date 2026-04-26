import { useState, useRef, useEffect } from "react";
import { API_BASE } from '../../config';
import { AudioWaveform, Upload, Play, Loader2, AlertCircle, CheckCircle2, Mic, Square } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AudioVisualizer3D from '../../components/AudioVisualizer3D';
import './DashboardComponents.css';

// --- WAV encoder ---
function audioBufferToWav(buffer) {
    const numCh = Math.min(buffer.numberOfChannels, 2);
    const sr = buffer.sampleRate;
    const len = buffer.length * numCh * 2;
    const wav = new ArrayBuffer(44 + len);
    const v = new DataView(wav);
    const wr = (off, s) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };
    wr(0, 'RIFF'); v.setUint32(4, 36 + len, true);
    wr(8, 'WAVE'); wr(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true);
    v.setUint16(22, numCh, true); v.setUint32(24, sr, true);
    v.setUint32(28, sr * numCh * 2, true); v.setUint16(32, numCh * 2, true);
    v.setUint16(34, 16, true); wr(36, 'data'); v.setUint32(40, len, true);
    let off = 44;
    for (let i = 0; i < buffer.length; i++) {
        for (let ch = 0; ch < numCh; ch++) {
            const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
            v.setInt16(off, s < 0 ? s * 32768 : s * 32767, true);
            off += 2;
        }
    }
    return new Blob([wav], { type: 'audio/wav' });
}

async function convertToWav(file) {
    if (file.type === 'audio/wav' || file.name.toLowerCase().endsWith('.wav')) return file;
    try {
        const ctx = new AudioContext();
        const ab = await ctx.decodeAudioData(await file.arrayBuffer());
        const wavBlob = audioBufferToWav(ab);
        await ctx.close();
        const base = file.name.replace(/\.[^.]+$/, '');
        return new File([wavBlob], `${base}.wav`, { type: 'audio/wav' });
    } catch {
        return file; // fallback: send original and let backend handle it
    }
}

export default function VoiceCloning() {
    const [text, setText] = useState("");
    const [file, setFile] = useState(null);
    const [tau, setTau] = useState(0.9);
    const [loading, setLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [error, setError] = useState("");
    const [recording, setRecording] = useState(false);
    const [recSeconds, setRecSeconds] = useState(0);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    const { token } = useAuth();

    useEffect(() => {
        return () => {
            if (audioUrl) URL.revokeObjectURL(audioUrl);
            clearInterval(timerRef.current);
        };
    }, [audioUrl]);

    const handleFileChange = async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const converted = await convertToWav(f);
        setFile(converted);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            chunksRef.current = [];
            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            recorder.onstop = async () => {
                stream.getTracks().forEach(t => t.stop());
                const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
                const wav = await convertToWav(new File([blob], 'recording.webm', { type: blob.type }));
                setFile(wav);
            };
            recorder.start();
            mediaRecorderRef.current = recorder;
            setRecording(true);
            setRecSeconds(0);
            timerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
        } catch {
            setError("Microphone access denied. Please allow mic access in browser settings.");
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        clearInterval(timerRef.current);
        setRecording(false);
    };

    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const generate = async () => {
        setError("");
        setAudioUrl(null);
        if (!text.trim()) { setError("Please enter some text"); return; }
        if (!file) { setError("Please upload or record a voice sample"); return; }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("text", text);
            formData.append("tau", String(tau));
            formData.append("ref", file);
            const res = await fetch(`${API_BASE}/clone`, {
                method: "POST",
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || "Failed to clone voice");
            }
            setAudioUrl(URL.createObjectURL(await res.blob()));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-card">
            <div className="card-header">
                <div className="card-icon-wrapper"><AudioWaveform size={24} /></div>
                <div>
                    <h2>Voice Cloning</h2>
                    <p>Upload or record a sample to create a personalized voice</p>
                </div>
            </div>

            <div className="card-content">
                {/* Voice Sample */}
                <div className="input-group">
                    <label>Voice Sample</label>
                    <div className="file-upload-wrapper">
                        <input type="file" accept="audio/*" onChange={handleFileChange} className="file-input" id="voice-sample" />
                        <label htmlFor="voice-sample" className="file-label">
                            <Upload size={20} />
                            <span>{file ? file.name : "Upload WAV / MP3 (auto-converted to WAV)"}</span>
                        </label>
                    </div>

                    {/* Mic recording row */}
                    <div className="mic-row">
                        {!recording ? (
                            <button className="mic-btn" onClick={startRecording} type="button">
                                <Mic size={16} /> Record from Microphone
                            </button>
                        ) : (
                            <button className="mic-btn mic-btn--recording" onClick={stopRecording} type="button">
                                <Square size={16} /> Stop  {fmt(recSeconds)}
                            </button>
                        )}
                    </div>
                    <p className="hint">Use a clear 10–30s sample for best results</p>
                </div>

                {/* Text */}
                <div className="input-group">
                    <label>Text to Speak</label>
                    <textarea className="text-input" placeholder="اردو متن یہاں لکھیں..." value={text} onChange={(e) => setText(e.target.value)} rows={4} />
                </div>

                {/* Similarity slider */}
                <div className="input-group">
                    <label>Similarity: <span className="highlight">{tau}</span></label>
                    <input type="range" min="0.1" max="1.0" step="0.1" value={tau} onChange={(e) => setTau(parseFloat(e.target.value))} className="range-input" />
                    <div className="range-labels"><span>More Stable (0.1)</span><span>More Creative (1.0)</span></div>
                </div>

                <button className="primary-btn" onClick={generate} disabled={loading || recording}>
                    {loading ? <><Loader2 size={20} className="spin" />Cloning Voice...</> : <><Play size={20} />Generate Cloned Voice</>}
                </button>

                {error && <div className="error-msg"><AlertCircle size={20} />{error}</div>}

                {audioUrl && (
                    <div className="success-box">
                        <div className="success-header"><CheckCircle2 size={20} /><span>Voice Cloned Successfully</span></div>
                        <AudioVisualizer3D audioUrl={audioUrl} autoPlay={true} />
                    </div>
                )}
            </div>
        </div>
    );
}
