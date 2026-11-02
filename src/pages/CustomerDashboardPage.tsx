import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { firebaseService } from '../services/firebaseService';
import { generateInvoicePdf } from '../services/pdfService';
import { Order, DigitalEntitlement, ChatMessage } from '../types';
import { 
  ShoppingBag, 
  BookOpen, 
  MessageSquare, 
  ShieldCheck, 
  Download, 
  CheckCircle, 
  Clock, 
  Send, 
  Eye, 
  User as UserIcon,
  Copy,
  AlertCircle,
  FileText,
  Lock,
  ExternalLink,
  Truck,
  Search,
  Sparkles,
  Trash2
} from 'lucide-react';

export const CustomerDashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'orders';
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrdersAdmin, setAllOrdersAdmin] = useState<Order[]>([]);
  const [entitlement, setEntitlement] = useState<DigitalEntitlement>({ granted: false, downloadCount: 0 });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatText, setNewChatText] = useState('');

  // Admin Multi-Customer Chat States
  const [adminConversations, setAdminConversations] = useState<{ uid: string; customerName: string; customerEmail: string; customerPhone?: string; lastMessage: string; lastMessageTime: string }[]>([]);
  const [selectedCustomerUid, setSelectedCustomerUid] = useState<string | null>(null);
  const [searchCustomerChat, setSearchCustomerChat] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isSuperAdmin = Boolean(user && user.email.toLowerCase().trim() === 'adityasonihyderabad@gmail.com');

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Just now';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'Just now' : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const loadData = async () => {
    if (!user) return;
    const [userOrders, userEnt, msgs] = await Promise.all([
      firebaseService.getCustomerOrders(user.uid, user.email),
      firebaseService.getEntitlement(user.uid),
      firebaseService.getMessages(user.uid)
    ]);
    setOrders(userOrders);
    setEntitlement(userEnt);
    setChatMessages(msgs);

    if (isSuperAdmin) {
      const [all, convos] = await Promise.all([
        firebaseService.getOrders(),
        firebaseService.getAllConversations()
      ]);
      setAllOrdersAdmin(all);
      setAdminConversations(convos);
      if (convos.length > 0 && !selectedCustomerUid) {
        setSelectedCustomerUid(convos[0].uid);
        const initialMsgs = await firebaseService.getMessages(convos[0].uid);
        setChatMessages(initialMsgs);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Protect admin tab: redirect unauthorized visitors
  useEffect(() => {
    if (activeTab === 'admin' && !isSuperAdmin) {
      setSearchParams({ tab: 'orders' });
    }
  }, [activeTab, isSuperAdmin]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeTab, selectedCustomerUid]);

  const handleSelectCustomerChat = async (custUid: string) => {
    setSelectedCustomerUid(custUid);
    const msgs = await firebaseService.getMessages(custUid);
    setChatMessages(msgs);
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl border border-gray-200 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Please Sign In</h2>
        <p className="text-xs text-gray-500">Sign in with Google to view your dashboard, downloads, and orders.</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Return to Home
        </button>
      </div>
    );
  }

  // Digital access is ONLY granted when admin explicitly approves (entitlement.granted flag).
  // Physical book buyers do NOT get instant access — admin must manually unlock per order.
  const hasDigitalAccess = entitlement.granted;

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim() || !user) return;

    const targetUid = isSuperAdmin ? (selectedCustomerUid || user.uid) : user.uid;
    const selectedConvo = adminConversations.find(c => c.uid === targetUid);

    const msg: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: user.uid,
      senderName: isSuperAdmin ? 'Aditya Soni (Admin)' : user.name,
      senderRole: isSuperAdmin ? 'admin' : 'customer',
      text: newChatText.trim(),
      timestamp: new Date().toISOString(),
      read: false
    };

    await firebaseService.sendMessage(
      targetUid, 
      msg, 
      isSuperAdmin ? {
        name: selectedConvo?.customerName || 'Customer',
        email: selectedConvo?.customerEmail || '',
        phone: selectedConvo?.customerPhone || ''
      } : {
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    );

    setChatMessages(prev => [...prev, msg]);
    setNewChatText('');

    if (isSuperAdmin) {
      const convos = await firebaseService.getAllConversations();
      setAdminConversations(convos);
    }
  };

  // 1-Click button for Aditya Soni to confirm payment, unlock digital edition and send to customer
  const handleConfirmAndSendDigital = async (order: Order) => {
    try {
      await firebaseService.updateOrder(
        order.id,
        {
          paymentStatus: 'PAID',
          orderStatus: (order.productType === 'digital' || !order.shippingAddress) ? 'DELIVERED' : 'PROCESSING',
          paymentVerifiedAt: new Date().toISOString(),
          paymentVerifiedBy: user.email
        },
        "Aditya Soni Verified"
      );

      // Auto unlock digital entitlement for customer so they can download Diamond Hand Book.pdf
      await firebaseService.grantEntitlement(order.uid, order.id);
      await loadData();
      alert(`Success! Payment confirmed and Digital Edition unlocked for ${order.customerName}.`);
    } catch (err: any) {
      alert("Error confirming order: " + err.message);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    const reason = prompt("Enter rejection reason for customer (e.g. UTR not matching statement):", "UTR reference not found in bank account");
    if (reason) {
      await firebaseService.updateOrder(
        orderId,
        {
          paymentStatus: 'REJECTED',
          rejectionReason: reason
        },
        "Admin Rejected"
      );
      await loadData();
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm(`Delete order ${orderId}? This permanently removes it from the database.`)) return;
    try {
      await firebaseService.deleteOrder(orderId);
      setAllOrdersAdmin(prev => prev.filter(o => o.id !== orderId));
      setOrders(prev => prev.filter(o => o.id !== orderId));
      alert(`Order ${orderId} deleted.`);
    } catch (err: any) {
      alert("Error deleting order: " + err.message);
    }
  };

  const handleDownloadInvoice = (order: Order) => {
    const doc = generateInvoicePdf(order);
    doc.save(`DIAMOND-Receipt-${order.id}.pdf`);
  };

  const handleSendWhatsAppNotification = (order: Order) => {
    let cleanPhone = (order.customerPhone || '').replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
    if (!cleanPhone) {
      alert("Customer phone number not found for WhatsApp.");
      return;
    }
    const msg = encodeURIComponent(
      `Hello ${order.customerName},\n\nYour order ${order.id} for the DIAMOND JEE HANDBOOK (Total: ₹${order.totalAmount}) has been verified and confirmed by Aditya Soni!\n\nYour digital edition has been unlocked in your dashboard at ${window.location.origin}/dashboard?tab=downloads.\n\nThank you for choosing DIAMOND JEE HANDBOOK!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header Profile Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
              {user.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* View Switcher if superadmin */}
        <div className="flex items-center gap-2">
          {isSuperAdmin ? (
            <span className="text-[11px] font-bold text-purple-800 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200 flex items-center gap-1.5 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Owner &amp; Administrator ({user.email})</span>
            </span>
          ) : (
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Verified Student Account
            </span>
          )}
          <button
            onClick={() => navigate('/')}
            className="px-3.5 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold"
          >
            Storefront
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-4 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setSearchParams({ tab: 'orders' })}
          className={`pb-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'orders' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          My Orders ({orders.length})
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'downloads' })}
          className={`pb-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'downloads' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span>Digital PDF Library</span>
          {hasDigitalAccess && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'support' })}
          className={`pb-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'support' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Customer Support
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setSearchParams({ tab: 'admin' })}
            className={`pb-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 text-purple-700 ${
              activeTab === 'admin' ? 'border-purple-600 font-black' : 'border-transparent opacity-85 hover:opacity-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Admin Queue ({allOrdersAdmin.filter(o => o.paymentStatus.includes('PENDING')).length} Pending)</span>
          </button>
        )}
      </div>

      {/* 1. ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-500 bg-white rounded-2xl border border-gray-200">
              <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">No Orders Yet</p>
              <p className="text-gray-400 mt-1">Purchase the digital edition (₹30) or printed book from the homepage.</p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="p-5 bg-white rounded-2xl border border-gray-200 space-y-3 shadow-xs text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-900 text-sm">{order.id}</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                      order.paymentStatus === 'REJECTED' ? 'bg-red-50 text-red-800 border-red-200' :
                      'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {order.paymentStatus === 'PAID' ? '✓ Payment Verified' : order.paymentStatus}
                    </span>
                    <button
                      onClick={() => handleDownloadInvoice(order)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3 text-gray-500" />
                      <span>Invoice</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Product</span>
                    <p className="font-semibold text-gray-900 mt-0.5">
                      {(order.productType === 'digital' || !order.shippingAddress) ? 'DIAMOND Digital PDF (289 Pages)' : `DIAMOND Printed (${order.bindingName || 'Softcover'})`}
                    </p>
                    <p className="text-gray-600 mt-0.5">Amount: <strong className="font-mono text-blue-700">₹{(order.productType === 'digital' || !order.shippingAddress) ? (order.totalAmount || 30) : (order.totalAmount || 449)}</strong></p>
                  </div>

                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Payment UTR (FamPay)</span>
                    <p className="font-mono font-bold text-blue-700 mt-0.5">{order.utrNumber || 'Not submitted'}</p>
                    <p className="text-[10px] text-gray-400">Paid to 9154995314@fam</p>
                  </div>

                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Fulfillment</span>
                    <p className="font-semibold text-gray-900 mt-0.5">
                      {order.paymentStatus === 'PAID' ? '✓ Confirmed & Active' : 'Awaiting Admin Verification'}
                    </p>
                    <p className="text-gray-500 text-[11px] mt-0.5">
                      {(order.productType === 'digital' || !order.shippingAddress) 
                        ? 'Soft Copy: Unlocks in dashboard upon verification' 
                        : 'Dispatch: 10 working days via Speed Post'}
                    </p>
                  </div>
                </div>

                {order.paymentStatus === 'PAID' && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-emerald-900 font-semibold text-[11px]">
                      ✓ Confirmed by Aditya Soni. Your handbook is unlocked in the Digital PDF Library tab.
                    </span>
                    <button
                      onClick={() => setSearchParams({ tab: 'downloads' })}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                    >
                      Go to Downloads
                    </button>
                  </div>
                )}

                {order.paymentStatus === 'REJECTED' && (
                  <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs">
                    <strong>Admin Note:</strong> {order.rejectionReason}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. DIGITAL DOWNLOADS TAB */}
      {activeTab === 'downloads' && (
        <div className="p-6 bg-white rounded-2xl border border-gray-200 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Digital PDF Library</h2>
            <p className="text-xs text-gray-500">
              Access the complete 289-page DIAMOND JEE HANDBOOK master compendium.
            </p>
          </div>

          {hasDigitalAccess ? (
            <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2.5 py-1 rounded-md inline-block">
                    ✓ Verified by Aditya Soni • Full 289 Pages Ready
                  </span>
                  <h3 className="text-xl font-black text-gray-900 mt-2">DIAMOND JEE HANDBOOK (Complete 289 Pages)</h3>
                  <p className="text-gray-600 text-xs">Physics · Chemistry · Mathematics • High-Yield Formulas &amp; Shortcuts</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shrink-0">
                  ◆
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-emerald-200 space-y-1.5 text-xs text-gray-700">
                <p className="font-semibold text-gray-900">Your genuine licensed copy is ready:</p>
                <p className="text-gray-600">
                  File: <code className="font-mono text-blue-700 font-bold">Diamond Hand Book.pdf</code> (48.8 MB) — contains complete high-resolution pages across all chapters with zero fluff.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={`${import.meta.env.BASE_URL}samples/Diamond%20Hand%20Book.pdf`}
                  download="Diamond Hand Book.pdf"
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer text-sm"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Diamond Hand Book.pdf (48.8 MB)</span>
                </a>

                {orders[0] && (
                  <button
                    onClick={() => handleDownloadInvoice(orders[0])}
                    className="px-4 py-3 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 rounded-xl font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>Download Official Invoice</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-gray-500 bg-[#FAFAF8] rounded-2xl border border-gray-200 space-y-3">
              <Lock className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="font-bold text-gray-800 text-sm">Digital Handbook Locked</h3>
              <p className="max-w-md mx-auto text-gray-500">
                If you have already paid and submitted your UTR, Aditya Soni will verify your payment within <strong>2–3 days</strong> (usually much faster). Once verified, the download button will activate immediately.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="https://wa.me/919154995314?text=Hi%20Aditya,%20I%20have%20purchased%20the%20Digital%20Edition%20and%20submitted%20my%20UTR.%20Please%20verify%20my%20order."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Aditya Soni (+91 9154995314)</span>
                </a>
                <button
                  onClick={() => navigate('/#calculator')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Buy Digital Edition (₹30)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. SUPPORT CHAT & WHATSAPP TAB */}
      {activeTab === 'support' && (
        <div className="space-y-4">
          {/* Quick WhatsApp Card */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Direct WhatsApp Contact: +91 9154995314</span>
              </p>
              <p className="text-emerald-700 text-[11px]">
                Fastest response for payment confirmation, tracking details, or order verification.
              </p>
            </div>
            <a
              href="https://wa.me/919154995314?text=Hi%20Aditya,%20I%20need%20help%20with%20my%20DIAMOND%20JEE%20Handbook%20order"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold whitespace-nowrap shadow-xs"
            >
              Open WhatsApp Direct Message
            </a>
          </div>

          {isSuperAdmin ? (
            /* ADMIN MULTI-CUSTOMER INBOX CONSOLE (FOR ADITYA SONI) */
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs grid grid-cols-1 md:grid-cols-12 min-h-[580px] text-xs">
              {/* Left Customer List */}
              <div className="md:col-span-4 border-r border-gray-200 flex flex-col bg-gray-50/50">
                <div className="p-3.5 border-b border-gray-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-sm">Customer Inquiries</span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {adminConversations.length} Active
                    </span>
                  </div>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={searchCustomerChat}
                      onChange={(e) => setSearchCustomerChat(e.target.value)}
                      placeholder="Search customer name or email..."
                      className="w-full pl-8 pr-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-100 max-h-[500px]">
                  {adminConversations
                    .filter(c => 
                      !searchCustomerChat || 
                      c.customerName.toLowerCase().includes(searchCustomerChat.toLowerCase()) || 
                      c.customerEmail.toLowerCase().includes(searchCustomerChat.toLowerCase())
                    )
                    .map(c => {
                      const isSelected = selectedCustomerUid === c.uid;
                      const initial = (c.customerName || 'C').charAt(0).toUpperCase();
                      return (
                        <button
                          key={c.uid}
                          type="button"
                          onClick={() => handleSelectCustomerChat(c.uid)}
                          className={`w-full text-left p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                            isSelected ? 'bg-blue-50/90 border-l-4 border-blue-600' : 'hover:bg-gray-100/70'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {initial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-gray-900 truncate">{c.customerName}</span>
                              <span className="text-[10px] text-gray-400 font-mono shrink-0">
                                {new Date(c.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <span className="text-[11px] text-gray-500 truncate block">{c.customerEmail || 'No email'}</span>
                            <p className="text-[11px] text-gray-600 truncate mt-0.5">{c.lastMessage}</p>
                          </div>
                        </button>
                      );
                    })}
                  {adminConversations.length === 0 && (
                    <p className="p-8 text-center text-gray-400 text-xs">No customer messages yet.</p>
                  )}
                </div>
              </div>

              {/* Right Conversation Thread */}
              <div className="md:col-span-8 flex flex-col bg-white">
                {selectedCustomerUid ? (
                  <>
                    {/* Header */}
                    {(() => {
                      const curCust = adminConversations.find(c => c.uid === selectedCustomerUid);
                      const custOrder = allOrdersAdmin.find(o => o.uid === selectedCustomerUid);
                      return (
                        <div className="p-3.5 border-b border-gray-200 flex items-center justify-between bg-white shadow-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center text-sm">
                              {(curCust?.customerName || 'C').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-gray-900 text-sm">{curCust?.customerName || 'Selected Customer'}</h4>
                                {custOrder && (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    custOrder.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                                  }`}>
                                    {custOrder.productType === 'digital' ? 'Digital ₹30' : 'Printed'} • {custOrder.paymentStatus}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500">
                                {curCust?.customerEmail} {curCust?.customerPhone ? `• ${curCust.customerPhone}` : ''}
                              </p>
                            </div>
                          </div>

                          {curCust?.customerPhone && (
                            <a
                              href={`https://wa.me/${curCust.customerPhone.replace(/\D/g, '').startsWith('91') ? curCust.customerPhone.replace(/\D/g, '') : '91' + curCust.customerPhone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                        </div>
                      );
                    })()}

                    {/* Quick Response Templates for Aditya */}
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto">
                      <span className="text-[10px] text-gray-400 font-bold uppercase shrink-0">Quick Reply:</span>
                      <button
                        type="button"
                        onClick={() => setNewChatText("Hi! Your payment has been verified. The digital handbook is now unlocked in your dashboard!")}
                        className="px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-md text-[10.5px] text-gray-700 shrink-0 cursor-pointer"
                      >
                        ✓ Verified & Unlocked
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewChatText("Please share your 12-digit FamPay UTR number so I can verify and unlock your handbook.")}
                        className="px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-md text-[10.5px] text-gray-700 shrink-0 cursor-pointer"
                      >
                        💳 Ask UTR
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewChatText("Your printed handbook has been dispatched via Speed Post. Expected delivery within 10 working days.")}
                        className="px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-md text-[10.5px] text-gray-700 shrink-0 cursor-pointer"
                      >
                        📦 Dispatched Speed Post
                      </button>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-[#F8FAFC] max-h-[380px]">
                      {chatMessages.map(m => {
                        const fromAdmin = m.senderRole === 'admin';
                        return (
                          <div key={m.id} className={`flex flex-col ${fromAdmin ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[75%] p-3.5 rounded-2xl shadow-xs ${
                              fromAdmin 
                                ? 'bg-blue-600 text-white rounded-tr-xs' 
                                : 'bg-white border border-gray-200 text-gray-900 rounded-tl-xs'
                            }`}>
                              <div className="flex items-center justify-between gap-3 mb-1">
                                <span className={`text-[10px] font-bold ${fromAdmin ? 'text-blue-200' : 'text-blue-700'}`}>
                                  {fromAdmin ? 'You (Aditya Soni)' : m.senderName}
                                </span>
                                <span className={`text-[9px] font-mono ${fromAdmin ? 'text-blue-200' : 'text-gray-400'}`}>
                                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs leading-relaxed whitespace-pre-wrap">{m.text}</p>
                            </div>
                          </div>
                        );
                      })}
                      {chatMessages.length === 0 && (
                        <p className="text-center text-gray-400 py-12">No messages in this conversation yet. Send a greeting below!</p>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Reply Form */}
                    <form onSubmit={handleSendChat} className="p-3 border-t border-gray-200 flex gap-2 bg-white">
                      <input
                        type="text"
                        value={newChatText}
                        onChange={(e) => setNewChatText(e.target.value)}
                        placeholder="Type reply to customer..."
                        className="flex-1 p-3 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white"
                      />
                      <button
                        type="submit"
                        disabled={!newChatText.trim()}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
                      >
                        <span>Reply</span>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 space-y-2">
                    <MessageSquare className="w-8 h-8 text-gray-300" />
                    <p>Select a customer from the left list to view and reply to their messages.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* STUDENT 1-ON-1 CHAT WITH ADITYA SONI */
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[580px] text-xs overflow-hidden">
              {/* Modern WhatsApp / Intercom Style Header */}
              <div className="p-4 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 text-blue-950 font-black flex items-center justify-center text-sm ring-2 ring-white/30 shadow-sm">
                      AS
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-blue-900 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm tracking-tight text-white">Aditya Soni</h3>
                      <span className="bg-blue-500/30 text-blue-200 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full border border-blue-400/30">
                        Author & Publisher
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-200/80 flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      <span>Online • Replies within 5-15 mins</span>
                    </p>
                  </div>
                </div>

                <a
                  href="https://wa.me/919154995314?text=Hi%20Aditya%2C%20I%20have%20a%20query%20about%20the%20Diamond%20JEE%20Handbook"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-all text-[11px] cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Chat on WhatsApp</span>
                  <span className="sm:hidden">WhatsApp</span>
                </a>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
                {/* Greeting Banner */}
                <div className="max-w-md mx-auto p-3.5 bg-white rounded-2xl border border-blue-100 shadow-xs text-center space-y-2 mb-2">
                  <p className="text-xs font-bold text-gray-900">
                    👋 Welcome to Official JEE Handbook Support!
                  </p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Message Aditya Soni directly for payment verification, soft copy unlocks, courier tracking, or book syllabus questions.
                  </p>

                  {/* Suggested Quick Prompt Chips */}
                  <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setNewChatText("When will my digital soft copy be unlocked?")}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10.5px] font-semibold border border-blue-200/60 cursor-pointer transition-colors"
                    >
                      ⚡ Soft copy unlock time?
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewChatText("I have submitted my FamPay UTR number.")}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[10.5px] font-semibold border border-emerald-200/60 cursor-pointer transition-colors"
                    >
                      💳 Payment UTR submitted
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewChatText("Could you please provide the dispatch tracking for my printed handbook?")}
                      className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[10.5px] font-semibold border border-purple-200/60 cursor-pointer transition-colors"
                    >
                      📦 Track printed handbook
                    </button>
                  </div>
                </div>

                {chatMessages.map(m => {
                  const fromAdmin = m.senderRole === 'admin';
                  return (
                    <div key={m.id} className={`flex flex-col ${fromAdmin ? 'items-start' : 'items-end'}`}>
                      <div className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl shadow-xs ${
                        fromAdmin 
                          ? 'bg-white border border-gray-200/80 text-gray-900 rounded-tl-xs' 
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs'
                      }`}>
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <span className={`text-[10px] font-bold ${fromAdmin ? 'text-blue-700' : 'text-blue-100'}`}>
                            {fromAdmin ? 'Aditya Soni (Publisher)' : 'You'}
                          </span>
                          <span className={`text-[9px] font-mono ${fromAdmin ? 'text-gray-400' : 'text-blue-200'}`}>
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">{m.text}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
                <input
                  type="text"
                  value={newChatText}
                  onChange={(e) => setNewChatText(e.target.value)}
                  placeholder="Type a message to Aditya Soni (Press Enter)..."
                  className="flex-1 p-3 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden transition-all"
                />
                <button
                  type="submit"
                  disabled={!newChatText.trim()}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 4. ADMIN VERIFICATION QUEUE (STRICTLY FOR adityasonihyderabad@gmail.com) */}
      {activeTab === 'admin' && isSuperAdmin && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 text-xs">
          <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1 text-purple-700 font-bold text-[11px] uppercase tracking-wider mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Administrator Dashboard</span>
              </div>
              <h2 className="text-xl font-black text-gray-900">Manual Payment Verification &amp; Delivery Console</h2>
              <p className="text-[11px] text-gray-500">
                Logged in as <strong>{user.email}</strong>. Cross-check UTR numbers in your FamPay account (9154995314@fam).
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Pending Queue</span>
              <span className="text-2xl font-black text-purple-700 font-mono">
                {allOrdersAdmin.filter(o => o.paymentStatus.includes('PENDING')).length}
              </span>
            </div>
          </div>

          {allOrdersAdmin.length === 0 ? (
            <p className="text-gray-400 p-8 text-center bg-gray-50 rounded-xl">No orders placed yet.</p>
          ) : (
            <div className="space-y-4">
              {allOrdersAdmin.map(o => {
                const isPaid = o.paymentStatus === 'PAID';
                const isPending = o.paymentStatus.includes('PENDING');

                return (
                  <div 
                    key={o.id} 
                    className={`p-5 rounded-2xl border transition-all ${
                      isPending 
                        ? 'bg-amber-50/40 border-amber-300 shadow-sm' 
                        : isPaid 
                        ? 'bg-white border-gray-200' 
                        : 'bg-red-50/30 border-red-200'
                    } space-y-4`}
                  >
                    {/* Order Top Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-900 text-sm">{o.id}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-gray-500">{formatDate(o.createdAt)}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isPaid ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        o.paymentStatus === 'REJECTED' ? 'bg-red-50 text-red-800 border-red-200' :
                        'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        {isPaid ? '✓ Verified & Unlocked' : o.paymentStatus}
                      </span>
                    </div>

                    {/* Order Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Customer Details */}
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase font-bold block">Customer</span>
                        <p className="font-bold text-gray-900 text-sm mt-0.5">{o.customerName || 'Customer'}</p>
                        <p className="text-gray-600">{o.customerEmail || 'No email'}</p>
                        <p className="font-mono text-gray-700 font-bold">{o.customerPhone || 'No phone'}</p>
                        {o.shippingAddress ? (
                          <div className="mt-2 p-2 bg-white rounded-lg border border-gray-200 text-[11px] text-gray-600">
                            <strong>Shipping Address:</strong><br />
                            {o.shippingAddress.houseNumber}, {o.shippingAddress.street}, {o.shippingAddress.city} - {o.shippingAddress.pinCode}
                          </div>
                        ) : (
                          <div className="mt-2 p-2 bg-blue-50/70 rounded-lg border border-blue-200 text-[11px] text-blue-900">
                            <strong>Digital Fulfillment:</strong><br />
                            Soft copy unlocks directly in student dashboard.
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase font-bold block">Order Details</span>
                        <p className="font-semibold text-gray-900 mt-0.5">
                          {(o.productType === 'digital' || !o.shippingAddress) ? 'DIAMOND Digital Edition (289 Pages PDF)' : `Printed Book (${o.bindingName || 'Softcover'})`}
                        </p>
                        <p className="text-gray-600 mt-1">
                          Amount: <strong className="text-blue-700 font-mono text-sm">₹{(o.productType === 'digital' || !o.shippingAddress) ? (o.totalAmount || 30) : (o.totalAmount || 449)}</strong>
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {(o.productType === 'digital' || !o.shippingAddress) ? 'Soft Copy: Unlocks upon 1-Click Verification' : 'Delivery: 10 working days via Speed Post'}
                        </p>
                      </div>

                      {/* Payment Verification */}
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase font-bold block">FamPay UTR Number</span>
                        <div className="p-2.5 bg-white rounded-xl border border-gray-200 mt-1 flex items-center justify-between">
                          <span className="font-mono font-bold text-blue-900 text-xs">{o.utrNumber || 'No UTR submitted'}</span>
                          {o.utrNumber && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(o.utrNumber || '');
                                alert("UTR copied: " + o.utrNumber);
                              }}
                              className="text-gray-400 hover:text-blue-600 cursor-pointer p-0.5"
                              title="Copy UTR"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">Cross-check in FamPay app (9154995314@fam)</p>
                      </div>
                    </div>

                    {/* Admin Action Buttons */}
                    <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownloadInvoice(o)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-purple-600" />
                          <span>Generate &amp; Download Invoice</span>
                        </button>

                        <button
                          onClick={() => handleSendWhatsAppNotification(o)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Send on WhatsApp</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <button
                            onClick={() => handleRejectOrder(o.id)}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold cursor-pointer"
                          >
                            Reject
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteOrder(o.id)}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-700 border border-gray-200 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Permanently Delete Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>

                        <button
                          onClick={() => handleConfirmAndSendDigital(o)}
                          className={`px-4 py-2 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                            isPaid ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-300'
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>{isPaid ? 'Re-confirm & Re-unlock Book' : '1-Click Confirm & Unlock Book'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
