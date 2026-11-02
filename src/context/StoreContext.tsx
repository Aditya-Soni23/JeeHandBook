import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  CustomerReview, 
  BindingType, 
  Order 
} from '../types';
import { 
  BRANDING, 
  UPI_SETTINGS, 
  FIXED_PRICES, 
  PRODUCT_SPECS 
} from '../config/constants';
import { firebaseService } from '../services/firebaseService';

interface StoreContextType {
  branding: typeof BRANDING;
  upiSettings: typeof UPI_SETTINGS;
  pricing: typeof FIXED_PRICES;
  reviews: CustomerReview[];
  addReview: (review: CustomerReview) => Promise<void>;
  activeInvoiceOrder: Order | null;
  openInvoiceModal: (order: Order) => void;
  closeInvoiceModal: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<Order | null>(null);

  useEffect(() => {
    firebaseService.getReviews().then(setReviews);
  }, []);

  const addReview = async (review: CustomerReview) => {
    await firebaseService.addReview(review);
    setReviews(await firebaseService.getReviews());
  };

  const openInvoiceModal = (order: Order) => setActiveInvoiceOrder(order);
  const closeInvoiceModal = () => setActiveInvoiceOrder(null);

  return (
    <StoreContext.Provider
      value={{
        branding: BRANDING,
        upiSettings: UPI_SETTINGS,
        pricing: FIXED_PRICES,
        reviews,
        addReview,
        activeInvoiceOrder,
        openInvoiceModal,
        closeInvoiceModal
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
