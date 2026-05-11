import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CameraCaptureProps {
  onCapture: (image: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please ensure you have granted permission.');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setCapturedImage(dataUrl);
        // Stop stream after capture to save battery/resource
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      }
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-navy/95 backdrop-blur-3xl"
    >
      <div className="glass-card glow-border w-full max-w-4xl overflow-hidden relative border-white/10 shadow-[0_0_100px_rgba(56,189,248,0.25)] rounded-[40px]">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-glow/10 flex items-center justify-center border border-glow/20">
                <Camera className="w-5 h-5 text-glow" />
             </div>
             <div>
                <h3 className="font-black text-xl text-white">Imaging Link</h3>
                <p className="text-[10px] text-white/30 font-bold">High Sensitivity Feed</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors text-white/40"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="relative bg-black flex items-center justify-center overflow-hidden aspect-video md:aspect-[16/9]">
          {isLoading && !error && (
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="w-12 h-12 text-glow animate-spin" />
              <p className="text-xs text-white/40 font-black">Initializing Optics...</p>
            </div>
          )}

          {error && (
            <div className="p-8 text-center space-y-4">
              <p className="text-red-400 text-sm">{error}</p>
              <button 
                onClick={startCamera}
                className="btn-primary py-2 px-4 text-xs"
              >
                Retry
              </button>
            </div>
          )}

          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className={`w-full h-full object-contain ${capturedImage || error || isLoading ? 'hidden' : 'block'}`} 
          />
          
          {capturedImage && (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
          )}

          <canvas ref={canvasRef} className="hidden" />

          {/* Overlay elements for a futuristic look */}
          {!capturedImage && !isLoading && !error && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-glow/30" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-glow/30" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-glow/30" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-glow/30" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-glow/20 rounded-full" />
            </div>
          )}
        </div>

        <div className="p-8 bg-navy-dark/80 backdrop-blur-3xl flex items-center justify-center gap-6 border-t border-white/5">
          {!capturedImage ? (
            <button 
              onClick={capture}
              disabled={isLoading || !!error}
              className="w-20 h-20 rounded-full border-4 border-glow/20 p-1 group hover:border-glow transition-all disabled:opacity-50 disabled:grayscale relative"
            >
              <div className="absolute inset-0 bg-glow/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-full h-full rounded-full bg-white group-hover:scale-90 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.4)] relative z-10" />
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-sm">
              <button 
                onClick={retake}
                className="w-full px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-black hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-white/60"
              >
                <RefreshCw className="w-4 h-4" /> Reboot Feed
              </button>
              <button 
                onClick={handleConfirm}
                className="w-full px-8 py-4 rounded-2xl bg-glow text-navy text-xs font-black hover:shadow-glow transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" /> Commit Source
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
