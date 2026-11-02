# DIAMOND JEE HANDBOOK — E-Commerce & Educational Publishing Platform

A complete, production-oriented educational publishing e-commerce platform built for the **DIAMOND JEE HANDBOOK** (289 Pages, A4 format, 75 GSM paper, 3 binding options) with Google Authentication, customer dashboard, manual UPI QR payment verification, secure digital PDF entitlement delivery, real-time customer support chat, and a 13-module SaaS administrator control panel.

---

## 1. Features Overview

1. **Configurable Brand Identity**: Neutral publishing imprint (`VERTEX PRESS`) with dynamic branding system for website title, logo, contact information, and footer.
2. **Apple / Linear / Stripe Inspired Light Aesthetic**: Soft `#FAFAF8` surfaces, crisp `#FFFFFF` cards, `#EAEAEA` borders, `#2563EB` royal accents, zero-pill metadata discipline, and high-contrast typography.
3. **Product & Pricing System**:
   - Complete Digital PDF Edition: **₹30** (instant entitlement unlock upon admin payment verification).
   - Physical Book: Fixed specifications (289 Pages, A4, 75 GSM bright white paper, double-sided monochrome text, thick 350 GSM laminated colour cover).
   - 3 Bindings: Twin-Loop Spiral (₹449), Soft Cover Paperback (₹499), Deluxe Hard Cover (₹649).
   - All prices configurable from the administrator dashboard.
4. **Live Pricing & PIN Delivery Calculator**:
   - Instant calculation with postal PIN code verification.
   - Dynamic delivery charges based on zones (Hyderabad local free, metros, national).
   - Coupon discount code engine (fixed or percentage).
5. **Two Free Sample Chapters (No Login Required)**:
   - Physics Unit VI: *Rotational Mechanics & Moment of Inertia* (Pages 84–102).
   - Mathematics Unit III: *Calculus & Coordinate Geometry High-Yield Formulas* (Pages 140–168).
   - Direct in-browser preview and one-click PDF generation via jsPDF.
6. **Authentication & Roles**:
   - Firebase Google Authentication.
   - Profile management with phone number, saved shipping addresses, and order history.
   - Super Administrator role designated to `adityasonihyderabad@gmail.com` with quick preview switcher.
7. **Manual UPI QR Payment Gateway**:
   - Dynamic UPI payment URI (`upi://pay?pa=...&pn=...&am=...&tn=...`) and QR code display.
   - Customer 12-digit UTR reference entry and optional screenshot upload.
   - Order transitions to `PAYMENT_VERIFICATION_PENDING`.
   - Administrator manually verifies funds in bank account before approving or rejecting with reason.
8. **Secure Digital PDF Delivery**:
   - Anti-piracy personal security watermark on every page: `LICENSED TO: [NAME] ([EMAIL]) | ORDER: [ID]`.
   - Secure in-app protected PDF reader with chapter filtering, zooming, and pagination.
   - Access granted exclusively after administrator verification.
9. **Real-Time Customer Support Chat**:
   - Direct, private real-time conversation between customer and administrator.
   - Powered by Firebase Realtime Database.
   - Unread indicators, message timestamps, and conversation metadata.
10. **Official PDF Invoice & Receipt Generation**:
    - Generates downloadable official receipts with company details, order ID, payment method, UTR reference, and administrator verification stamp.
11. **13-Module SaaS Administrator Dashboard**:
    - Overview KPIs & revenue analytics.
    - Orders management with search, filters, and status transitions.
    - Payments verification queue (one-click approve/reject).
    - Customer management & entitlement control.
    - Product pricing manager (edit ₹30, ₹449, ₹499, ₹649 live).
    - Digital library manager.
    - Customer chat console with live replies.
    - Delivery zones & PIN codes manager.
    - Coupons manager.
    - Customer reviews moderation.
    - Invoice generator.
    - Website content CMS.
    - Branding & UPI settings with copyable Firebase Security Rules.

---

## 2. Firebase Configuration & Security Rules

The application is pre-configured with the project:

- **Project ID**: `lite-2ec2a`
- **Database URL**: `https://lite-2ec2a-default-rtdb.firebaseio.com`
- **Storage Bucket**: `lite-2ec2a.firebasestorage.app`

### Firebase Realtime Database Rules (`database.rules.json`)

Paste these rules in your **Firebase Console > Realtime Database > Rules**:

```json
{
  "rules": {
    "diamond": {
      "settings": {
        ".read": true,
        ".write": "auth != null"
      },
      "products": {
        ".read": true,
        ".write": "auth != null"
      },
      "deliveryZones": {
        ".read": true,
        ".write": "auth != null"
      },
      "coupons": {
        ".read": true,
        ".write": "auth != null"
      },
      "reviews": {
        ".read": true,
        ".write": "auth != null"
      },
      "orders": {
        ".read": "auth != null",
        ".write": "auth != null",
        "$orderId": {
          ".indexOn": ["uid", "paymentStatus", "orderStatus", "createdAt"]
        }
      },
      "conversations": {
        ".read": "auth != null",
        ".write": "auth != null"
      },
      "notifications": {
        "$uid": {
          ".read": "auth != null && (auth.uid == $uid || auth.token.email == 'adityasonihyderabad@gmail.com')",
          ".write": "auth != null"
        }
      },
      "users": {
        "$uid": {
          ".read": "auth != null && (auth.uid == $uid || auth.token.email == 'adityasonihyderabad@gmail.com')",
          ".write": "auth != null && (auth.uid == $uid || auth.token.email == 'adityasonihyderabad@gmail.com')"
        }
      }
    }
  }
}
```

### Firebase Storage Security Rules (`storage.rules`)

Paste these rules in **Firebase Console > Storage > Rules**:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Free sample PDFs are public
    match /diamond/samples/{sampleFile} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.email == 'adityasonihyderabad@gmail.com';
    }

    // Master full edition PDF is protected
    match /diamond/digitalLibrary/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.email == 'adityasonihyderabad@gmail.com';
    }

    // Payment screenshots
    match /diamond/payments/{paymentId}/{fileName} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 3. Google Sign-In Setup in Firebase Console

1. Navigate to **Firebase Console > Authentication > Sign-in method**.
2. Click **Add new provider** > **Google**.
3. Enable Google Provider, configure your support email (`adityasonihyderabad@gmail.com`), and save.
4. Under **Authorized domains**, ensure your deployment domain and `localhost` are present.

---

## 4. Manual UPI Verification Workflow

1. Customer places an order on `/checkout`.
2. A unique order reference (e.g., `DJH-2026-00042`) and payable amount are calculated.
3. The customer scans the displayed UPI QR code and pays via any UPI app (GPay, PhonePe, Paytm, BHIM).
4. Customer enters their 12-digit UTR reference number (and optional screenshot) and submits.
5. Order enters `PAYMENT_VERIFICATION_PENDING`.
6. As the administrator, open `/admin` > **Payments Verification Queue**.
7. Cross-check the UTR and amount in your actual bank account:
   - Click **Verify & Approve Payment**: The order transitions to `PAID`. For digital orders, the full 289-page handbook PDF is instantly unlocked in the customer's dashboard. For physical orders, the order moves to `PROCESSING`.
   - Click **Reject Payment**: Enter the reason (e.g. UTR mismatch). The customer is notified and can resubmit.
8. In Orders, update courier tracking numbers when books are shipped.

# JeeHandBook
