import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ASSETS, 
  BRANDING, 
  FIXED_PRICES, 
  PRODUCT_SPECS, 
  FREE_SAMPLES,
  UPI_SETTINGS,
  CREATION_INFO,
  INITIAL_CHAPTERS
} from '../config/constants';
import { firebaseService } from '../services/firebaseService';
import { downloadSamplePdf } from '../services/pdfService';
import { 
  Check, 
  Download, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  Copy, 
  QrCode, 
  AlertCircle, 
  Star, 
  Lock, 
  MessageSquare, 
  FileText,
  Sparkles,
  Cpu,
  BookOpen,
  Zap,
  Award,
  CheckCircle2,
  Layers,
  Bot,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Order, BindingType } from '../types';

export const HomePage: React.FC = () => {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Price Calculator States
  const [selectedFormat, setSelectedFormat] = useState<'physical' | 'digital'>('physical');
  const [selectedBinding, setSelectedBinding] = useState<BindingType>('softcover');
  const [pinCode, setPinCode] = useState('500081');

  // Checkout Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1); // 1 = Details, 2 = UPI QR & UTR
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [houseAddress, setHouseAddress] = useState('');
  const [city, setCity] = useState('');
  const [orderPin, setOrderPin] = useState('500081');
  const [utrNumber, setUtrNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Sync user details when signed in
  useEffect(() => {
    if (user) {
      if (!customerName && user.name) setCustomerName(user.name);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
    }
  }, [user]);

  // Reviews
  const [reviews, setReviews] = useState<any[]>([]);

  // Calculate price with no discounts
  const currentPrice = selectedFormat === 'digital' 
    ? FIXED_PRICES.digital 
    : (PRODUCT_SPECS.bindings.find(b => b.id === selectedBinding)?.price || FIXED_PRICES.softcover);

  // Delivery check logic
  const isLocalFree = pinCode.startsWith('500') || pinCode.startsWith('501');
  const deliveryEstimate = selectedFormat === 'digital' 
    ? 0 
    : (isLocalFree ? 0 : 50);

  const handleStartOrder = (format: 'digital' | 'physical', binding: BindingType = 'softcover') => {
    setSelectedFormat(format);
    setSelectedBinding(binding);
    setCheckoutStep(1);
    setCheckoutModalOpen(true);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please sign in with Google to complete your order.");
      return;
    }

    if (!customerName.trim()) {
      alert("Please enter your Full Name.");
      return;
    }

    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      alert("Please enter a valid 10-digit mobile number for order verification & WhatsApp updates.");
      return;
    }

    const isDigital = selectedFormat === 'digital';

    if (!isDigital && (!houseAddress.trim() || !city.trim() || !orderPin.trim())) {
      alert("Please enter full delivery address (House/Street, City, PIN Code).");
      return;
    }

    setSubmitting(true);
    try {
      const orderNum = Math.floor(10000 + Math.random() * 90000);
      const newOrderId = `DJH-2026-${orderNum}`;
      const total = isDigital ? FIXED_PRICES.digital : currentPrice + (orderPin.startsWith('500') ? 0 : 50);

      const newOrder: Order = {
        id: newOrderId,
        uid: user.uid,
        customerName: customerName.trim(),
        customerEmail: user.email || '',
        customerPhone: customerPhone.trim(),
        productType: isDigital ? 'digital' : 'physical',
        bindingType: isDigital ? undefined : selectedBinding,
        bindingName: isDigital 
          ? 'Digital Edition (PDF)' 
          : (PRODUCT_SPECS.bindings.find(b => b.id === selectedBinding)?.name || 'Softcover'),
        quantity: 1,
        unitPrice: isDigital ? FIXED_PRICES.digital : currentPrice,
        productPrice: isDigital ? FIXED_PRICES.digital : currentPrice,
        deliveryCharge: isDigital ? 0 : (orderPin.startsWith('500') ? 0 : 50),
        discount: 0,
        totalAmount: total,
        pinCode: isDigital ? undefined : orderPin.trim(),
        shippingAddress: isDigital ? undefined : {
          id: `addr_${Date.now()}`,
          fullName: customerName.trim(),
          phone: customerPhone.trim(),
          houseNumber: houseAddress.trim(),
          street: city.trim(),
          locality: '',
          city: city.trim(),
          state: 'India',
          pinCode: orderPin.trim(),
          isDefault: true
        },
        paymentStatus: 'PAYMENT_PENDING',
        orderStatus: 'PLACED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        auditTrail: [{
          timestamp: new Date().toISOString(),
          action: 'ORDER_PLACED',
          actor: `Customer (${customerName.trim() || user.name})`
        }]
      };

      await firebaseService.createOrder(newOrder);
      setCreatedOrder(newOrder);
      setCheckoutStep(2);
    } catch (err: any) {
      alert("Error initiating order: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdOrder || !utrNumber.trim()) {
      alert("Please enter your 12-digit UTR reference number.");
      return;
    }

    setSubmitting(true);
    try {
      await firebaseService.updateOrder(
        createdOrder.id,
        {
          paymentStatus: 'PAYMENT_VERIFICATION_PENDING',
          utrNumber: utrNumber.trim(),
          paymentSubmittedAt: new Date().toISOString()
        },
        `Customer (${user?.name})`
      );
      setCheckoutModalOpen(false);
      navigate('/dashboard?tab=orders');
    } catch (err: any) {
      alert("Error submitting UTR: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_SETTINGS.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const upiPayUri = `upi://pay?pa=${encodeURIComponent(UPI_SETTINGS.upiId)}&pn=${encodeURIComponent(UPI_SETTINGS.payeeName)}&am=${createdOrder?.totalAmount || currentPrice}&cu=INR&tn=${encodeURIComponent(createdOrder?.id || 'DIAMOND-JEE')}`;

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section id="overview" className="relative overflow-hidden pt-10 sm:pt-16 pb-16 sm:pb-24 border-b border-gray-200/80 bg-gradient-to-b from-blue-50/60 via-[#FAFAF8] to-[#FAFAF8]">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-blue-400/10 via-indigo-400/10 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              {/* Creator & AI Tagline Pill */}
              <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold shadow-xs">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                <span className="font-bold text-[11px] sm:text-xs tracking-tight">
                  Physics Wallah Resources &bull; Enhanced via ChatGPT, Claude, Gemini &amp; Antigravity
                </span>
              </div>

              {/* Headline */}
              <div className="space-y-2">
                <div className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
                  The Master JEE Revision Compendium
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.06]">
                  DIAMOND JEE <br />
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
                    HANDBOOK
                  </span>
                </h1>
              </div>

              {/* Lead Paragraph */}
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-xl">
                The definitive <strong>289-page</strong> revision compendium for JEE Main &amp; Advanced aspirants. 
                Curated from <strong>Physics Wallah</strong> resources and meticulously refined using <strong>ChatGPT, Claude, Gemini, and Google Antigravity</strong> by the author — delivering zero fluff, high-yield formula breakdowns, and tricky IIT traps on heavy 75 GSM paper.
              </p>

              {/* Special Promotion Banner */}
              <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 flex items-center gap-2.5 shadow-xs">
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-extrabold text-[10px] uppercase tracking-wide shrink-0">
                  🎁 BONUS
                </span>
                <span className="text-[11.5px]">
                  <strong>Order any printed edition</strong> and get the <strong>Digital Soft Copy (₹30 value) for FREE</strong> — unlocked in your dashboard after admin verification!
                </span>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-y border-gray-200 text-xs">
                <div className="bg-white/80 p-3 rounded-xl border border-gray-100 shadow-xs">
                  <span className="font-extrabold text-gray-900 block text-sm">289 Pages</span>
                  <span className="text-gray-500 text-[11px]">Physics · Chem · Math</span>
                </div>
                <div className="bg-white/80 p-3 rounded-xl border border-gray-100 shadow-xs">
                  <span className="font-extrabold text-blue-600 block text-sm">₹30 Digital</span>
                  <span className="text-gray-500 text-[11px]">Instant PDF download</span>
                </div>
                <div className="bg-white/80 p-3 rounded-xl border border-gray-100 shadow-xs">
                  <span className="font-extrabold text-gray-900 block text-sm">75 GSM Paper</span>
                  <span className="text-gray-500 text-[11px]">Bleed-proof white</span>
                </div>
                <div className="bg-white/80 p-3 rounded-xl border border-gray-100 shadow-xs">
                  <span className="font-extrabold text-gray-900 block text-sm">Print ₹449+</span>
                  <span className="text-gray-500 text-[11px]">Spiral / Soft / Hard</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => handleStartOrder('digital')}
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer transform active:scale-95"
                >
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Get Digital PDF (Only ₹30)</span>
                </button>

                <button
                  onClick={() => handleStartOrder('physical', 'softcover')}
                  className="px-6 py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer transform active:scale-95"
                >
                  <Truck className="w-4 h-4 text-gray-300" />
                  <span>Order Printed Book (from ₹449)</span>
                </button>

                <a
                  href="#free-samples"
                  className="px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Free Samples</span>
                </a>
              </div>

              {/* Trust Badges */}
              <div className="text-[11.5px] text-gray-500 flex flex-wrap items-center gap-y-2 gap-x-4 pt-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Manual UPI Verification (adityasoni@upi)</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>Speed Post &amp; Express Courier</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Verified 289 Pages</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual with Interactive Badges */}
            <div className="lg:col-span-5 relative flex flex-col items-center">
              <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
                {/* PROMINENT AI IMAGE TAG */}
                <div className="bg-amber-100 text-amber-900 border-b border-amber-200 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 text-center flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>AI GENERATED MOCKUP — ACTUAL PHYSICAL BOOK WILL VARY</span>
                </div>

                <div className="relative">
                  <img
                    src={ASSETS.coverShowcase}
                    alt="DIAMOND JEE HANDBOOK Cover Mockup"
                    className="w-full h-auto object-cover transform group-hover:scale-[1.01] transition-transform duration-300"
                  />
                  {/* Floating badge */}
                  <div className="absolute top-3 right-3 bg-gray-900/90 text-white backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>289 High-Yield Pages</span>
                  </div>
                </div>

                {/* Book Card Bottom Zone */}
                <div className="p-4 bg-white border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-gray-900 block">DIAMOND JEE HANDBOOK</span>
                      <p className="text-[11px] text-gray-500">Physics · Chemistry · Mathematics</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-sm">
                        ₹30 Digital
                      </span>
                      <span className="block text-[10px] text-gray-400 mt-0.5">Print from ₹449</span>
                    </div>
                  </div>

                  {/* Multi-AI & PW Chips */}
                  <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Engineered With:</span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                      PW Resources
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      ChatGPT
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold">
                      Claude
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                      Gemini
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                      Antigravity
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ABOUT THE BOOK & CREATION STORY */}
      <section id="creation-story" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>The Origin &amp; Creation Story</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            How This Handbook Was Made
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-2xl mx-auto">
            Physics Wallah pedagogical foundations combined with cutting-edge multi-AI intelligence, meticulously verified and curated by the creator.
          </p>
        </div>

        {/* Creator Note Callout Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 border border-blue-100 shadow-sm relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" />
                <span>Curated by Author • AI-Enhanced &bull; ₹30 Digital Edition</span>
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                "Built from Physics Wallah materials, perfected using ChatGPT, Claude, Gemini &amp; Antigravity by me."
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                As a JEE aspirant, standard handbooks are either too thick (700+ pages of passive derivations) or too brief (leaving out critical Advanced-level traps). 
                I systematically collected the highest-yield lecture notes and formula frameworks from <strong>Physics Wallah</strong> resources, and ran them through <strong>ChatGPT, Claude, Gemini, and Google Antigravity</strong> to cross-check mathematical consistency, condense repetitive verbiage, highlight trick pitfalls, and structure it into a 289-page ultimate revision handbook.
              </p>
              <p className="text-xs text-gray-500 font-medium">
                To make sure every student in India has equal access to top-tier preparation material, the complete <strong>Digital Edition is priced at just ₹30</strong>, while high-quality printed editions on 75 GSM bleed-proof paper start from ₹449.
              </p>
            </div>

            <div className="md:col-span-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                  ◆
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Aditya Soni</h4>
                  <p className="text-[11px] text-gray-500">Creator &amp; JEE Aspirant</p>
                </div>
              </div>
              <div className="space-y-1.5 text-[11px] text-gray-600 border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between">
                  <span>Source Core:</span>
                  <strong className="text-gray-900">Physics Wallah</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>AI Tools Used:</span>
                  <strong className="text-blue-600">ChatGPT, Claude, Gemini, Antigravity</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Pages:</span>
                  <strong className="text-gray-900">289 Pages (PCM)</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Digital Price:</span>
                  <strong className="text-emerald-600 font-mono font-bold">₹30 Only</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Creation Pillars Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3 flex flex-col justify-between hover:border-blue-300 transition-colors">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Physics Wallah Foundation</h3>
              <p className="text-gray-600 text-[11.5px] leading-relaxed">
                Anchored in the trusted problem-solving frameworks, formulas, and classroom methodologies taught by India's most beloved educators at Physics Wallah.
              </p>
            </div>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded w-fit">
              Core Pedagogy
            </span>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3 flex flex-col justify-between hover:border-blue-300 transition-colors">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Multi-AI Synthesis</h3>
              <p className="text-gray-600 text-[11.5px] leading-relaxed">
                ChatGPT for deep logical trap analysis, Claude for crystal-clear concise wording, Gemini for multi-domain verification, and Antigravity for agentic synthesis.
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded w-fit">
              4× AI Verification
            </span>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3 flex flex-col justify-between hover:border-blue-300 transition-colors">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Human Verification</h3>
              <p className="text-gray-600 text-[11.5px] leading-relaxed">
                Every chapter personally formatted, typeset, and checked page-by-page to ensure 100% exam accuracy and zero AI hallucinations.
              </p>
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded w-fit">
              Aspirant-Verified
            </span>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3 flex flex-col justify-between hover:border-blue-300 transition-colors">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">₹30 Accessible Pricing</h3>
              <p className="text-gray-600 text-[11.5px] leading-relaxed">
                Elite revision shouldn't cost thousands. The 289-page digital edition is kept at just ₹30 so any student in India can easily access it.
              </p>
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded w-fit">
              100% Student-First
            </span>
          </div>
        </div>
      </section>

      {/* 3. BINDINGS & FIXED PRICING */}
      <section id="bindings" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            Fixed Specifications • No Discounts
          </span>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">
            Choose Your Format
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Digital Edition (₹30) provides instant watermarked PDF access. Printed editions are printed on heavy 75 GSM bleed-proof bright paper.
          </p>
        </div>

        {/* Bindings Lineup Image with AI tag */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-xs max-w-4xl mx-auto">
          <div className="bg-amber-100 text-amber-900 border-b border-amber-200 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 text-center">
            ⚠️ AI GENERATED MOCKUP — ACTUAL PHYSICAL BINDINGS MAY VARY
          </div>
          <img
            src={ASSETS.bindingsLineup}
            alt="DIAMOND JEE HANDBOOK Bindings Lineup"
            className="w-full h-64 sm:h-80 object-cover"
          />
        </div>

        {/* 4 Cards (1 Digital + 3 Physical) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Digital */}
          <div className="p-6 rounded-2xl border-2 border-blue-600 bg-gradient-to-b from-blue-50/50 to-white shadow-md flex flex-col justify-between space-y-4 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
              ★ Most Popular • Instant
            </div>

            <div className="pt-2">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                Digital Edition
              </span>
              <h3 className="text-base font-black text-gray-900 mt-1">Complete 289-Page PDF</h3>
              <div className="pt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black text-blue-700 font-mono">₹{FIXED_PRICES.digital}</span>
                <span className="text-xs text-gray-500">one-time payment</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Instant delivery upon manual UPI check.</p>

              <ul className="text-xs text-gray-600 space-y-2 mt-4 pt-3 border-t border-blue-100">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>All 289 Pages in high resolution</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Physics + Chemistry + Math</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Personal security watermark</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Direct PDF download (48.8 MB)</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => handleStartOrder('digital')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              <span>Get Digital PDF (₹30)</span>
            </button>
          </div>

          {/* 3 Physical Bindings */}
          {PRODUCT_SPECS.bindings.map(b => (
            <div key={b.id} className="p-6 rounded-2xl border border-gray-200 bg-white shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Printed Book
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-1">{b.name}</h3>
                <div className="pt-2">
                  <span className="text-3xl font-black text-gray-900 font-mono">₹{b.price}</span>
                  <span className="text-xs text-gray-500 ml-1">fixed price</span>
                </div>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{b.description}</p>
                <ul className="text-xs text-gray-600 space-y-1.5 mt-3 pt-3 border-t border-gray-100">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>289 Pages • A4 Size</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>75 GSM Bleed-Proof</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Thick Colour Cover</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md mt-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>FREE Digital Soft Copy (After Verification)</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => handleStartOrder('physical', b.id as BindingType)}
                className="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Order {b.name}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 3. SIMPLE PRICE & DELIVERY CALCULATOR (NO DISCOUNTS) */}
      <section id="calculator" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-10 shadow-xs space-y-6">
          <div className="space-y-1 border-b border-gray-100 pb-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Fixed Pricing Calculator
            </span>
            <h2 className="text-2xl font-bold text-gray-900">
              Check Book & Delivery Price
            </h2>
            <p className="text-xs text-gray-500">
              Prices are strictly fixed. No discount codes or price markups are applied.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            {/* Left Options */}
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-gray-900 mb-2 uppercase text-[11px]">
                  1. Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('physical')}
                    className={`p-2.5 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                      selectedFormat === 'physical' ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    Printed Book
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('digital')}
                    className={`p-2.5 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                      selectedFormat === 'digital' ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    Digital (₹30)
                  </button>
                </div>
              </div>

              {selectedFormat === 'physical' && (
                <div>
                  <label className="block font-bold text-gray-900 mb-2 uppercase text-[11px]">
                    2. Binding Style
                  </label>
                  <div className="space-y-1.5">
                    {PRODUCT_SPECS.bindings.map(b => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBinding(b.id as BindingType)}
                        className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left cursor-pointer transition-all ${
                          selectedBinding === b.id ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold' : 'border-gray-200 text-gray-700'
                        }`}
                      >
                        <span>{b.name}</span>
                        <span className="font-mono">₹{b.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedFormat === 'physical' && (
                <div>
                  <label className="block font-bold text-gray-900 mb-1.5 uppercase text-[11px]">
                    3. Delivery PIN Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit PIN code"
                    className="w-full p-2.5 bg-[#FAFAF8] border border-gray-300 rounded-xl font-mono text-xs focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    {isLocalFree ? '✓ Local free delivery available' : 'Standard courier shipping: ₹50'}
                  </p>
                </div>
              )}
            </div>

            {/* Right Summary */}
            <div className="p-5 bg-[#FAFAF8] rounded-2xl border border-gray-200 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wider block border-b border-gray-200 pb-2">
                  Total Payable
                </span>
                <div className="flex justify-between text-gray-600">
                  <span>Product Price:</span>
                  <span className="font-mono font-bold text-gray-900">₹{currentPrice}</span>
                </div>
                {selectedFormat === 'physical' && (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery Charge:</span>
                      <span className="font-mono font-bold text-gray-900">
                        {isLocalFree ? 'FREE' : `₹${deliveryEstimate}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-1 rounded">
                      <span>Digital Soft Copy:</span>
                      <span className="font-bold">FREE (After Verification)</span>
                    </div>
                  </>
                )}
                <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-bold text-gray-900">
                  <span>Grand Total:</span>
                  <span className="font-mono text-xl text-blue-600 font-black">
                    ₹{currentPrice + (selectedFormat === 'physical' ? deliveryEstimate : 0)}
                  </span>
                </div>
              </div>

              {/* Exact Condition Notice */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 space-y-1">
                <strong>Delivery Policy Notice:</strong>
                <p>
                  * Price and delivery charges may vary if your delivery location does not come under free delivery policies. All prices are fixed without discounts.
                </p>
              </div>

              <button
                onClick={() => handleStartOrder(selectedFormat, selectedBinding)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Proceed to Order (Manual UPI)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FREE SAMPLES SECTION (WAVE OPTICS & MODERN PHYSICS) */}
      <section id="free-samples" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            Free Sample Downloads
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
            Download Free Sample Chapters (PDF)
          </h2>
          <p className="text-xs text-gray-500">
            Preview the content before purchasing. No login or payment required.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Sample 1: Wave Optics */}
          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                Sample 1 (PDF)
              </span>
              <h3 className="text-base font-bold text-gray-900">Wave Optics</h3>
              <p className="text-gray-500 text-[11.5px] leading-relaxed">
                Young's Double Slit Experiment, Fringe Width formulas, Glass slab shift, Brewster's & Malus's Law.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => downloadSamplePdf('Wave Optics')}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download wave optics.pdf</span>
              </button>
            </div>
          </div>

          {/* Sample 2: Modern Physics */}
          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                Sample 2 (PDF)
              </span>
              <h3 className="text-base font-bold text-gray-900">Modern Physics</h3>
              <p className="text-gray-500 text-[11.5px] leading-relaxed">
                Photoelectric Effect, Bohr's Model equations, De Broglie Wavelength, Radioactivity decay & binding energy.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => downloadSamplePdf('Modern Physics')}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download modern physics.pdf</span>
              </button>
            </div>
          </div>
        </div>

        {/* Genuine Content Callout */}
        <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 text-xs text-blue-950 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="text-gray-900 font-bold">100% Authentic Exam Material:</strong>
            <p className="text-[11.5px] text-gray-600">
              These sample chapters represent the exact formatting, typeset quality, and depth of formulas found across all 289 pages in the complete DIAMOND JEE HANDBOOK. Available in digital PDF for ₹30 or printed from ₹449.
            </p>
          </div>
        </div>
      </section>

      {/* 5. VERIFIED REVIEWS ONLY (NO FAKE ONES) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            Real Aspirant Feedback
          </span>
          <h2 className="text-2xl font-bold text-gray-900">
            Verified Customer Reviews
          </h2>
          <p className="text-xs text-gray-500">
            Only verified purchasers can submit an authentic review. No fake ratings.
          </p>
        </div>

        <div className="p-8 text-center text-xs text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
          <Star className="w-6 h-6 text-gray-300 mx-auto mb-2" />
          <p className="font-semibold text-gray-900">No public reviews yet</p>
          <p className="text-gray-400 mt-1">
            Once your order is verified and completed, you will be able to submit a verified rating directly from your customer dashboard!
          </p>
        </div>
      </section>

      {/* 5. CONTACT & DIRECT WHATSAPP SUPPORT */}
      <section id="contact" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="p-8 bg-white rounded-3xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>WhatsApp Direct Support Available</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Direct Support &amp; Delivery Tracking</h3>
            <p className="text-gray-500 max-w-md">
              Have queries about chapter content, payment verification, or book dispatch? Contact creator Aditya Soni directly:
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11.5px]">
              <span className="font-mono text-blue-600 font-semibold">{BRANDING.contactEmail}</span>
              <span>•</span>
              <span className="font-mono text-emerald-600 font-semibold">+91 9154995314 (WhatsApp)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <a
              href="https://wa.me/919154995314?text=Hi%20Aditya,%20I%20have%20a%20query%20about%20the%20DIAMOND%20JEE%20Handbook"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Us (+91 9154995314)</span>
            </a>

            <button
              onClick={() => {
                if (!user) signInWithGoogle();
                else navigate('/dashboard?tab=support');
              }}
              className="w-full sm:w-auto px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Customer Chat</span>
            </button>
          </div>
        </div>

        {/* Delivery Guarantee Notice */}
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-[11.5px] text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-amber-700" />
            <span>Delivery &amp; Verification Timelines:</span>
          </div>
          <p className="text-gray-600">
            • <strong>Printed Books:</strong> Estimated <strong>10 working days</strong> across India via Speed Post &amp; Express Courier.<br />
            • <strong>Digital Edition:</strong> Manual payment confirmation takes around <strong>2–3 days</strong> (usually completed within hours).<br />
            • If you haven't received your delivery or access within this period, email <a href="mailto:adityasonihyderabad@gmail.com" className="font-semibold text-blue-600 underline">adityasonihyderabad@gmail.com</a> or WhatsApp message directly to <a href="https://wa.me/919154995314" target="_blank" rel="noreferrer" className="font-semibold text-emerald-600 underline">+91 9154995314</a>.
          </p>
        </div>
      </section>

      {/* CHECKOUT MODAL (Manual UPI QR & UTR Entry) */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 border border-gray-200 shadow-2xl max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-gray-900">
                  {checkoutStep === 1 ? 'Complete Order Details' : 'UPI Payment Verification'}
                </h3>
                <p className="text-[11px] text-gray-500">
                  {selectedFormat === 'digital' ? 'DIAMOND JEE Digital PDF (₹30)' : `DIAMOND Printed Book (${selectedBinding})`}
                </p>
              </div>
              <button 
                onClick={() => setCheckoutModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Auth notice if needed */}
            {!user ? (
              <div className="p-4 bg-blue-50 rounded-xl space-y-3 text-center">
                <p className="font-semibold text-blue-900">Sign in with Google to continue checkout</p>
                <button
                  type="button"
                  onClick={() => signInWithGoogle()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold"
                >
                  Sign in with Google
                </button>
              </div>
            ) : checkoutStep === 1 ? (
              /* Step 1: Address Details */
              <form onSubmit={handleCreateOrder} className="space-y-4">
                {/* Format Switcher inside Modal so user always has 100% control */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('digital')}
                    className={`py-2 px-3 rounded-lg font-bold text-center text-xs transition-all cursor-pointer ${
                      selectedFormat === 'digital' 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'text-gray-600 hover:text-gray-900 bg-transparent'
                    }`}
                  >
                    Digital Edition (₹30)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('physical')}
                    className={`py-2 px-3 rounded-lg font-bold text-center text-xs transition-all cursor-pointer ${
                      selectedFormat === 'physical' 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'text-gray-600 hover:text-gray-900 bg-transparent'
                    }`}
                  >
                    Printed Edition
                  </button>
                </div>

                {/* Binding options if physical */}
                {selectedFormat === 'physical' && (
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-gray-700">Choose Binding Style:</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {PRODUCT_SPECS.bindings.map(b => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBinding(b.id as BindingType)}
                          className={`p-2 rounded-xl border text-center text-[11px] cursor-pointer transition-all ${
                            selectedBinding === b.id 
                              ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold' 
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div>{b.name}</div>
                          <div className="font-mono font-bold mt-0.5">₹{b.price}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Details — Asked for BOTH Digital & Physical */}
                <div className="space-y-3 p-3.5 bg-gray-50/80 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between pb-1 border-b border-gray-200">
                    <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">
                      1. Customer Details
                    </span>
                    <span className="text-[10px] text-blue-600 font-semibold">
                      {selectedFormat === 'digital' ? 'For Digital Access & Invoice' : 'For Shipping Updates'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Student / Parent Name"
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Mobile / WhatsApp Number *</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-mono focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Aditya Soni will send payment confirmation & WhatsApp invoice to this number.
                    </p>
                  </div>
                </div>

                {/* Delivery Address — ONLY for Physical Printed Books */}
                {selectedFormat === 'physical' ? (
                  <div className="space-y-3 p-3.5 bg-gray-50/80 rounded-xl border border-gray-200">
                    <div className="pb-1 border-b border-gray-200">
                      <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">
                        2. Delivery Address
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">House / Flat / Street *</label>
                      <input
                        type="text"
                        required
                        value={houseAddress}
                        onChange={(e) => setHouseAddress(e.target.value)}
                        placeholder="Door No, Building, Street"
                        className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">City *</label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="City"
                          className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">PIN Code *</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={orderPin}
                          onChange={(e) => setOrderPin(e.target.value.replace(/\D/g, ''))}
                          placeholder="PIN Code"
                          className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-mono focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-blue-900 space-y-1">
                    <p className="font-bold text-[11px] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Instant Digital Soft Copy Delivery</span>
                    </p>
                    <p className="text-[10.5px] text-blue-800 leading-relaxed">
                      No physical shipping address needed! After scanning FamPay QR and submitting your 12-digit UTR, the complete 289-page watermarked PDF unlocks directly in your dashboard upon manual verification.
                    </p>
                  </div>
                )}

                <div className="p-3 bg-[#FAFAF8] rounded-xl flex items-center justify-between border border-gray-200">
                  <div>
                    <span className="font-bold text-gray-800 block text-xs">Total Amount to Pay:</span>
                    <span className="text-[10px] text-gray-500">
                      {selectedFormat === 'digital' ? 'Fixed ₹30 (No delivery fee)' : `₹${currentPrice} Book + ${orderPin.startsWith('500') ? 'FREE Local' : '₹50'} Shipping`}
                    </span>
                  </div>
                  <span className="font-mono text-xl font-black text-blue-700">
                    ₹{selectedFormat === 'digital' ? 30 : currentPrice + (orderPin.startsWith('500') ? 0 : 50)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
                >
                  {submitting ? 'Creating Order...' : 'Continue to UPI Payment QR'}
                </button>
              </form>
            ) : (
              /* Step 2: Real FamPay UPI QR Code & UTR Submission */
              <div className="space-y-4">
                <div className="p-4 bg-[#FAFAF8] rounded-2xl border border-gray-200 text-center space-y-3">
                  <div className="inline-block p-2 bg-white rounded-xl border border-gray-200 shadow-sm max-w-[220px]">
                    <img
                      src={ASSETS.qrImage}
                      alt="FamPay Official UPI QR Code"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiPayUri)}`;
                      }}
                      className="w-full h-auto rounded-lg object-contain"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-gray-800">Payee: {UPI_SETTINGS.payeeName}</p>
                    <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 font-mono text-xs shadow-xs">
                      <span className="font-bold text-blue-700">{UPI_SETTINGS.upiId}</span>
                      <button 
                        type="button" 
                        onClick={handleCopyUpi} 
                        className="text-gray-500 hover:text-blue-600 cursor-pointer p-0.5"
                        title="Copy UPI ID"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {copiedUpi && <p className="text-[10px] font-bold text-emerald-600">✓ Copied UPI ID to clipboard!</p>}
                    
                    <div className="pt-1">
                      <span className="text-xs text-gray-500 block">Amount to Transfer:</span>
                      <span className="text-xl font-black font-mono text-blue-700">
                        ₹{createdOrder?.totalAmount}
                      </span>
                    </div>

                    <p className="text-[10.5px] text-gray-500 max-w-xs mx-auto">
                      Scan using Google Pay, PhonePe, Paytm, BHIM or FamPay. Enter your 12-digit UTR reference number below.
                    </p>
                  </div>
                </div>

                {/* Delivery & Verification Notice */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                  <strong>Estimated Timelines:</strong>
                  <p>
                    • <strong>Printed Book:</strong> 10 working days via Speed Post / Express Courier.<br />
                    • <strong>Digital Edition:</strong> Access confirmed within 2–3 days (usually much faster) upon manual UTR verification.<br />
                    • Questions? WhatsApp Aditya Soni at <strong>+91 9154995314</strong>.
                  </p>
                </div>

                {/* UTR Form */}
                <form onSubmit={handleSubmitUtr} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-900 uppercase mb-1">
                      Enter 12-Digit UPI Transaction ID (UTR) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value.replace(/\s+/g, ''))}
                      placeholder="e.g. 428910482910"
                      className="w-full p-2.5 bg-[#FAFAF8] border border-gray-300 rounded-xl font-mono text-xs focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Found in your payment app's receipt (GPay, PhonePe, Paytm, FamPay).
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    {submitting ? 'Submitting...' : 'Submit Payment for Administrator Verification'}
                  </button>

                  <a
                    href={`https://wa.me/919154995314?text=Hi%20Aditya,%20I%20have%20submitted%20order%20${createdOrder?.id}%20for%20₹${createdOrder?.totalAmount}.%20Please%20verify%20payment.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-semibold text-center block text-[11px] border border-emerald-200 transition-colors"
                  >
                    Quick Confirm on WhatsApp (+91 9154995314)
                  </a>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
