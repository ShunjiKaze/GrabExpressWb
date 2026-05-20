import { createContext, useContext, useState, useCallback } from 'react';

const BookingContext = createContext(null);

const INITIAL = {
  // Step 1 – Addresses
  pickupAddress: '',
  deliveryAddress: '',

  // Step 2 – Delivery Details
  senderName: '',
  senderPhone: '',
  senderFloor: '',
  senderNote: '',
  saveSender: false,
  recipientName: '',
  recipientPhone: '',
  recipientFloor: '',
  recipientNote: '',
  saveRecipient: false,
  deliveryType: 'instant',
  vehicleType: 'motorcycle',

  // Step 3 – Item Details
  itemSize: 'M',
  itemWeight: '',
  itemType: 'Document',
  itemPhotoTaken: false,
  guaranteeTier: 'Basic',

  // Step 4 – Payment
  paymentMethod: 'cash_sender',
};

export const VEHICLE_BASE   = { motorcycle: 60, car: 120, van: 250 };
export const SIZE_ADD       = { S: 0, M: 20, L: 50, XL: 100 };
export const TIER_ADD       = { Basic: 0, Standard: 50, Premium: 100 };
export const DELIVERY_ADD   = { instant: 0, same_day: 30, bulk: 60 };

export function calcTotal(data) {
  const base     = VEHICLE_BASE[data.vehicleType] ?? 60;
  const size     = SIZE_ADD[data.itemSize] ?? 0;
  const tier     = TIER_ADD[data.guaranteeTier] ?? 0;
  const delivery = DELIVERY_ADD[data.deliveryType] ?? 0;
  return base + size + tier + delivery;
}

export function vehicleForSize(size) {
  if (size === 'S') return 'motorcycle';
  if (size === 'M') return 'car';
  return 'van';
}

export function BookingProvider({ children }) {
  const [bookingData, setBookingData] = useState(INITIAL);

  const updateBooking = useCallback((fields) => {
    setBookingData(prev => ({ ...prev, ...fields }));
  }, []);

  const resetBooking = useCallback(() => {
    setBookingData(INITIAL);
  }, []);

  const total = calcTotal(bookingData);

  return (
    <BookingContext.Provider value={{ bookingData, updateBooking, resetBooking, total }}>
      {children}
    </BookingContext.Provider>
  );
}

export const useBooking = () => {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used inside BookingProvider');
  return ctx;
};
