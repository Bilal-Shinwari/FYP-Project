import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { API_BASE } from '../config';

const GenerationContext = createContext(null);

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
        return new File([wavBlob], `${file.name.replace(/\.[^.]+$/, '')}.wav`, { type: 'audio/wav' });
    } catch {
        return file;
    }
}

export function GenerationProvider({ children }) {
    // TTS state
    const [ttsText, setTtsText] = useState('');
    const [ttsLoading, setTtsLoading] = useState(false);
    const [ttsAudioUrl, setTtsAudioUrl] = useState(null);
    const [ttsError, setTtsError] = useState('');

    // Clone state
    const [cloneText, setCloneText] = useState('');
    const [cloneFile, setCloneFile] = useState(null);
    const [cloneTau, setCloneTau] = useState(0.9);
    const [cloneLoading, setCloneLoading] = useState(false);
    const [cloneAudioUrl, setCloneAudioUrl] = useState(null);
    const [cloneError, setCloneError] = useState('');
    const [recording, setRecording] = useState(false);
    const [recSeconds, setRecSeconds] = useState(0);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (ttsAudioUrl) URL.revokeObjectURL(ttsAudioUrl);
        };
    }, [ttsAudioUrl]);

    useEffect(() => {
        return () => {
            if (cloneAudioUrl) URL.revokeObjectURL(cloneAudioUrl);
        };
    }, [cloneAudioUrl]);

    const generateTTS = async (token) => {
        setTtsError('');
        setTtsAudioUrl(null);
        if (!ttsText.trim()) { setTtsError('Please enter some text'); return; }
        setTtsLoading(true);
        try {
            const fd = new FormData();
            fd.append('text', ttsText);
            const res = await fetch(`${API_BASE}/tts_simple`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            if (!res.ok) {
                const e = await res.json().catch(() => ({}));
                throw new Error(e.detail || 'Failed to generate speech');
            }
            setTtsAudioUrl(URL.createObjectURL(await res.blob()));
        } catch (err) {
            setTtsError(err.message);
        } finally {
            setTtsLoading(false);
        }
    };

    const handleCloneFileChange = async (file) => {
        if (!file) return;
        setCloneFile(await convertToWav(file));
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
                setCloneFile(wav);
            };
            recorder.start();
            mediaRecorderRef.current = recorder;
            setRecording(true);
            setRecSeconds(0);
            timerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
        } catch {
            setCloneError('Microphone access denied. Please allow mic access in browser settings.');
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        clearInterval(timerRef.current);
        setRecording(false);
    };

    const generateClone = async (token) => {
        setCloneError('');
        setCloneAudioUrl(null);
        if (!cloneText.trim()) { setCloneError('Please enter some text'); return; }
        if (!cloneFile) { setCloneError('Please upload or record a voice sample'); return; }
        setCloneLoading(true);
        try {
            const fd = new FormData();
            fd.append('text', cloneText);
            fd.append('tau', String(cloneTau));
            fd.append('ref', cloneFile);
            const res = await fetch(`${API_BASE}/clone`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            if (!res.ok) {
                const e = await res.json().catch(() => ({}));
                throw new Error(e.detail || 'Failed to clone voice');
            }
            setCloneAudioUrl(URL.createObjectURL(await res.blob()));
        } catch (err) {
            setCloneError(err.message);
        } finally {
            setCloneLoading(false);
        }
    };

    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    return (
        <GenerationContext.Provider value={{
            ttsText, setTtsText, ttsLoading, ttsAudioUrl, ttsError, generateTTS,
            cloneText, setCloneText,
            cloneFile, handleCloneFileChange,
            cloneTau, setCloneTau,
            cloneLoading, cloneAudioUrl, cloneError, generateClone,
            recording, recSeconds, startRecording, stopRecording, fmt,
        }}>
            {children}
        </GenerationContext.Provider>
    );
}

export const useGeneration = () => useContext(GenerationContext);
