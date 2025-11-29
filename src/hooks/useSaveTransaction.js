import { useState, useCallback, useRef } from 'react';

export const useSaveTransaction = (webhookUrl, onMerchantCorrection) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const lastSaveTimestamp = useRef(null);

  const saveTransaction = useCallback(async (confirmationData, transactions, allTransactions, onUpdate) => {
    // Duplicate prevention - block saves within 2 seconds
    const now = Date.now();
    if (lastSaveTimestamp.current && (now - lastSaveTimestamp.current) < 2000) {
      console.log('Duplicate save blocked - too soon after last save');
      return false;
    }

    // Validate amount
    if (!confirmationData.amount || isNaN(confirmationData.amount) || confirmationData.amount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return false;
    }

    // Create transaction
    const transaction = {
      id: Date.now(),
      amount: confirmationData.amount,
      merchant: confirmationData.merchant || 'Unknown merchant',
      category: confirmationData.category,
      subcategory: confirmationData.subcategory || '',
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      raw_transcript: confirmationData.raw_transcript,
      confidence: confirmationData.confidence || 0.85,
      edited: false,
      note: confirmationData.note || ''
    };

    // Save merchant correction if applicable
    if (confirmationData.originalMerchant &&
        confirmationData.originalMerchant.toLowerCase() !== confirmationData.merchant.toLowerCase()) {
      onMerchantCorrection(confirmationData.originalMerchant, confirmationData.merchant);
    }

    // Update transactions
    const updatedTransactions = [transaction, ...transactions];

    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`spending:${today}`, JSON.stringify(updatedTransactions));

    // Update month data
    const updatedAllTransactions = {
      ...allTransactions,
      [today]: updatedTransactions
    };

    // Send to webhook if configured
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: transaction.date,
            timestamp: transaction.timestamp,
            amount: transaction.amount,
            merchant: transaction.merchant,
            category: transaction.category,
            subcategory: transaction.subcategory,
            raw_transcript: transaction.raw_transcript,
            confidence: transaction.confidence,
            note: transaction.note
          })
        });
      } catch (error) {
        console.error('Webhook failed:', error);
      }
    }

    // Update state via callback
    onUpdate(updatedTransactions, updatedAllTransactions);

    // Update last save timestamp
    lastSaveTimestamp.current = now;

    // Show success message
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);

    return true;
  }, [webhookUrl, onMerchantCorrection]);

  return {
    saveTransaction,
    showSuccess
  };
};
