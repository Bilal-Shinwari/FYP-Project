import { Mic, Play, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGeneration } from '../../context/GenerationContext';
import AudioVisualizer3D from '../../components/AudioVisualizer3D';
import './DashboardComponents.css';

export default function TextToSpeech() {
    const { token } = useAuth();
    const { ttsText, setTtsText, ttsLoading, ttsAudioUrl, ttsError, generateTTS } = useGeneration();

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
                    value={ttsText}
                    onChange={(e) => setTtsText(e.target.value)}
                    rows={6}
                />

                <button
                    className="primary-btn"
                    onClick={() => generateTTS(token)}
                    disabled={ttsLoading}
                >
                    {ttsLoading ? (
                        <>
                            <Loader2 size={20} className="spin" />
                            Generating... (you can switch tabs)
                        </>
                    ) : (
                        <>
                            <Play size={20} />
                            Generate Speech
                        </>
                    )}
                </button>

                {ttsError && (
                    <div className="error-msg">
                        <AlertCircle size={20} />
                        {ttsError}
                    </div>
                )}

                {ttsAudioUrl && (
                    <div className="success-box">
                        <div className="success-header">
                            <CheckCircle2 size={20} />
                            <span>Generated Successfully</span>
                        </div>
                        <AudioVisualizer3D audioUrl={ttsAudioUrl} autoPlay={true} />
                    </div>
                )}
            </div>
        </div>
    );
}
