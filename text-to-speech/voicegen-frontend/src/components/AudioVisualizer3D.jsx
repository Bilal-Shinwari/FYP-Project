import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const VisualizerMesh = ({ analyser, isPlaying }) => {
  const meshRef = useRef();
  const materialRef = useRef();
  const dataArray = useRef(null);

  useEffect(() => {
    if (analyser) {
      const bufferLength = analyser.frequencyBinCount;
      dataArray.current = new Uint8Array(bufferLength);
    }
  }, [analyser]);

  useFrame((state) => {
    if (analyser && dataArray.current && isPlaying) {
      analyser.getByteFrequencyData(dataArray.current);
      
      // Calculate average frequency for scale/intensity
      let sum = 0;
      for (let i = 0; i < dataArray.current.length; i++) {
        sum += dataArray.current[i];
      }
      const average = sum / dataArray.current.length;
      
      // Map average (0-255) to a scale
      const scale = 1 + (average / 255) * 0.6;
      
      if (meshRef.current) {
        // Smooth scaling
        meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.15);
      }
      
      if (materialRef.current) {
        // Change distortion based on sound
        materialRef.current.distort = THREE.MathUtils.lerp(materialRef.current.distort, 0.2 + (average / 255) * 0.8, 0.1);
        // Change speed based on sound
        materialRef.current.speed = THREE.MathUtils.lerp(materialRef.current.speed, 1 + (average / 255) * 4, 0.1);
      }
    } else {
        // Return to rest state smoothly
        if (meshRef.current) meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.05);
        if (materialRef.current) {
             materialRef.current.distort = THREE.MathUtils.lerp(materialRef.current.distort, 0.2, 0.05);
             materialRef.current.speed = THREE.MathUtils.lerp(materialRef.current.speed, 1, 0.05);
        }
    }
  });

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]}>
      <MeshDistortMaterial
        ref={materialRef}
        color="#3b82f6" // Navy Light
        emissive="#1e3a8a" // Navy Primary
        emissiveIntensity={0.8}
        roughness={0.2}
        metalness={0.8}
        distort={0.2}
        speed={1}
      />
    </Sphere>
  );
};

export default function AudioVisualizer3D({ audioUrl, autoPlay = true }) {
  const [analyser, setAnalyser] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    // Setup Audio Context once
    if (audioRef.current && !audioCtxRef.current) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 256;
        
        const source = audioCtx.createMediaElementSource(audioRef.current);
        source.connect(analyserNode);
        analyserNode.connect(audioCtx.destination);
        
        audioCtxRef.current = audioCtx;
        setAnalyser(analyserNode);
      } catch (e) {
        console.error("Audio Context setup failed:", e);
      }
    }

    return () => {
      // Cleanup
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(console.error);
        audioCtxRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
     if (audioUrl && autoPlay && audioRef.current) {
        audioRef.current.play().catch(e => console.log("Auto-play prevented", e));
     }
  }, [audioUrl, autoPlay]);

  if (!audioUrl) return null;

  return (
    <div className="audio-visualizer-container" style={{ width: '100%', height: '300px', borderRadius: '12px', overflow: 'hidden', background: 'var(--navy-dark)', position: 'relative', marginTop: '1rem', boxShadow: 'var(--shadow-lg)' }}>
      <Canvas camera={{ position: [0, 0, 3] }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} color="#60a5fa" intensity={2} />
        <VisualizerMesh analyser={analyser} isPlaying={isPlaying} />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
      </Canvas>
      
      <div className="audio-controls-overlay" style={{ position: 'absolute', bottom: '15px', left: '0', right: '0', display: 'flex', justifyContent: 'center' }}>
          <audio 
            ref={audioRef} 
            src={audioUrl} 
            controls 
            onPlay={() => {
                setIsPlaying(true);
                if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
                    audioCtxRef.current.resume();
                }
            }}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            style={{ width: '80%', opacity: 0.9, borderRadius: '8px' }}
            crossOrigin="anonymous"
          />
      </div>
    </div>
  );
}
