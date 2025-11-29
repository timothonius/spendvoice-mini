import { useState, useCallback } from 'react';

export const useTranscriptParser = (merchantCorrections, categories) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  const extractMerchant = useCallback((text) => {
    const lowerText = text.toLowerCase();

    // Check for ETF/investment keywords first
    if (lowerText.includes('share') || lowerText.includes('etf') ||
        lowerText.includes('stock') || lowerText.includes('investment')) {

      // Check for specific ETFs
      if (lowerText.includes('hmax') || lowerText.includes('h max') ||
          lowerText.includes('age max') || lowerText.includes('each max') ||
          lowerText.includes('h m a x')) {
        return 'HMAX';
      }

      if (lowerText.includes('ytsl') || lowerText.includes('y t s l') ||
          lowerText.includes('white sell') || lowerText.includes('y cell') ||
          lowerText.includes('y tsl')) {
        return 'YTSL';
      }

      if (lowerText.includes('ynvd') || lowerText.includes('y n v d') ||
          lowerText.includes('invited') || lowerText.includes('envied') ||
          lowerText.includes('why envied') || lowerText.includes('y nvd')) {
        return 'YNVD';
      }

      return 'Wealthsimple';
    }

    // Original merchant detection logic
    const atMatch = text.match(/at\s+(\w+)/i);
    let rawMerchant = '';

    if (atMatch) {
      rawMerchant = atMatch[1];
    } else {
      const merchants = [
        'starbucks', 'kosa', 'phil', 'sebastian',
        'freshco', 'safeway', 'sunterra', 'sunnyside',
        'shell', 'centex', 'petro', 'canada',
        'chipotle', 'walmart', 'target'
      ];

      for (const merchant of merchants) {
        if (text.toLowerCase().includes(merchant)) {
          rawMerchant = merchant.charAt(0).toUpperCase() + merchant.slice(1);
          return rawMerchant;
        }
      }
      rawMerchant = 'Unknown merchant';
    }

    // Check merchant corrections
    const key = rawMerchant.toLowerCase().trim();
    if (merchantCorrections[key]) {
      console.log(`Auto-correcting: "${rawMerchant}" → "${merchantCorrections[key]}"`);
      return merchantCorrections[key];
    }

    return rawMerchant === 'Unknown merchant' ? rawMerchant : rawMerchant.charAt(0).toUpperCase() + rawMerchant.slice(1);
  }, [merchantCorrections]);

  const guessCategory = useCallback((merchant, text) => {
    const lowerText = text.toLowerCase();
    const lowerMerchant = merchant.toLowerCase();

    // Investments
    if (merchant === 'HMAX' || merchant === 'YTSL' || merchant === 'YNVD' ||
        lowerMerchant === 'wealthsimple' ||
        lowerText.includes('share') || lowerText.includes('etf') ||
        lowerText.includes('stock') || lowerText.includes('investment')) {
      return 'Investments';
    }

    // Coffee + Cafés
    if (lowerText.includes('coffee') || lowerText.includes('cafe') ||
        lowerText.includes('americano') || lowerText.includes('espresso') ||
        lowerMerchant.includes('starbucks') || lowerMerchant.includes('kosa') ||
        lowerMerchant.includes('phil') || lowerMerchant.includes('sebastian')) {
      return 'Coffee + Cafes';
    }

    // Groceries
    if (lowerText.includes('groceries') ||
        lowerMerchant.includes('freshco') || lowerMerchant.includes('safeway') ||
        lowerMerchant.includes('sunterra') || lowerMerchant.includes('sunnyside')) {
      return 'Groceries & Household';
    }

    // Car
    if (lowerText.includes('gas') || lowerText.includes('fuel') || lowerText.includes('petrol') ||
        lowerMerchant.includes('shell') || lowerMerchant.includes('centex') ||
        lowerMerchant.includes('petro') || lowerMerchant.includes('canada')) {
      return 'Car';
    }

    // Snacks + Eating Out
    if (lowerText.includes('pizza') || lowerText.includes('takeout') ||
        lowerText.includes('fast food') || lowerMerchant.includes('mcdonalds')) {
      return 'Snacks + Eating Out';
    }

    return 'Misc';
  }, []);

  const parseTranscript = useCallback(async (transcript) => {
    setIsProcessing(true);
    setProcessingStep(0);

    try {
      setProcessingStep(1);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Extract amount with validation
      const amountMatch = transcript.match(/(\d+(?:\.\d{2})?)\s*(?:dollars?|bucks?|\$)?/i);
      const rawAmount = amountMatch ? parseFloat(amountMatch[1]) : 0;

      // Validate amount (reject NaN, negative, or 0)
      const amount = !isNaN(rawAmount) && rawAmount > 0 ? rawAmount : null;

      setProcessingStep(2);
      await new Promise(resolve => setTimeout(resolve, 300));

      const atMatch = transcript.match(/at\s+(\w+)/i);
      const originalMerchant = atMatch ? atMatch[1] : null;

      setProcessingStep(3);
      const merchant = extractMerchant(transcript);
      const category = guessCategory(merchant, transcript);

      setIsProcessing(false);
      setProcessingStep(0);

      return {
        amount,
        merchant,
        originalMerchant,
        category,
        subcategory: '',
        confidence: amount ? 0.85 : 0.35,
        note: '',
        isValid: amount !== null && merchant !== 'Unknown merchant'
      };

    } catch (error) {
      console.error('Parsing failed:', error);
      setIsProcessing(false);
      setProcessingStep(0);
      throw error;
    }
  }, [extractMerchant, guessCategory]);

  return {
    parseTranscript,
    isProcessing,
    processingStep
  };
};
