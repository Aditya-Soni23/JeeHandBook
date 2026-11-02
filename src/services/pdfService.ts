import { jsPDF } from 'jspdf';
import { Order } from '../types';

export const generateInvoicePdf = (order: Order): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Clean Header
  doc.setFillColor(250, 250, 248);
  doc.rect(0, 0, 210, 45, 'F');

  doc.setTextColor(37, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('DIAMOND', 15, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(115, 115, 115);
  doc.text('DIAMOND JEE HANDBOOK • Official Receipt & Tax Invoice', 15, 26);
  doc.text('Aditya Soni • Hyderabad, Telangana • Support: adityasonihyderabad@gmail.com', 15, 31);
  doc.text('WhatsApp: +91 9154995314 • UPI ID: 9154995314@fam', 15, 36);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(23, 23, 23);
  doc.text('PAYMENT RECEIPT', 195, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(115, 115, 115);
  doc.text(`Order ID: ${order.id}`, 195, 27, { align: 'right' });
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 195, 32, { align: 'right' });

  doc.setDrawColor(234, 234, 234);
  doc.line(15, 45, 195, 45);

  let y = 54;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(23, 23, 23);
  doc.text('BILLED TO (CUSTOMER):', 15, y);
  doc.text('PAYMENT DETAILS:', 115, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);
  doc.text(`Name: ${order.customerName}`, 15, y);
  doc.text('Method: Direct FamPay UPI (9154995314@fam)', 115, y);

  y += 5;
  doc.text(`Email: ${order.customerEmail}`, 15, y);
  doc.text(`UTR Reference: ${order.utrNumber || 'Pending Verification'}`, 115, y);

  y += 5;
  doc.text(`Phone: ${order.customerPhone || 'N/A'}`, 15, y);
  doc.text(`Status: ${order.paymentStatus === 'PAID' ? 'PAYMENT VERIFIED (CONFIRMED)' : order.paymentStatus}`, 115, y);

  if (order.shippingAddress) {
    y += 5;
    const a = order.shippingAddress;
    doc.text(`Address: ${a.houseNumber}, ${a.street}, ${a.city} - ${a.pinCode}`, 15, y);
    doc.text('Dispatch: Speed Post / Courier (10 working days)', 115, y);
  } else {
    y += 5;
    doc.text('Delivery: Complete Digital PDF (Diamond Hand Book.pdf)', 15, y);
    doc.text('Fulfillment: Instant Access on Verification (2-3 days)', 115, y);
  }

  y = 90;
  doc.setFillColor(243, 244, 246);
  doc.rect(15, y, 180, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(23, 23, 23);
  doc.text('PRODUCT DESCRIPTION', 18, y + 5.5);
  doc.text('QTY', 130, y + 5.5, { align: 'center' });
  doc.text('AMOUNT', 190, y + 5.5, { align: 'right' });

  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const itemName = order.productType === 'digital' 
    ? 'DIAMOND JEE HANDBOOK — Complete Digital PDF (289 Pages)' 
    : `DIAMOND JEE HANDBOOK — Printed Book (${order.bindingName || 'Physical'})`;
  doc.text(itemName, 18, y);
  doc.text(`${order.quantity}`, 130, y, { align: 'center' });
  doc.text(`INR ${order.totalAmount}`, 190, y, { align: 'right' });

  y = 130;
  doc.setDrawColor(234, 234, 234);
  doc.line(15, y, 195, y);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(23, 23, 23);
  doc.text('Total Paid Amount:', 130, y);
  doc.text(`INR ${order.totalAmount}`, 190, y, { align: 'right' });

  if (order.paymentStatus === 'PAID') {
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(15, 145, 80, 22, 2, 2);
    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('PAYMENT VERIFIED BY ADMINISTRATOR', 18, 153);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Bank Ref: ${order.utrNumber || 'Verified in Account'}`, 18, 160);
  }

  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('© 2026 DIAMOND JEE HANDBOOK. All rights reserved.', 105, 285, { align: 'center' });

  return doc;
};

// Generates the fallback free sample PDF for either Wave Optics or Modern Physics
const generateFallbackSamplePdf = (isWave: boolean, filename: string) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  doc.setFillColor(15, 23, 42); // slate 900
  doc.rect(0, 0, 210, 297, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('FREE SAMPLE CHAPTER • DIAMOND JEE HANDBOOK', 105, 30, { align: 'center' });

  doc.setFontSize(26);
  doc.text(isWave ? 'WAVE OPTICS' : 'MODERN PHYSICS', 105, 50, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(147, 197, 253);
  doc.text('PHYSICS COMPENDIUM • HIGH-YIELD FORMULAS & SHORTCUTS', 105, 60, { align: 'center' });

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(25, 80, 160, 150, 4, 4, 'F');

  doc.setTextColor(23, 23, 23);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(isWave ? 'Chapter Overview: Wave Optics' : 'Chapter Overview: Modern Physics', 35, 95);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(55, 65, 81);

  if (isWave) {
    const lines = [
      "Key formulas and shortcuts in this unit:",
      "",
      "1. Path Difference in YDSE: Δx = d · sin θ ≈ d · y / D",
      "2. Fringe Width: β = λ D / d",
      "3. Angular Fringe Width: θ = λ / d (independent of screen distance D)",
      "4. Maxima Condition: Δx = n λ  (n = 0, ±1, ±2...)",
      "5. Minima Condition: Δx = (2n - 1) λ / 2",
      "6. Intensity in Interference: I = I₁ + I₂ + 2√(I₁ I₂) cos φ",
      "   When I₁ = I₂ = I₀: I = 4 I₀ cos²(φ/2)",
      "7. Shift due to Thin Glass Slab (thickness t, refractive index μ):",
      "   Shift Δy = (μ - 1) t · (D / d)",
      "8. Brewster's Law of Polarization: tan(i_p) = μ",
      "9. Malus's Law: I = I₀ cos² θ",
      "",
      "Full 289-Page Complete DIAMOND JEE HANDBOOK:",
      "Digital PDF: Rs. 30  |  Physical Printed Book: from Rs. 449"
    ];
    let y = 106;
    lines.forEach(l => {
      doc.text(l, 35, y);
      y += 6.5;
    });
  } else {
    const lines = [
      "Key formulas and shortcuts in this unit:",
      "",
      "1. Einstein's Photoelectric Equation: E = hν = W + K_max",
      "   K_max = e · V_s = h (ν - ν₀) = hc [ 1/λ - 1/λ₀ ]",
      "2. De Broglie Wavelength: λ = h / p = h / √(2mE) = 12.27 / √V Å (electrons)",
      "3. Bohr's Radius: r_n = 0.529 · (n² / Z) Å",
      "4. Bohr's Velocity: v_n = 2.18 × 10⁶ · (Z / n) m/s",
      "5. Total Energy: E_n = -13.6 · (Z² / n²) eV",
      "   Kinetic Energy K = -E_n,  Potential Energy U = 2 E_n",
      "6. Rydberg Formula: 1/λ = R Z² [ 1/n₁² - 1/n₂² ]",
      "7. Law of Radioactive Decay: N(t) = N₀ · e^(-λt)",
      "   Half-Life: T_1/2 = ln 2 / λ ≈ 0.693 / λ",
      "8. Mass Defect & Nuclear Binding Energy: ΔE = Δm · 931.5 MeV",
      "",
      "Full 289-Page Complete DIAMOND JEE HANDBOOK:",
      "Digital PDF: Rs. 30  |  Physical Printed Book: from Rs. 449"
    ];
    let y = 106;
    lines.forEach(l => {
      doc.text(l, 35, y);
      y += 6.5;
    });
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text('DIAMOND JEE HANDBOOK • 289 Pages Total Syllabus', 105, 265, { align: 'center' });

  doc.save(filename);
};

// Downloads genuine pre-rendered sample PDF with automatic fallback
export const downloadSamplePdf = async (sampleName: 'Wave Optics' | 'Modern Physics') => {
  const isWave = sampleName === 'Wave Optics';
  const filename = isWave ? 'wave optics.pdf' : 'modern physics.pdf';
  const encodedName = isWave ? 'wave%20optics.pdf' : 'modern%20physics.pdf';
  const safeName = isWave ? 'wave-optics.pdf' : 'modern-physics.pdf';

  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

  const urlsToTry = [
    `${base}samples/${encodedName}`,
    `${base}samples/${safeName}`,
    `./samples/${encodedName}`,
    `./samples/${safeName}`,
    `/samples/${encodedName}`,
    `/samples/${safeName}`
  ];

  for (const url of urlsToTry) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        // Only accept actual PDF or binary stream (never the 404 HTML fallback page)
        if (!contentType.includes('text/html')) {
          const blob = await res.blob();
          if (blob.size > 2000) {
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
            return;
          }
        }
      }
    } catch {
      // Continue to next URL candidate
    }
  }

  // If network fetch fails or file isn't reachable, generate instant client-side formula compendium
  console.info("Generating standalone client-side PDF for", sampleName);
  generateFallbackSamplePdf(isWave, filename);
};

export const generateLicensedHandbookPdf = (customerName: string, customerEmail: string, orderId: string): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const watermark = `LICENSED TO: ${customerName.toUpperCase()} (${customerEmail}) • ORDER: ${orderId} • DO NOT DISTRIBUTE`;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 297, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('DIAMOND JEE HANDBOOK', 105, 60, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(147, 197, 253);
  doc.text('PHYSICS • CHEMISTRY • MATHEMATICS', 105, 72, { align: 'center' });
  doc.text('COMPLETE 289-PAGE MASTER COMPENDIUM', 105, 80, { align: 'center' });

  doc.setDrawColor(59, 130, 246);
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(30, 110, 150, 45, 3, 3, 'FD');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('AUTHORIZED ACADEMIC LICENSE', 105, 122, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Purchaser: ${customerName}`, 40, 132);
  doc.text(`Email: ${customerEmail}`, 40, 138);
  doc.text(`Order ID: ${orderId}`, 40, 144);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(watermark, 105, 280, { align: 'center' });

  return doc;
};
