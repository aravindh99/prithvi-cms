import { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

const OrderContext = createContext();

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const { user } = useAuth();
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);

  // Get unit from user context
  const selectedUnit = user?.unit || null;

  const resetOrder = () => {
    setSelectedProducts([]);
    setSelectedDates([]);
    setCurrentOrder(null);
  };

  const adjustProductQuantity = (product, delta) => {
    setSelectedProducts((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      if (!existing && delta > 0) {
        return [...prev, { ...product, quantity: 1 }];
      }
      if (!existing) return prev;

      const nextQty = (existing.quantity || 1) + delta;
      if (nextQty <= 0) {
        return prev.filter((p) => p.id !== product.id);
      }
      return prev.map((p) => (p.id === product.id ? { ...p, quantity: nextQty } : p));
    });
  };

  const setProductQuantity = (product, quantity) => {
    const qty = Math.max(0, Math.floor(quantity || 0));
    setSelectedProducts((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      if (qty === 0) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (!existing) {
        return [...prev, { ...product, quantity: qty }];
      }
      return prev.map((p) => (p.id === product.id ? { ...p, quantity: qty } : p));
    });
  };

  const toggleDate = (date) => {
    const dateStr = typeof date === 'string' ? date : (() => {
      const d = date;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    })();
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter(d => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr]);
    }
  };

  const calculatePerDayTotal = () => {
    return selectedProducts.reduce(
      (sum, product) => sum + (product.quantity || 1) * parseFloat(product.price),
      0
    );
  };

  const calculateGrandTotal = () => {
    return calculatePerDayTotal() * selectedDates.length;
  };

  return (
    <OrderContext.Provider value={{
      selectedUnit,
      selectedProducts,
      setSelectedProducts,
      selectedDates,
      setSelectedDates,
      currentOrder,
      setCurrentOrder,
      adjustProductQuantity,
      setProductQuantity,
      toggleDate,
      resetOrder,
      calculatePerDayTotal,
      calculateGrandTotal
    }}>
      {children}
    </OrderContext.Provider>
  );
};

