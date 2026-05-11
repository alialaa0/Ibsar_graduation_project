import React, { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { History as HistoryIcon, Search, Calendar, Trash2, X, FileText, Download, ShieldCheck, Activity } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { jsPDF } from 'jspdf';

export default function History() {
  const { user } = useAuth();
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScan, setSelectedScan] = useState<any>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'scans'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        setScans(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'scans');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [user]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this report?')) return;
    try {
      await deleteDoc(doc(db, 'scans', id));
      setScans(scans.filter(s => s.id !== id));
      if (selectedScan?.id === id) setSelectedScan(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `scans/${id}`);
    }
  };

  const handleDownloadPDF = async (scan: any) => {
    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const whiteSpace = 20;
      
      // Minimal header
      pdf.setFillColor(10, 15, 30);
      pdf.rect(0, 0, 210, 30, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('IBSAR ARCHIVED REPORT', whiteSpace, 20);

      pdf.setTextColor(40, 40, 40);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Patient: ${scan.patientName}`, whiteSpace, 45);
      pdf.text(`ID: ${scan.patientId}`, whiteSpace, 50);
      pdf.text(`Date: ${formatDate(scan.createdAt)}`, 130, 45);
      
      pdf.setFillColor(245, 248, 255);
      pdf.rect(whiteSpace - 2, 58, 174, 20, 'F');
      pdf.setTextColor(0, 80, 200);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Diagnosis: ${scan.diagnosis}`, whiteSpace + 5, 71);
      
      let y = 90;

      pdf.setFontSize(14);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Neural Analysis Results', whiteSpace, y);
      y += 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const splitReport = pdf.splitTextToSize(scan.medicalReport || scan.report || "", 170);
      pdf.text(splitReport, whiteSpace, y);
      y += (splitReport.length * 6) + 10;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Clinical Protocol', whiteSpace, y);
      y += 8;
      pdf.setFont('helvetica', 'normal');
      const splitRec = pdf.splitTextToSize(scan.recommendation || "Maintain regular clinical monitor protocols.", 170);
      pdf.text(splitRec, whiteSpace, y);

      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Documentation archived via neural analysis platform secure cloud.', 105, 285, { align: 'center' });

      pdf.save(`IBSAR_ARCHIVE_${scan.patientId}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const filteredScans = scans.filter(s => 
    (s.diagnosis || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.medicalReport || s.report || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.patientName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.patientId || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h2 className="text-4xl font-black font-display text-white italic tracking-tight">Archive <span className="text-glow">Logs</span></h2>
          <p className="text-white/40 text-sm font-medium tracking-wide">Historical timeline of your neural retinal diagnostics</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              type="text" 
              placeholder="Search patient, ID, or result..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:glow-border focus:outline-none transition-all text-sm w-full font-medium"
            />
          </div>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="glass-card h-96 animate-pulse opacity-50 rounded-[40px] border-white/5" />
          ))}
        </div>
      ) : filteredScans.length === 0 ? (
        <div className="glass-card p-24 text-center space-y-6 rounded-[48px] border-dashed border-white/5">
          <div className="w-20 h-20 rounded-full bg-white/5 mx-auto flex items-center justify-center border border-white/10">
            <HistoryIcon className="w-10 h-10 text-white/20" />
          </div>
          <div className="space-y-2">
             <h3 className="text-2xl font-black text-white">Archives Vacant</h3>
             <p className="text-white/40 max-w-sm mx-auto">No diagnostic records detected in the neural database for this operator.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
          <AnimatePresence mode="popLayout">
            {filteredScans.map((scan) => (
              <motion.div
                layout
                key={scan.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setSelectedScan(scan)}
                className="glass-card group hover:glow-border transition-all flex flex-col pt-0 overflow-hidden border-white/5 cursor-pointer rounded-[40px] hover:shadow-[0_30px_60px_rgba(0,0,0,0.5)] hover:-translate-y-1"
              >
                <div className="aspect-[16/10] overflow-hidden bg-navy-dark relative border-b border-white/5">
                  <img 
                    src={scan.imageUrl || undefined} 
                    alt={scan.diagnosis} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                  />
                  <div className="absolute top-6 right-6 px-3 py-1.5 bg-navy/90 backdrop-blur-md rounded-xl border border-white/10 text-[10px] font-black text-glow/70">
                    {scan.patientId}
                  </div>
                </div>
                
                <div className="p-8 sm:p-10 flex-grow flex flex-col justify-between space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between font-black text-[9px]">
                        <span className="text-white/20 italic">Investigation Node</span>
                        <div className="flex items-center gap-1.5 text-white/30">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(scan.createdAt)}
                        </div>
                      </div>
                      <h4 className="text-2xl font-black text-white truncate italic tracking-tighter">{scan.patientName || "Anonymous Patient"}</h4>
                    </div>

                    <div className="flex items-center justify-between py-4 border-y border-white/5">
                      <span className="text-glow font-black text-sm italic">
                         {typeof scan.diagnosis === 'object' ? (scan.diagnosis as any).label : scan.diagnosis}
                      </span>
                      <span className="text-[10px] font-black px-3 py-1 bg-glow/10 text-glow border border-glow/20 rounded-full shadow-glow-sm">
                        {(Number(scan.confidence || 0) * 100).toFixed(0)}% Match
                      </span>
                    </div>

                    <p className="text-xs text-white/40 line-clamp-3 leading-relaxed font-medium">
                      {scan.medicalReport || scan.report}
                    </p>
                  </div>

                  <div className="pt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-[10px] font-black text-white/30 group-hover:text-glow transition-all italic">
                      <FileText className="w-4 h-4" /> Reveal Results
                    </div>
                    <button 
                      onClick={(e) => handleDelete(scan.id, e)}
                      className="p-3 text-white/10 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all border border-transparent hover:border-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedScan && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-navy/95 backdrop-blur-3xl overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden border-white/10 rounded-[48px] shadow-[0_0_120px_rgba(56,189,248,0.25)] relative"
            >
              <div className="sticky top-0 z-10 bg-navy/80 backdrop-blur-3xl border-b border-white/5 p-8 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-[18px] bg-glow/10 flex items-center justify-center border border-glow/20 shadow-glow-sm">
                    <ShieldCheck className="w-6 h-6 text-glow" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white italic tracking-tighter">{selectedScan.patientName}</h3>
                    <p className="text-[10px] text-white/30 font-bold font-mono">{selectedScan.patientId}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedScan(null)} className="w-12 h-12 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors text-white/40">
                  <X className="w-7 h-7" />
                </button>
              </div>

              <div className="p-8 sm:p-14 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-white/20 italic">Primary Fundus Data</p>
                    <div className="rounded-[32px] overflow-hidden border border-white/10 bg-navy-dark shadow-2xl group">
                       <img src={selectedScan.imageUrl || undefined} alt="Retinal scan" className="w-full object-contain max-h-[450px]" />
                    </div>
                  </div>
                  { (selectedScan.gradcamImage || selectedScan.processedImageUrl) && (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-glow/40 italic">Neural Attention Focus</p>
                      <div className="rounded-[32px] overflow-hidden border border-glow/20 bg-navy-dark shadow-[0_0_50px_rgba(56,189,248,0.1)] group">
                         <img src={selectedScan.gradcamImage || selectedScan.processedImageUrl || undefined} alt="GradCAM" className="w-full object-contain max-h-[450px]" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-10">
                  <div className="relative p-1 rounded-[40px] bg-gradient-to-br from-glow/20 via-transparent to-white/5">
                    <div className="bg-navy-dark rounded-[39px] p-10 space-y-6 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-80 h-80 bg-glow/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]" />
                       <div className="flex items-center justify-between relative z-10">
                          <p className="text-xs font-black text-glow italic">Investigation Protocol Result</p>
                          <span className="text-[11px] font-black px-4 py-1.5 bg-glow text-navy rounded-lg italic shadow-glow-sm">{(selectedScan.confidence * 100).toFixed(1)}% Confidence</span>
                       </div>
                       <h4 className="text-4xl sm:text-6xl font-black text-white leading-none italic tracking-tighter relative z-10">
                        {typeof selectedScan.diagnosis === 'object' ? selectedScan.diagnosis.label : selectedScan.diagnosis}
                       </h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-6">
                        <h5 className="text-[10px] font-black text-white/20 ml-2">Neural Findings Summary</h5>
                        <div className="bg-white/5 border border-white/5 rounded-[32px] p-10 relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-1.5 h-full bg-glow/30" />
                           <p className="text-xl text-white/70 italic leading-relaxed font-semibold tracking-tight">"{selectedScan.medicalReport || selectedScan.report}"</p>
                        </div>
                     </div>
                     
                     <div className="space-y-6">
                        <h5 className="text-[10px] font-black text-white/20 ml-2">Clinical Recommendations</h5>
                        <div className="bg-glow/5 border border-glow/10 rounded-[32px] p-10 flex gap-8 items-start relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-glow/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                           <div className="w-14 h-14 rounded-2xl bg-glow/20 flex items-center justify-center shrink-0 border border-glow/30 shadow-glow-sm">
                              <Activity className="w-8 h-8 text-glow" />
                           </div>
                           <p className="text-xl text-white font-black leading-snug italic tracking-tight">{selectedScan.recommendation || "Maintain standard clinical oversight protocols."}</p>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 pt-6">
                    <button 
                      onClick={() => handleDownloadPDF(selectedScan)}
                      disabled={isGeneratingPDF}
                      className="w-full flex-1 bg-glow text-navy py-6 rounded-[28px] flex items-center justify-center gap-4 font-black text-sm shadow-[0_25px_50px_-12px_rgba(56,189,248,0.4)] disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99] group"
                    >
                      {isGeneratingPDF ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6 group-hover:translate-y-1 transition-transform" />}
                      Export Archival Documentation
                    </button>
                    <button 
                      onClick={() => setSelectedScan(null)}
                      className="w-full sm:w-auto px-16 py-6 rounded-[28px] bg-white/5 hover:bg-white/10 text-white/40 font-black text-sm transition-all border border-white/10"
                    >
                      Dismiss Case
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" ><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
  )
}
