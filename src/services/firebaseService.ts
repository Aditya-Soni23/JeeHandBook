import { 
  ref, 
  set, 
  get, 
  update, 
  push, 
  onValue, 
  DatabaseReference 
} from "firebase/database";
import { database } from "../config/firebase";
import { 
  Order, 
  ChatMessage, 
  UserProfile, 
  Address, 
  DigitalEntitlement,
  CustomerReview 
} from "../types";
import { BRANDING, UPI_SETTINGS, FIXED_PRICES } from "../config/constants";

// Helper for offline / local-first storage sync
const getLocal = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(`diamond_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const setLocal = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(`diamond_${key}`, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(`diamond_update_${key}`, { detail: value }));
  } catch (e) {
    console.error("Local storage sync error:", e);
  }
};

export const firebaseService = {
  // --- ORDERS ---
  async getOrders(): Promise<Order[]> {
    try {
      const dbRef = ref(database, 'diamond/orders');
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.values(data) as Order[];
        setLocal('orders', list);
        return list;
      }
    } catch (e) {
      console.warn("RTDB getOrders notice:", e);
    }
    return getLocal<Order[]>('orders', []);
  },

  async getCustomerOrders(uid: string, email?: string): Promise<Order[]> {
    const all = await this.getOrders();
    return all
      .filter(o => o.uid === uid || (email && o.customerEmail?.toLowerCase() === email.toLowerCase()))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createOrder(order: Order): Promise<void> {
    const orders = await this.getOrders();
    const updated = [order, ...orders.filter(o => o.id !== order.id)];
    setLocal('orders', updated);

    try {
      const orderRef = ref(database, `diamond/orders/${order.id}`);
      await set(orderRef, order);
    } catch (e) {
      console.warn("RTDB createOrder notice:", e);
    }
  },

  async updateOrder(orderId: string, updates: Partial<Order>, actor = "Admin"): Promise<void> {
    const orders = await this.getOrders();
    const existing = orders.find(o => o.id === orderId);
    if (!existing) return;

    const merged: Order = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      auditTrail: [
        ...(existing.auditTrail || []),
        {
          timestamp: new Date().toISOString(),
          action: updates.paymentStatus ? `PAYMENT_${updates.paymentStatus}` : updates.orderStatus ? `STATUS_${updates.orderStatus}` : 'ORDER_UPDATED',
          actor,
          note: updates.rejectionReason || updates.adminNotes || updates.trackingNumber
        }
      ]
    };

    const updatedList = orders.map(o => o.id === orderId ? merged : o);
    setLocal('orders', updatedList);

    try {
      const orderRef = ref(database, `diamond/orders/${orderId}`);
      await update(orderRef, updates);
    } catch (e) {
      console.warn("RTDB updateOrder notice:", e);
    }

    // Auto-unlock digital entitlement ONLY for digital orders when paid.
    // Physical orders require manual admin approval to prevent the free loophole.
    if (updates.paymentStatus === 'PAID' && merged.productType === 'digital') {
      await this.grantEntitlement(merged.uid, merged.id);
    }
  },

  // --- DIGITAL ENTITLEMENTS ---
  async getEntitlement(uid: string): Promise<DigitalEntitlement> {
    try {
      const entRef = ref(database, `diamond/users/${uid}/entitlements/digital_handbook`);
      const snapshot = await get(entRef);
      if (snapshot.exists()) {
        const val = snapshot.val();
        setLocal(`entitlement_${uid}`, val);
        return val;
      }
    } catch (e) {
      console.warn("RTDB getEntitlement notice:", e);
    }
    return getLocal<DigitalEntitlement>(`entitlement_${uid}`, { granted: false, downloadCount: 0 });
  },

  async grantEntitlement(uid: string, orderId: string): Promise<void> {
    const ent: DigitalEntitlement = {
      granted: true,
      grantedAt: new Date().toISOString(),
      orderId,
      downloadCount: 0
    };
    setLocal(`entitlement_${uid}`, ent);

    try {
      const entRef = ref(database, `diamond/users/${uid}/entitlements/digital_handbook`);
      await set(entRef, ent);
    } catch (e) {
      console.warn("RTDB grantEntitlement notice:", e);
    }
  },

  async recordDownload(uid: string): Promise<void> {
    try {
      const entRef = ref(database, `diamond/users/${uid}/entitlements/digital_handbook/downloadCount`);
      const snap = await get(entRef);
      const cur = snap.exists() ? snap.val() : 0;
      await set(entRef, cur + 1);
    } catch (e) {
      console.warn("RTDB recordDownload notice:", e);
    }
  },

  // --- REVIEWS (ONLY REAL VERIFIED BUYERS) ---
  async getReviews(): Promise<CustomerReview[]> {
    try {
      const snap = await get(ref(database, 'diamond/reviews'));
      if (snap.exists()) {
        const list = Object.values(snap.val()) as CustomerReview[];
        setLocal('reviews', list);
        return list;
      }
    } catch (e) {
      console.warn("RTDB getReviews notice:", e);
    }
    return getLocal<CustomerReview[]>('reviews', []);
  },

  async addReview(review: CustomerReview): Promise<void> {
    const list = await this.getReviews();
    const updated = [review, ...list];
    setLocal('reviews', updated);

    try {
      await set(ref(database, `diamond/reviews/${review.id}`), review);
    } catch (e) {
      console.warn("RTDB addReview notice:", e);
    }
  },

  // --- REAL-TIME CHAT ---
  async getMessages(uid: string): Promise<ChatMessage[]> {
    try {
      const msgRef = ref(database, `diamond/conversations/${uid}/messages`);
      const snapshot = await get(msgRef);
      if (snapshot.exists()) {
        const list = Object.values(snapshot.val()) as ChatMessage[];
        list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setLocal(`messages_${uid}`, list);
        return list;
      }
    } catch (e) {
      console.warn("RTDB getMessages notice:", e);
    }
    return getLocal<ChatMessage[]>(`messages_${uid}`, [
      {
        id: "msg_welcome",
        senderId: "admin",
        senderName: "Aditya Soni (DIAMOND)",
        senderRole: "admin",
        text: "Namaste! Welcome to DIAMOND JEE HANDBOOK. Message here for any questions about book tracking, payment verification, or chapters.",
        timestamp: new Date().toISOString(),
        read: true
      }
    ]);
  },

  async sendMessage(uid: string, message: ChatMessage, customerMeta?: { name: string; email: string; phone?: string }): Promise<void> {
    const msgs = await this.getMessages(uid);
    const updated = [...msgs, message];
    setLocal(`messages_${uid}`, updated);

    try {
      await set(ref(database, `diamond/conversations/${uid}/messages/${message.id}`), message);
    } catch (e) {
      console.warn("RTDB sendMessage notice:", e);
    }

    // Persist conversation meta for the Admin inbox
    try {
      const metaRef = ref(database, `diamond/conversations/${uid}/meta`);
      await update(metaRef, {
        uid,
        customerName: customerMeta?.name || message.senderName,
        customerEmail: customerMeta?.email || '',
        customerPhone: customerMeta?.phone || '',
        lastMessage: message.text,
        lastMessageTime: message.timestamp,
        lastSenderRole: message.senderRole
      });
    } catch (e) {
      console.warn("RTDB update conversation meta notice:", e);
    }
  },

  async getAllConversations(): Promise<{ uid: string; customerName: string; customerEmail: string; customerPhone?: string; lastMessage: string; lastMessageTime: string }[]> {
    const map = new Map<string, { uid: string; customerName: string; customerEmail: string; customerPhone?: string; lastMessage: string; lastMessageTime: string }>();

    // 1. From RTDB conversations
    try {
      const snap = await get(ref(database, 'diamond/conversations'));
      if (snap.exists()) {
        const val = snap.val();
        for (const [cId, cData] of Object.entries<any>(val)) {
          const meta = cData.meta || {};
          const msgs = cData.messages ? Object.values(cData.messages) as ChatMessage[] : [];
          msgs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          const lastMsg = msgs[0];

          map.set(cId, {
            uid: cId,
            customerName: meta.customerName || lastMsg?.senderName || "Student",
            customerEmail: meta.customerEmail || "",
            customerPhone: meta.customerPhone || "",
            lastMessage: meta.lastMessage || lastMsg?.text || "Started conversation",
            lastMessageTime: meta.lastMessageTime || lastMsg?.timestamp || new Date().toISOString()
          });
        }
      }
    } catch (e) {
      console.warn("RTDB getAllConversations notice:", e);
    }

    // 2. Cross-reference with all orders so Aditya Soni can view/message every purchaser
    try {
      const orders = await this.getOrders();
      for (const order of orders) {
        if (!map.has(order.uid)) {
          map.set(order.uid, {
            uid: order.uid,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            customerPhone: order.customerPhone,
            lastMessage: `Order ${order.id} (₹${order.totalAmount})`,
            lastMessageTime: order.createdAt
          });
        }
      }
    } catch (e) {
      console.warn("Orders cross-ref notice:", e);
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
  }
};
