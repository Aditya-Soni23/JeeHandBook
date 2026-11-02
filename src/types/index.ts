export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  houseNumber: string;
  street: string;
  locality: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault: boolean;
}

export interface DigitalEntitlement {
  granted: boolean;
  grantedAt?: string;
  orderId?: string;
  downloadCount: number;
  lastDownloadedAt?: string;
  revoked?: boolean;
}

export type ProductType = 'digital' | 'physical';
export type BindingType = 'spiral' | 'softcover' | 'hardcover';

export type PaymentStatus = 
  | 'PAYMENT_PENDING' 
  | 'PAYMENT_VERIFICATION_PENDING' 
  | 'PAID' 
  | 'REJECTED';

export type OrderStatus = 
  | 'PLACED' 
  | 'PROCESSING' 
  | 'DISPATCHED' 
  | 'DELIVERED' 
  | 'CANCELLED'
  | 'REFUNDED';

export interface OrderAuditEntry {
  timestamp: string;
  action: string;
  actor: string;
  note?: string;
}

export interface Order {
  id: string; // e.g. DJH-2026-00042
  uid: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productType: ProductType;
  bindingType?: BindingType;
  bindingName?: string;
  quantity: number;
  unitPrice: number;
  productPrice: number;
  deliveryCharge: number;
  discount: number;
  couponCode?: string;
  totalAmount: number;
  shippingAddress?: Address;
  pinCode?: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  utrNumber?: string;
  paymentScreenshotUrl?: string;
  paymentSubmittedAt?: string;
  paymentVerifiedAt?: string;
  paymentVerifiedBy?: string;
  rejectionReason?: string;
  courierName?: string;
  trackingNumber?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  auditTrail: OrderAuditEntry[];
}

export interface PaymentSubmission {
  id: string;
  orderId: string;
  uid: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  utrNumber: string;
  screenshotUrl?: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  attachmentUrl?: string;
  attachmentName?: string;
  topic?: string;
  timestamp: string;
  read: boolean;
}

export interface ConversationMetadata {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhoto?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadAdminCount: number;
  unreadCustomerCount: number;
  status: 'active' | 'resolved';
}

export interface AppNotification {
  id: string;
  uid: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'delivery' | 'support' | 'entitlement';
  orderId?: string;
  read: boolean;
  createdAt: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  pinPrefixes: string; // comma separated
  charge: number;
  note?: string;
}

export interface DeliverySettings {
  defaultCharge: number;
  freeThreshold: number;
  zones: DeliveryZone[];
  blockedPins: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'fixed' | 'percentage';
  value: number;
  minOrder: number;
  active: boolean;
  maxRedemptions: number;
  usageCount: number;
  expiryDate: string;
}

export interface CustomerReview {
  id: string;
  author: string;
  role: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  verifiedBuyer: boolean;
  binding?: string;
  approved: boolean;
}

export interface WebsiteBrandingSettings {
  brandName: string;
  brandWordmark: string;
  websiteTitle: string;
  websiteDescription: string;
  contactEmail: string;
  contactPhone: string;
  operatingAddress: string;
  supportHours: string;
  footerCopyright: string;
}

export interface UpiSettings {
  upiId: string;
  payeeName: string;
  qrCodeUrl: string;
  instructions: string;
  supportPhone: string;
}

export interface PolicySettings {
  terms: string;
  privacy: string;
  refund: string;
  shipping: string;
  digitalProduct: string;
}
