import React from 'react';
import { useStore } from '../context/StoreContext';
import { generateInvoicePdf } from '../services/pdfService';
import { X, Download, Printer, CheckCircle, Clock, ShieldCheck } from 'lucide-react';

export const InvoiceModal: React.FC = () => {
  const { activeInvoiceOrder, closeInvoiceModal, branding } = useStore();

  if (!activeInvoiceOrder) return null;

  const order = activeInvoiceOrder;
  const isPaid = order.paymentStatus === 'PAID';

  const handleDownloadPdf = () => {
    const doc = generateInvoicePdf(order);
    doc.save(`Invoice-${order.id}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Bar */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-[#FAFAF8] print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-900">Official Order Receipt</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs font-mono text-gray-500">{order.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
            <button
              onClick={closeInvoiceModal}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-8 overflow-y-auto space-y-6 text-xs text-gray-700 bg-white" id="printable-receipt">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-200 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-[10px] font-black">
                  ◆
                </div>
                <h2 className="text-base font-bold text-gray-900 tracking-tight">
                  {branding.brandName}
                </h2>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">{branding.operatingAddress}</p>
              <p className="text-[11px] text-gray-500">Email: {branding.contactEmail}</p>
            </div>
            <div className="text-right">
              <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-widest">
                PAYMENT RECEIPT
              </span>
              <p className="text-sm font-bold text-gray-900 mt-0.5">REC-{order.id.replace('DJH-', '')}</p>
              <p className="text-[11px] text-gray-500">
                Date: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Customer & Status Details */}
          <div className="grid grid-cols-2 gap-6 bg-[#FAFAF8] p-4 rounded-xl border border-gray-200">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Billed Customer
              </span>
              <p className="font-semibold text-gray-900 text-xs">{order.customerName}</p>
              <p className="text-gray-500 text-[11px]">{order.customerEmail}</p>
              <p className="text-gray-500 text-[11px]">Phone: {order.customerPhone || 'N/A'}</p>
              {order.shippingAddress && (
                <p className="text-gray-600 text-[11px] mt-1 pt-1 border-t border-gray-200">
                  Ship to: {order.shippingAddress.houseNumber}, {order.shippingAddress.street}, {order.shippingAddress.city} ({order.shippingAddress.pinCode})
                </p>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Verification Details
              </span>
              <div className="flex items-center gap-1.5 mb-1">
                {isPaid ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <CheckCircle className="w-3 h-3" /> Payment Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <Clock className="w-3 h-3" /> {order.paymentStatus}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-600">Method: Direct UPI Bank Transfer</p>
              <p className="text-[11px] font-mono text-gray-700">UTR: {order.utrNumber || 'Pending verification'}</p>
              {order.paymentVerifiedAt && (
                <p className="text-[10px] text-gray-400">
                  Verified: {new Date(order.paymentVerifiedAt).toLocaleString('en-IN')}
                </p>
              )}
            </div>
          </div>

          {/* Items breakdown */}
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-[11px]">
                <th className="py-2 font-medium">Description</th>
                <th className="py-2 text-center font-medium">Qty</th>
                <th className="py-2 text-right font-medium">Unit Price</th>
                <th className="py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-3 pr-4">
                  <p className="font-semibold text-gray-900">
                    {order.productType === 'digital'
                      ? 'DIAMOND JEE HANDBOOK — Complete Digital PDF'
                      : `DIAMOND JEE HANDBOOK — Printed Book (${order.bindingName || 'Physical'})`}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {order.productType === 'digital' 
                      ? '289 Pages • Protected Personal Watermark License' 
                      : '289 Pages • A4 Size • 75 GSM Paper • Laminated Colour Cover'}
                  </p>
                </td>
                <td className="py-3 text-center font-mono">{order.quantity}</td>
                <td className="py-3 text-right font-mono tabular-nums">₹{order.unitPrice}</td>
                <td className="py-3 text-right font-mono font-medium tabular-nums text-gray-900">₹{order.productPrice}</td>
              </tr>
            </tbody>
          </table>

          {/* Total calculations */}
          <div className="border-t border-gray-200 pt-3 flex justify-end">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-mono tabular-nums">₹{order.productPrice}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping & Delivery:</span>
                <span className="font-mono tabular-nums">
                  {order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Coupon Discount ({order.couponCode || 'PROMO'}):</span>
                  <span className="font-mono tabular-nums">- ₹{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Grand Total:</span>
                <span className="font-mono tabular-nums text-blue-600">₹{order.totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Official Stamp Banner if verified */}
          {isPaid && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-emerald-900">Administrator Verified Bank Deposit</p>
                <p className="text-[11px] text-emerald-700">
                  Transaction ref {order.utrNumber} successfully matched against official business account.
                </p>
              </div>
            </div>
          )}

          <div className="text-[10px] text-gray-400 text-center pt-4 border-t border-gray-100">
            {branding.footerCopyright} · Support: {branding.contactEmail}
          </div>
        </div>
      </div>
    </div>
  );
};
