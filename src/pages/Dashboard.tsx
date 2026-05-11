import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, FileImage, ShieldCheck, PieChart, Activity, ChevronRight, Loader2, Camera, User, Download } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { analyzeRetinalImage } from '@/lib/ai';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import CameraCapture from '@/components/CameraCapture';
import { jsPDF } from 'jspdf';

export default function Dashboard() {
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [patientName, setPatientName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generatePatientId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `IBSAR-${year}-${random}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!image || !user) return;
    setIsUploading(true);
    setAnalysisResult(null);

    try {
      const patientId = generatePatientId();
      // 1. AI Analysis (FastAPI)
      const result = await analyzeRetinalImage(image, patientName, patientId);
      
      // Construct analysis state object
      const processedImageUrl = result.gradcam_image || result.processedImage;
      const rawPrediction = result.prediction || result.diagnosis;
      const predictionStr = typeof rawPrediction === 'object' ? rawPrediction.label : (rawPrediction || "Healthy");
      
      const analysisData = {
        ...result,
        patientName: patientName || "Anonymous Patient",
        patientId,
        prediction: predictionStr,
        confidence: result.confidence ? Number(typeof result.confidence === 'object' ? result.confidence.confidence : result.confidence) : 0,
        report: result.report || `The AI model detected signs of ${predictionStr}.`,
        recommendation: result.recommendation || "Please consult with a medical professional for a complete diagnosis.",
        processedImageUrl: processedImageUrl?.startsWith('data:') ? processedImageUrl : (processedImageUrl ? `data:image/jpeg;base64,${processedImageUrl}` : null),
        originalImage: image
      };

      // 2. UPDATE UI IMMEDIATELY
      setAnalysisResult(analysisData);

      // 3. FIRESTORE & STORAGE SAVE (Background/Independent)
      try {
        let originalURL = "";
        let processedFinalURL = "";

        const originalRef = ref(storage, `scans/${user.uid}/${Date.now()}_original.jpg`);
        await uploadString(originalRef, image, 'data_url');
        originalURL = await getDownloadURL(originalRef);

        if (analysisData.processedImageUrl) {
          const processedRef = ref(storage, `scans/${user.uid}/${Date.now()}_processed.jpg`);
          await uploadString(processedRef, analysisData.processedImageUrl, 'data_url');
          processedFinalURL = await getDownloadURL(processedRef);
        }

        await addDoc(collection(db, 'scans'), {
          userId: user.uid,
          patientName: analysisData.patientName,
          patientId: analysisData.patientId,
          imageUrl: originalURL,
          gradcamImage: processedFinalURL,
          diagnosis: analysisData.prediction,
          confidence: analysisData.confidence,
          medicalReport: analysisData.report,
          probabilities: result.probabilities || null,
          detected_diseases: result.detected_diseases || null,
          createdAt: serverTimestamp(),
        });
      } catch (firestoreError) {
       console.error("FULL FIREBASE ERROR:", firestoreError);

       alert(JSON.stringify(firestoreError));
      }
    } catch (apiError) {
      console.error("FastAPI Analysis Error:", apiError);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!analysisResult) return;
    setIsGeneratingPDF(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const whiteSpace = 20;
      let y = whiteSpace;

      // Header Banner
      pdf.setFillColor(10, 15, 30);
      pdf.rect(0, 0, 210, 40, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(26);
      pdf.setFont('helvetica', 'bold');
      pdf.text('IBSAR CLINICAL REPORT', whiteSpace, 25);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Medical Intelligence Diagnostic Platform - Retinal Analysis', whiteSpace, 33);
      
      y = 55;
      
      // Patient and Report Info
      pdf.setTextColor(40, 40, 40);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Investigation Data', whiteSpace, y);
      y += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Patient Identity: ${analysisResult.patientName}`, whiteSpace, y);
      pdf.text(`Date of Analysis: ${new Date().toLocaleString()}`, 120, y);
      y += 7;
      pdf.text(`System ID: ${analysisResult.patientId}`, whiteSpace, y);
      pdf.text(`Confidence Index: ${(analysisResult.confidence * 100).toFixed(2)}%`, 120, y);
      y += 15;

      // Diagnosis High-Impact Box
      pdf.setFillColor(240, 246, 255);
      pdf.rect(whiteSpace - 5, y - 5, 180, 25, 'F');
      pdf.setDrawColor(56, 189, 248);
      pdf.setLineWidth(0.5);
      pdf.rect(whiteSpace - 5, y - 5, 180, 25, 'D');
      
      pdf.setTextColor(30, 60, 114);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Neural Diagnosis Outcome:', whiteSpace + 2, y + 4);
      
      pdf.setTextColor(56, 189, 248);
      pdf.setFontSize(16);
      pdf.text(analysisResult.prediction, whiteSpace + 2, y + 14);
      
      y += 40;

      // Images Section
      pdf.setTextColor(40, 40, 40);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Visual Documentation', whiteSpace, y);
      y += 8;

      const imgWidth = 85;
      const imgHeight = 65;
      
      // Original Fundus
      try {
        pdf.addImage(analysisResult.originalImage, 'JPEG', whiteSpace, y, imgWidth, imgHeight);
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        pdf.text('Acquired Source Data', whiteSpace, y + imgHeight + 5);
      } catch (e) { console.error("PDF original image failed", e); }

      // GradCAM Heatmap
      if (analysisResult.processedImageUrl) {
        try {
          pdf.addImage(analysisResult.processedImageUrl, 'JPEG', whiteSpace + imgWidth + 5, y, imgWidth, imgHeight);
          pdf.text('Neural Attention Map', whiteSpace + imgWidth + 5, y + imgHeight + 5);
        } catch (e) { console.error("PDF GradCAM image failed", e); }
      }
      
      y += imgHeight + 25;

      // Analysis Section
      pdf.setTextColor(40, 40, 40);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AI Findings Analysis', whiteSpace, y);
      y += 10;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const splitReport = pdf.splitTextToSize(analysisResult.report, 170);
      pdf.text(splitReport, whiteSpace, y);
      y += (splitReport.length * 6) + 15;

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Clinical Protocol Recommendations', whiteSpace, y);
      y += 10;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const splitRec = pdf.splitTextToSize(analysisResult.recommendation, 170);
      pdf.text(splitRec, whiteSpace, y);
      
      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Confidential - Generated by IBSAR AI Diagnostics. Not a substitute for professional medical advice.', 105, 285, { align: 'center' });
      pdf.text('Page 1 of 1', 200, 285, { align: 'right' });

      pdf.save(`IBSAR_REPORT_${analysisResult.patientId}.pdf`);
    } catch (error) {
      console.error("PDF Export error:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const reset = () => {
  setIsUploading(false);
  setIsGeneratingPDF(false);

  setImage(null);
  setPatientName('');
  setAnalysisResult(null);
 };

  return (
<div className="w-full min-h-screen px-2 sm:px-4 md:px-8 xl:px-12 2xl:px-20 py-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="text-center space-y-3 py-6">
        <h2 className="text-4xl sm:text-5xl font-black font-display text-white italic">IBSAR <span className="text-glow">Terminal</span></h2>
        <p className="text-white/40 leading-relaxed max-w-2xl mx-auto font-medium text-sm sm:text-base">
          Advanced Retinal Imaging Intelligence. Centered Clinical Workflow with Neural Attention Mapping for Professional Diagnostics.
        </p>
      </header>

      <div className="max-w-3xl mx-auto w-full space-y-8">
        {/* Row 1: Patient Information */}
        {!analysisResult && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card glow-border w-full max-w-none p-6 md:p-10 xl:p-14 space-y-10 rounded-[32px] relative overflow-hidden"
          >
            <div className="flex items-center gap-4 border-b border-white/5 pb-6">
              <div className="w-12 h-12 rounded-2xl bg-glow/10 flex items-center justify-center border border-glow/20 shadow-glow-sm">
                <User className="w-6 h-6 text-glow" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white italic">Patient Identity</h3>
                <p className="text-xs text-white/30 font-bold">Session Intake Information</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] text-white/40 block font-black ml-1">Legal Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-glow/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-glow transition-all" />
                  <input 
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter identifying name for the report..."
                    className="w-full bg-navy border border-white/10 rounded-2xl py-5 pl-14 pr-6 focus:glow-border focus:outline-none transition-all placeholder:text-white/10 text-white text-lg font-bold relative z-10"
                  />
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Row 2: Scan Acquisition */}
        {!analysisResult && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card glow-border p-6 sm:p-10 space-y-8 rounded-[32px] relative overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-glow/10 flex items-center justify-center border border-glow/20 shadow-glow-sm">
                  <Upload className="w-6 h-6 text-glow" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white italic">Scan Input</h3>
                  <p className="text-xs text-white/40 font-bold">Fundus Source Acquisition</p>
                </div>
              </div>
              {image && (
                <button 
                  onClick={reset}
                  className="text-white/40 hover:text-white transition-colors flex items-center gap-2 text-xs font-black bg-white/5 px-4 py-2 rounded-xl border border-white/10"
                >
                  <X className="w-4 h-4" /> Reset Source
                </button>
              )}
            </div>

            {!image ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative h-56 border-2 border-dashed border-white/10 rounded-[32px] flex flex-col items-center justify-center gap-5 hover:border-glow/40 hover:bg-glow/5 transition-all outline-none overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-glow/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <div className="w-16 h-16 rounded-[22px] bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-glow/20 transition-all border border-white/5 shadow-2xl">
                    <FileImage className="w-8 h-8 text-white/40 group-hover:text-glow" />
                  </div>
                  <div className="text-center relative z-10 px-4">
                    <h4 className="font-black text-base tracking-tight text-white italic">Static Upload</h4>
                    <p className="text-white/20 text-[10px] font-black mt-1">Acquire Local Fundus Scan</p>
                  </div>
                </button>

                <button 
                  onClick={() => setShowCamera(true)}
                  className="group relative h-56 border-2 border-dashed border-white/10 rounded-[32px] flex flex-col items-center justify-center gap-5 hover:border-glow/40 hover:bg-glow/5 transition-all outline-none overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-glow/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-16 h-16 rounded-[22px] bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-glow/20 transition-all border border-white/5 shadow-2xl">
                    <Camera className="w-8 h-8 text-white/40 group-hover:text-glow" />
                  </div>
                  <div className="text-center relative z-10 px-4">
                    <h4 className="font-black text-base tracking-tight text-white italic">Optical Feed</h4>
                    <p className="text-white/20 text-[10px] font-black mt-1">Direct Imaging Interface</p>
                  </div>
                </button>
              </div>
            ) : (
              <div className="space-y-10">
                 <div className="relative rounded-[32px] overflow-hidden border border-white/10 bg-navy-dark shadow-2xl group">
                    <img src={image || undefined} alt="Retinal upload" className="w-full object-contain max-h-[500px] transition-transform duration-1000 group-hover:scale-105" />
                    <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-navy to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                       <p className="text-xs font-black text-glow/70">Acquisition Ready</p>
                    </div>
                    <div className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-navy/90 backdrop-blur-xl text-[10px] font-black text-glow rounded-full border border-glow/20 shadow-2xl">
                       <div className="w-2 h-2 rounded-full bg-glow animate-pulse" /> Source Lock
                    </div>
                 </div>
                 
                 {!analysisResult && !isUploading && (
                    <motion.button 
                      whileHover={{ scale: 1.01, y: -2 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleAnalyze()}
                      disabled={!patientName}
                      className="btn-primary w-full flex items-center justify-center gap-4 py-6 rounded-[24px] text-xl font-black shadow-[0_25px_50px_-12px_rgba(56,189,248,0.4)] disabled:opacity-30 disabled:cursor-not-allowed group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                      {patientName ? 'Initiate Neural Analysis' : 'Identity Requirement Missing'}
                      <Activity className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                    </motion.button>
                 )}
              </div>
            )}

            <AnimatePresence>
              {isUploading && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-navy-dark/95 backdrop-blur-3xl rounded-[32px] p-16 flex flex-col items-center justify-center space-y-8 border border-white/10 shadow-2xl absolute inset-0 z-50 m-6 sm:m-10"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-glow/30 rounded-full blur-[60px] animate-pulse" />
                    <div className="w-24 h-24 rounded-full border-2 border-glow/20 flex items-center justify-center">
                      <Loader2 className="w-12 h-12 text-glow animate-spin relative z-10" />
                    </div>
                  </div>
                  <div className="text-center space-y-3">
                    <h4 className="text-3xl font-black text-white italic">Processing Core</h4>
                    <p className="text-sm text-glow/60 font-mono animate-pulse">Running Vision Transformers...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {/* Row 3: Investigation Results (Vertical Workflow) */}
        <AnimatePresence mode="wait">
          {analysisResult && (
            <motion.div 
              key="result-v"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10 pb-20"
            >
              {/* Primary Report Container */}
              <div className="glass-card glow-border p-8 sm:p-12 border-glow/40 shadow-[0_0_80px_rgba(56,189,248,0.2)] rounded-[48px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-glow/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px] pointer-events-none" />
                
                {/* Workflow Card Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-8 border-b border-white/10 pb-10">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[28px] bg-glow flex items-center justify-center text-navy shadow-[0_0_30px_rgba(56,189,248,0.6)]">
                      <ShieldCheck className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-4xl font-black text-white italic">Diagnostic Brief</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-glow font-black font-mono px-2 py-0.5 bg-glow/10 rounded-md border border-glow/20 truncate max-w-[200px]">{analysisResult.patientId}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-[10px] text-white/30 font-bold">Medical Grade AI</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3 self-end md:self-auto">
                    <div className="flex items-center gap-2 text-[10px] font-black text-white/20">
                       Investigation Timestamp ::
                       <span className="text-white/40">{new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-black text-glow">System Stable</div>
                  </div>
                </div>

                <div className="space-y-12">
                  {/* Confidence Monitor */}
                  <div className="bg-slate-900/60 border border-white/5 rounded-[36px] p-8 sm:p-10 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-glow/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 relative z-10">
                      <div>
                        <p className="text-sm font-black text-slate-500 mb-2">Neural Integrity Index</p>
                        <h5 className="text-2xl font-black text-white italic">Investigation Quality Verified</h5>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-500 mb-1 italic">Probability</p>
                        <p className="text-6xl font-black text-glow leading-none">{(analysisResult.confidence * 100).toFixed(1)}<span className="text-2xl ml-1">%</span></p>
                      </div>
                    </div>
                    <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden p-1 border border-white/5 relative z-10">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${analysisResult.confidence * 100}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="h-full bg-gradient-to-r from-glow/60 to-glow rounded-full shadow-[0_0_20px_rgba(56,189,248,0.5)]"
                      />
                    </div>
                  </div>

                  {/* Diagnosis Large Section */}
                  <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white/5 border border-white/10 rounded-[40px] p-10 space-y-4 text-center relative overflow-hidden">
                       <div className="absolute inset-0 bg-mesh opacity-10" />
                       <p className="text-xs font-black text-glow relative z-10">Classification Outcome</p>
                       <h4 className="text-5xl sm:text-7xl font-black text-white leading-tight tracking-tight relative z-10">
                        {typeof analysisResult.prediction === 'object' ? analysisResult.prediction.label : analysisResult.prediction}
                       </h4>
                       
                       {analysisResult.detected_diseases && analysisResult.detected_diseases.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-3 pt-6 relative z-10">
                            {analysisResult.detected_diseases.map((d: any, idx: number) => (
                              <span key={idx} className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black text-white shadow-xl">
                                {typeof d === 'object' ? d.label || JSON.stringify(d) : d}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Visual Analysis Grid */}
                  <div className="space-y-10 pt-12 border-t border-white/5">
                     <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-white/30 text-center">Visual Verification Layer</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                           {/* Original */}
                           <div className="space-y-5">
                              <div className="flex items-center justify-between px-4">
                                 <h5 className="text-[10px] font-black text-white/50">Retinal Fundus (Raw)</h5>
                                 <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                    <span className="text-[9px] font-bold text-white/30">Layer 01</span>
                                 </div>
                              </div>
                              <div className="relative rounded-[32px] overflow-hidden border border-white/10 bg-navy-dark shadow-2xl group cursor-zoom-in">
                                 <img src={analysisResult.originalImage || undefined} alt="Raw retinal scan" className="w-full object-contain max-h-[700px] transition-transform duration-1000 group-hover:scale-110" />
                                 <div className="absolute inset-0 bg-navy/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                           </div>

                           {/* Heatmap */}
                           {analysisResult.processedImageUrl && (
                             <div className="space-y-5">
                                <div className="flex items-center justify-between px-4">
                                   <h5 className="text-[10px] font-black text-glow/70">Attention Gradient Mapping</h5>
                                   <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-glow animate-pulse" />
                                      <span className="text-[9px] font-bold text-glow/40">Layer Vision</span>
                                   </div>
                                </div>
                                <div className="relative rounded-[32px] overflow-hidden border border-glow/30 bg-navy-dark shadow-[0_0_50px_rgba(56,189,248,0.1)] group cursor-zoom-in">
                                   <img src={analysisResult.processedImageUrl || undefined} alt="Attention Heatmap" className="w-full object-contain max-h-[700px] transition-transform duration-1000 group-hover:scale-110" />
                                   <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-navy to-transparent pointer-events-none text-center">
                                      <span className="text-[9px] font-black text-white/60">Grad-CAM Model Overlay</span>
                                   </div>
                                </div>
                             </div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Textual Insights */}
                  <div className="grid grid-cols-1 gap-12 pt-12 border-t border-white/5">
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-white/30 px-4">Diagnostic Findings Narrative</h4>
                      <div className="bg-slate-900/40 rounded-[32px] p-10 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-2 h-full bg-glow/40" />
                        <p className="text-xl sm:text-2xl text-white/80 leading-relaxed font-bold italic tracking-tight">
                          "{analysisResult.report}"
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-white/30 px-4">Clinical Management Protocol</h4>
                      <div className="bg-glow/5 border border-glow/10 rounded-[32px] p-10 flex flex-col sm:flex-row gap-8 items-center bg-mesh relative">
                        <div className="w-20 h-20 rounded-[28px] bg-glow/20 flex items-center justify-center shrink-0 border border-glow/30 shadow-glow-sm">
                          <Activity className="w-10 h-10 text-glow" />
                        </div>
                        <p className="text-xl text-white font-black leading-snug tracking-tight">{analysisResult.recommendation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Report Export */}
                  <div className="pt-16 flex flex-col md:flex-row items-center gap-6">
                     <motion.button 
                       whileHover={{ scale: 1.02 }}
                       whileTap={{ scale: 0.98 }}
                       onClick={handleDownloadPDF}
                       disabled={isGeneratingPDF}
                       className="w-full flex-1 bg-glow text-navy py-6 rounded-[28px] flex items-center justify-center gap-4 font-black text-sm shadow-[0_20px_40px_rgba(56,189,248,0.3)] disabled:opacity-50 transition-all group"
                     >
                       {isGeneratingPDF ? (
                         <>Compiling Report <Loader2 className="w-5 h-5 animate-spin" /></>
                       ) : (
                         <>
                           <Download className="w-6 h-6 group-hover:translate-y-1 transition-transform" /> 
                           Export Clinical Documentation
                         </>
                       )}
                     </motion.button>
                     <button 
                       onClick={reset}
                       className="w-full md:w-auto px-12 py-6 rounded-[28px] bg-white/5 hover:bg-white/10 text-white/60 font-black text-sm transition-all border border-white/10"
                     >
                       Close Investigation
                     </button>
                  </div>
                </div>
              </div>
              
              {/* Patient Meta Footer */}
              <div className="flex flex-wrap justify-center gap-4 text-[10px] font-black text-white/20">
                 <span>Session ID: {analysisResult.patientId}</span>
                 <span className="hidden sm:inline">•</span>
                 <span>Analysis Engine: FastAPI Vision V1</span>
                 <span className="hidden sm:inline">•</span>
                 <span>Identity: {analysisResult.patientName}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showCamera && (
          <CameraCapture 
            onCapture={(capturedImage) => setImage(capturedImage)}
            onClose={() => setShowCamera(false)}
          />
        )}
      </AnimatePresence>

      <style>{`
        .bg-mesh {
          background-image: 
            radial-gradient(at 0% 0%, rgba(56, 189, 248, 0.08) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(56, 189, 248, 0.08) 0px, transparent 50%);
        }
      `}</style>
    </div>
  );
}
