import { useRef, useState, useEffect, useCallback } from 'react';
import './AudioVisualizer3D.css';

export default function AudioVisualizer({ audioUrl, autoPlay = true }) {
    const audioRef   = useRef(null);
    const canvasRef  = useRef(null);
    const analyserRef = useRef(null);
    const audioCtxRef = useRef(null);
    const animRef    = useRef(null);
    const playingRef = useRef(false);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => { playingRef.current = isPlaying; }, [isPlaying]);

    // ── Draw loop ──────────────────────────────────────────────────────────
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const W   = canvas.offsetWidth;
        const H   = canvas.offsetHeight;

        if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
            canvas.width  = W * dpr;
            canvas.height = H * dpr;
            ctx.scale(dpr, dpr);
        }

        ctx.clearRect(0, 0, W, H);

        const cx = W / 2;
        const cy = H / 2;
        const t  = performance.now() / 1000;
        const playing = playingRef.current;

        // Frequency data (or zero-array fallback)
        let freq = null;
        let bass = 0, avg = 0;
        if (analyserRef.current && playing) {
            freq = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(freq);
            bass = (freq[0] + freq[1] + freq[2]) / (3 * 255);
            avg  = freq.reduce((a, b) => a + b, 0) / (freq.length * 255);
        }

        const baseR = Math.min(W, H) * 0.27;

        // Sphere radius — breathes with audio or time
        const beat   = Math.abs(Math.sin(t * 2.8));
        const breath = playing
            ? baseR * (1 + beat * 0.24 + bass * 0.28 + avg * 0.06)
            : baseR * (1 + Math.sin(t * 0.9) * 0.04);

        // ── Frequency bars around sphere ───────────────────────────────────
        if (freq && playing) {
            const N = freq.length;
            for (let i = 0; i < N; i++) {
                const angle  = (i / N) * Math.PI * 2 - Math.PI / 2;
                const len    = (freq[i] / 255) * baseR * 0.85;
                const alpha  = 0.3 + (freq[i] / 255) * 0.7;
                const hue    = 210 + (freq[i] / 255) * 45;
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(angle) * (breath + 3), cy + Math.sin(angle) * (breath + 3));
                ctx.lineTo(cx + Math.cos(angle) * (breath + 3 + len), cy + Math.sin(angle) * (breath + 3 + len));
                ctx.strokeStyle = `hsla(${hue},85%,62%,${alpha})`;
                ctx.lineWidth   = Math.max(1.5, (Math.PI * 2 * breath) / N * 0.7);
                ctx.lineCap     = 'round';
                ctx.stroke();
            }
        }

        // ── Outer glow halo ────────────────────────────────────────────────
        const haloR = breath * (playing ? 1.65 + beat * 0.25 : 1.28);
        const halo  = ctx.createRadialGradient(cx, cy, breath * 0.85, cx, cy, haloR);
        halo.addColorStop(0, playing ? `rgba(59,130,246,${0.22 + beat * 0.18})` : 'rgba(59,130,246,0.07)');
        halo.addColorStop(1, 'rgba(59,130,246,0)');
        ctx.beginPath();
        ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
        ctx.fillStyle = halo;
        ctx.fill();

        // ── Sphere body ────────────────────────────────────────────────────
        const sphere = ctx.createRadialGradient(
            cx - breath * 0.33, cy - breath * 0.33, breath * 0.04,
            cx, cy, breath
        );
        sphere.addColorStop(0,    '#93c5fd');
        sphere.addColorStop(0.30, '#3b82f6');
        sphere.addColorStop(0.65, '#1e40af');
        sphere.addColorStop(1,    '#1e3a8a');
        ctx.beginPath();
        ctx.arc(cx, cy, breath, 0, Math.PI * 2);
        ctx.fillStyle = sphere;
        ctx.fill();

        // ── Glossy highlight ───────────────────────────────────────────────
        const hl = ctx.createRadialGradient(
            cx - breath * 0.3, cy - breath * 0.33, 0,
            cx - breath * 0.3, cy - breath * 0.33, breath * 0.44
        );
        hl.addColorStop(0, 'rgba(255,255,255,0.46)');
        hl.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(cx, cy, breath, 0, Math.PI * 2);
        ctx.fillStyle = hl;
        ctx.fill();

        // ── Thin ring ─────────────────────────────────────────────────────
        ctx.beginPath();
        ctx.arc(cx, cy, breath + 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(147,197,253,${playing ? 0.35 + beat * 0.25 : 0.12})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        animRef.current = requestAnimationFrame(draw);
    }, []);

    // Start animation loop when component mounts (even before audio plays)
    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animRef.current);
    }, [draw]);

    // Tear down AudioContext on URL change
    useEffect(() => {
        return () => {
            audioCtxRef.current?.close();
            audioCtxRef.current = null;
            analyserRef.current = null;
        };
    }, [audioUrl]);

    const initAnalyser = useCallback(() => {
        if (analyserRef.current) { audioCtxRef.current?.resume(); return; }
        if (!audioRef.current) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 128;
            analyser.smoothingTimeConstant = 0.82;
            const src = ctx.createMediaElementSource(audioRef.current);
            src.connect(analyser);
            analyser.connect(ctx.destination);
            ctx.resume();
            audioCtxRef.current = ctx;
            analyserRef.current = analyser;
        } catch {
            // Fallback: time-based animation still runs
        }
    }, []);

    if (!audioUrl) return null;

    return (
        <div className="av-wrapper">
            <canvas ref={canvasRef} className="av-canvas-2d" />

            <div className="av-status">
                <span className={`av-dot ${isPlaying ? 'av-dot--playing' : ''}`} />
                <span className="av-label">{isPlaying ? 'Playing…' : 'Ready'}</span>
            </div>

            <div className="av-audio-row">
                <audio
                    ref={audioRef}
                    key={audioUrl}
                    src={audioUrl}
                    controls
                    autoPlay={autoPlay}
                    onPlay={() => { initAnalyser(); setIsPlaying(true); }}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    className="av-audio"
                />
            </div>
        </div>
    );
}
