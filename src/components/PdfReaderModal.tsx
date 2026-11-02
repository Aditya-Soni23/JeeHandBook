import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateLicensedHandbookPdf } from '../services/pdfService';
import { firebaseService } from '../services/firebaseService';
import { 
  X, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Search, 
  ShieldCheck, 
  Lock,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { INITIAL_CHAPTERS } from '../config/constants';

interface PdfReaderModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PdfReaderModal: React.FC<PdfReaderModalProps> = ({ orderId, isOpen, onClose }) => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeSubject, setActiveSubject] = useState<'Physics' | 'Chemistry' | 'Mathematics'>('Physics');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);

  if (!isOpen || !user) return null;

  const handleDownloadLicensedPdf = async () => {
    await firebaseService.recordDownload(user.uid);
    const doc = generateLicensedHandbookPdf(user.name, user.email, orderId);
    doc.save(`diamond-jee-handbook-licensed-${orderId}.pdf`);
  };

  const watermarkString = `LICENSED TO: ${user.name.toUpperCase()} (${user.email}) • ORDER: ${orderId} • DO NOT DISTRIBUTE`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[95vh] bg-[#FAFAF8] rounded-2xl shadow-2xl border border-gray-300 overflow-hidden flex flex-col">
        {/* Top toolbar */}
        <div className="px-5 py-3 bg-[#171717] text-white flex items-center justify-between gap-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-black">
              ◆
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-tight">DIAMOND JEE HANDBOOK</span>
                <span className="text-xs text-blue-400 font-semibold">(289 Pages Full Edition)</span>
              </div>
              <p className="text-[10px] text-gray-400 truncate max-w-xs sm:max-w-md">
                {watermarkString}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 bg-gray-800 px-2 py-1 rounded-lg text-xs text-gray-300">
              <button 
                onClick={() => setZoomLevel(Math.max(80, zoomLevel - 10))}
                className="p-1 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-1">{zoomLevel}%</span>
              <button 
                onClick={() => setZoomLevel(Math.min(130, zoomLevel + 10))}
                className="p-1 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleDownloadLicensedPdf}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download Watermarked PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reader Body: Sidebar + Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Table of contents sidebar */}
          <div className="w-72 bg-white border-r border-gray-200 hidden md:flex flex-col">
            <div className="p-3 border-b border-gray-200 space-y-2">
              <div className="flex rounded-lg bg-gray-100 p-0.5 text-[11px] font-semibold">
                {(['Physics', 'Chemistry', 'Mathematics'] as const).map(subj => (
                  <button
                    key={subj}
                    onClick={() => setActiveSubject(subj)}
                    className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                      activeSubject === subj ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {subj}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter chapters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
              {INITIAL_CHAPTERS.find(s => s.subject === activeSubject)?.chapters
                .filter(ch => ch.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((ch, idx) => (
                  <button
                    key={ch.num}
                    onClick={() => setCurrentPage(idx * 24 + 1)}
                    className="w-full text-left p-2 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors flex items-start gap-2 group cursor-pointer"
                  >
                    <span className="font-mono text-[10px] text-blue-600 font-bold shrink-0 mt-0.5">
                      {ch.num}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate group-hover:text-blue-600">
                        {ch.title}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {ch.pages}
                      </p>
                    </div>
                  </button>
                ))}
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-200 text-[11px] text-gray-500 flex items-center justify-between">
              <span>All 289 Pages Unlocked</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </div>

          {/* Viewer Page Canvas */}
          <div className="flex-1 bg-[#EAEAEA] p-4 sm:p-6 overflow-y-auto flex flex-col items-center justify-start">
            <div 
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              className="w-full max-w-2xl bg-white rounded-xl shadow-lg border border-gray-300 p-8 sm:p-12 relative transition-transform duration-150 min-h-[750px] flex flex-col justify-between"
            >
              {/* Dynamic Security Watermark across the document */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-5 select-none">
                <span className="text-4xl font-extrabold text-black rotate-[-30deg] tracking-wider whitespace-nowrap">
                  {watermarkString}
                </span>
              </div>

              <div>
                {/* Header line on page */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-3 text-xs text-gray-500">
                  <span className="font-bold text-gray-900 tracking-wider">DIAMOND JEE HANDBOOK</span>
                  <span className="font-mono text-[11px]">PAGE {currentPage} OF 289</span>
                </div>

                {/* Page Content Rendering */}
                <div className="mt-8 space-y-6">
                  <div>
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest block mb-1">
                      {activeSubject.toUpperCase()} • CHAPTER {String(Math.ceil(currentPage / 24)).padStart(2, '0')}
                    </span>
                    <h2 className="text-xl font-bold text-gray-900">
                      {activeSubject === 'Physics' && "Rigid Body Dynamics & Momentum Invariants"}
                      {activeSubject === 'Chemistry' && "Thermodynamic Equilibrium & Gibbs Free Energy"}
                      {activeSubject === 'Mathematics' && "High-Yield Calculus, Conics & Leibnitz Integrals"}
                    </h2>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <p className="font-semibold text-xs text-gray-900">
                      1. Formula & Governing Differential Equation:
                    </p>
                    <div className="p-3 bg-white rounded-lg border border-gray-200 font-mono text-center text-sm font-bold text-blue-700">
                      {activeSubject === 'Physics' && "τ_net = I · α = dL/dt  |  E_total = (1/2) M v_cm² + (1/2) I_cm ω²"}
                      {activeSubject === 'Chemistry' && "ΔG° = - R T ln(K_eq)  |  (∂G/∂T)_P = -S  |  ΔG = ΔH - TΔS"}
                      {activeSubject === 'Mathematics' && "d/dx ∫[u(x) to v(x)] f(t)dt = f(v(x)) v'(x) - f(u(x)) u'(x)"}
                    </div>
                    <p className="text-[11.5px] text-gray-600 leading-relaxed">
                      This chapter consolidates all standard equations, boundary traps, and examination shortcuts 
                      derived from past 15 years of JEE Advanced and Main papers.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="border border-gray-200 rounded-lg p-3 space-y-1 bg-white">
                      <span className="font-bold text-gray-900">Edge Case Condition:</span>
                      <p className="text-gray-600 text-[11px]">
                        Verify if non-inertial pseudo force generates torque about the selected pivot point before applying angular conservation.
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3 space-y-1 bg-white">
                      <span className="font-bold text-gray-900">IIT-JEE Trap Avoidance:</span>
                      <p className="text-gray-600 text-[11px]">
                        Never equate normal contact force to mg · cos θ on a curved surface undergoing circular motion; include centripetal component!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom footer of page */}
              <div className="mt-12 pt-4 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-400">
                <span>Vertex Academic Publishing • 2026 Edition</span>
                <span>Licensed to: {user.name} ({user.email})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Paging bar */}
        <div className="px-6 py-2.5 bg-white border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-gray-900">
              Page <span className="font-mono">{currentPage}</span> / 289
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(289, currentPage + 1))}
              disabled={currentPage >= 289}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-[11px] text-gray-500">
              Protected PDF Viewer • Access strictly granted to verified buyers
            </span>
            <button
              onClick={handleDownloadLicensedPdf}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download My Copy (.pdf)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
