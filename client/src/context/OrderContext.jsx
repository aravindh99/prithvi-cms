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

  const addProduct = (product) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const removeProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const toggleProduct = (product) => {
    if (selectedProducts.find(p => p.id === product.id)) {
      removeProduct(product.id);
    } else {
      addProduct(product);
    }
  };

  const toggleDate = (date) => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter(d => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr]);
    }
  };

  const calculatePerDayTotal = () => {
    return selectedProducts.reduce((sum, product) => sum + parseFloat(product.price), 0);
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
      addProduct,
      removeProduct,
      toggleProduct,
      toggleDate,
      resetOrder,
      calculatePerDayTotal,
      calculateGrandTotal
    }}>
      {children}
    </OrderContext.Provider>
  );
};

