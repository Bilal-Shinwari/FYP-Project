import { AudioWaveform, Upload, Play, Loader2, AlertCircle, CheckCircle2, Mic, Square } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGeneration } from '../../context/GenerationContext';
import AudioVisualizer3D from '../../components/AudioVisualizer3D';
import './DashboardComponents.css';

export default function VoiceCloning() {
    const { token } = useAuth();
    const {
        cloneText, setCloneText,
        cloneFile, handleCloneFileChange,
        cloneTau, setCloneTau,
        cloneLoading, cloneAudioUrl, cloneError, generateClone,
        recording, recSeconds, startRecording, stopRecording, fmt,
    } = useGeneration();

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
                        <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => handleCloneFileChange(e.target.files?.[0])}
                            className="file-input"
                            id="voice-sample"
                        />
                        <label htmlFor="voice-sample" className="file-label">
                            <Upload size={20} />
                            <span>{cloneFile ? cloneFile.name : 'Upload WAV / MP3 (auto-converted to WAV)'}</span>
                        </label>
                    </div>

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
                    <textarea
                        className="text-input"
                        placeholder="اردو متن یہاں لکھیں..."
                        value={cloneText}
                        onChange={(e) => setCloneText(e.target.value)}
                        rows={4}
                    />
                </div>

                {/* Similarity slider */}
                <div className="input-group">
                    <label>Similarity: <span className="highlight">{cloneTau}</span></label>
                    <input
                        type="range" min="0.1" max="1.0" step="0.1"
                        value={cloneTau}
                        onChange={(e) => setCloneTau(parseFloat(e.target.value))}
                        className="range-input"
                    />
                    <div className="range-labels"><span>More Stable (0.1)</span><span>More Creative (1.0)</span></div>
                </div>

                <button
                    className="primary-btn"
                    onClick={() => generateClone(token)}
                    disabled={cloneLoading || recording}
                >
                    {cloneLoading ? (
                        <><Loader2 size={20} className="spin" />Cloning... (you can switch tabs)</>
                    ) : (
                        <><Play size={20} />Generate Cloned Voice</>
                    )}
                </button>

                {cloneError && <div className="error-msg"><AlertCircle size={20} />{cloneError}</div>}

                {cloneAudioUrl && (
                    <div className="success-box">
                        <div className="success-header"><CheckCircle2 size={20} /><span>Voice Cloned Successfully</span></div>
                        <AudioVisualizer3D audioUrl={cloneAudioUrl} autoPlay={true} />
                    </div>
                )}
            </div>
        </div>
    );
}
