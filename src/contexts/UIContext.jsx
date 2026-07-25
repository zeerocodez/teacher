/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState('NGN');
  const [activeToast, setActiveToast] = useState(null);
  const [lang, setLang] = useState('en');

  const exchangeRates = {
    NGN_USD: 0.00125,
    NGN_GBP: 0.001,
    NGN_EUR: 0.00116,
    NGN_GHS: 0.0143,
    NGN_CAD: 0.00172
  };

  const convertMinor = (ngnMinor, targetCurrency) => {
    if (targetCurrency === 'NGN') return ngnMinor;
    const rateKey = `NGN_${targetCurrency}`;
    const rate = exchangeRates[rateKey] || 1;
    return Math.round(ngnMinor * rate);
  };

  const formatCurrency = (amountInMinor, currency) => {
    const value = amountInMinor / 100;
    const formatters = {
      NGN: new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }),
      USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      GBP: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
      EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
      GHS: new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }),
      CAD: new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }),
    };
    return formatters[currency]?.format(value) ?? `${currency} ${value}`;
  };

  return (
    <UIContext.Provider value={{ 
      selectedCurrency, setSelectedCurrency, 
      activeToast, setActiveToast,
      lang, setLang,
      convertMinor, formatCurrency 
    }}>
      {children}
    </UIContext.Provider>
  );
};
