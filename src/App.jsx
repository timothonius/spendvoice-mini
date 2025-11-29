import React, { useState, useEffect, useRef } from 'react';
import { Mic, DollarSign, Settings, Trash2, Edit2, Check, X, BarChart3, Calendar, StickyNote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';

export default function SpendVoice() {
  // State management
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [tempEditValue, setTempEditValue] = useState('');
  const [merchantCorrections, setMerchantCorrections] = useState({});
  const [currentView, setCurrentView] = useState('today'); // today, charts
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Refs
  const recognitionRef = useRef(null);

  // Your 15 standardized categories with consistent colors
  const categories = [
    { name: 'Rent + Utilities', color: '#1e3a8a', bgColor: 'bg-blue-900', borderColor: 'border-blue-900', textColor: 'text-blue-900', icon: '🏘️' },
    { name: 'Coffee + Cafes', color: '#78350f', bgColor: 'bg-amber-900', borderColor: 'border-amber-900', textColor: 'text-amber-900', icon: '☕' },
    { name: 'Groceries & Household', color: '#15803d', bgColor: 'bg-green-700', borderColor: 'border-green-700', textColor: 'text-green-700', icon: '🛒' },
    { name: 'Snacks + Eating Out', color: '#ea580c', bgColor: 'bg-orange-600', borderColor: 'border-orange-600', textColor: 'text-orange-600', icon: '🍕' },
    { name: 'Dates', color: '#e11d48', bgColor: 'bg-rose-600', borderColor: 'border-rose-600', textColor: 'text-rose-600', icon: '❤️' },
    { name: 'Misc', color: '#6b7280', bgColor: 'bg-gray-500', borderColor: 'border-gray-500', textColor: 'text-gray-500', icon: '⭐' },
    { name: 'Car', color: '#2563eb', bgColor: 'bg-blue-600', borderColor: 'border-blue-600', textColor: 'text-blue-600', icon: '🚗' },
    { name: 'Nicotine', color: '#dc2626', bgColor: 'bg-red-600', borderColor: 'border-red-600', textColor: 'text-red-600', icon: '🚬' },
    { name: 'Investments', color: '#059669', bgColor: 'bg-emerald-600', borderColor: 'border-emerald-600', textColor: 'text-emerald-600', icon: '📈' },
    { name: 'Savings', color: '#0891b2', bgColor: 'bg-cyan-600', borderColor: 'border-cyan-600', textColor: 'text-cyan-600', icon: '💰' },
    { name: 'Subscriptions', color: '#7c3aed', bgColor: 'bg-violet-600', borderColor: 'border-violet-600', textColor: 'text-violet-600', icon: '📱' },
    { name: 'Career & Education', color: '#4f46e5', bgColor: 'bg-indigo-600', borderColor: 'border-indigo-600', textColor: 'text-indigo-600', icon: '🎓' },
    { name: 'Family & Gifts', color: '#eab308', bgColor: 'bg-yellow-500', borderColor: 'border-yellow-500', textColor: 'text-yellow-500', icon: '🎁' },
    { name: 'Debt', color: '#991b1b', bgColor: 'bg-red-800', borderColor: 'border-red-800', textColor: 'text-red-800', icon: '💳' },
    { name: 'Credit Building', color: '#06b6d4', bgColor: 'bg-cyan-500', borderColor: 'border-cyan-500', textColor: 'text-cyan-500', icon: '🏦' },
    { name: 'Self-Care', color: '#a855f7', bgColor: 'bg-purple-500', borderColor: 'border-purple-500', textColor: 'text-purple-500', icon: '💆' }
  ];

  // Load data on mount
  useEffect(() => {
    loadAllTransactions();
    loadWebhookUrl();
    loadMerchantCorrections();
    setupSpeechRecognition();
  }, []);

  const loadAllTransactions = () => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem(`spending:${today}`);
    if (stored) {
      setTransactions(JSON.parse(stored));
    }

    // Load month's data for charts
    const monthData = {};
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toISOString().split('T')[0];
      const dayData = localStorage.getItem(`spending:${dateKey}`);
      if (dayData) {
        monthData[dateKey] = JSON.parse(dayData);
      }
    }
    setAllTransactions(monthData);
  };

  const loadWebhookUrl = () => {
    const url = localStorage.getItem('webhook-url');
    if (url) setWebhookUrl(url);
  };

  const loadMerchantCorrections = () => {
    const stored = localStorage.getItem('merchant-corrections');
    if (stored) {
      setMerchantCorrections(JSON.parse(stored));
    }
  };

  const saveMerchantCorrection = (heardAs, correctName) => {
    const key = heardAs.toLowerCase().trim();
    const updated = {
      ...merchantCorrections,
      [key]: correctName
    };
    setMerchantCorrections(updated);
    localStorage.setItem('merchant-corrections', JSON.stringify(updated));
    console.log(`Learned: "${heardAs}" → "${correctName}"`);
  };

  const setupSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  };

  const startRecording = () => {
    if (recognitionRef.current) {
      setTranscript('');
      setIsRecording(true);
      recognitionRef.current.start();
    } else {
      alert('Speech recognition not supported in this browser');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      if (transcript) {
        processTranscript(transcript);
      }
    }
  };

  const cancelRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    setTranscript('');
  };

  const processTranscript = async (text) => {
    setIsProcessing(true);
    setProcessingStep(0);
    
    try {
      setProcessingStep(1);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setProcessingStep(2);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setProcessingStep(3);
      const parsed = await parseExpenseVoiceNote(text);
      
      setConfirmationData({
        amount: parsed.amount,
        merchant: parsed.merchant,
        originalMerchant: parsed.originalMerchant,
        category: parsed.category,
        subcategory: parsed.subcategory || '',
        confidence: parsed.confidence,
        note: '',
        raw_transcript: text
      });
      
      setIsProcessing(false);
      setProcessingStep(0);
      setShowConfirmation(true);
      
    } catch (error) {
      console.error('AI parsing failed:', error);
      setIsProcessing(false);
      setProcessingStep(0);
      alert('Voice processing failed. Please try again.');
    }
  };

  const parseExpenseVoiceNote = async (transcript) => {
    const amountMatch = transcript.match(/(\d+(?:\.\d{2})?)\s*(?:dollars?|bucks?|\$)?/i);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    
    const atMatch = transcript.match(/at\s+(\w+)/i);
    const originalMerchant = atMatch ? atMatch[1] : 'Unknown';
    
    const merchant = extractMerchant(transcript);
    const category = guessCategory(merchant, transcript);
    
    return {
      amount: amount,
      merchant: merchant,
      originalMerchant: originalMerchant,
      category: category,
      subcategory: '',
      confidence: 0.85,
      note: ''
    };
  };

  const extractMerchant = (text) => {
    const lowerText = text.toLowerCase();
    
    // Check for ETF/investment keywords first
    if (lowerText.includes('share') || lowerText.includes('etf') || 
        lowerText.includes('stock') || lowerText.includes('investment')) {
      
      // Check for specific ETFs (your 3 tickers)
      // HMAX variations
      if (lowerText.includes('hmax') || lowerText.includes('h max') || 
          lowerText.includes('age max') || lowerText.includes('each max') ||
          lowerText.includes('h m a x')) {
        return 'HMAX';
      }
      
      // YTSL variations
      if (lowerText.includes('ytsl') || lowerText.includes('y t s l') ||
          lowerText.includes('white sell') || lowerText.includes('y cell') ||
          lowerText.includes('y tsl')) {
        return 'YTSL';
      }
      
      // YNVD variations
      if (lowerText.includes('ynvd') || lowerText.includes('y n v d') ||
          lowerText.includes('invited') || lowerText.includes('envied') ||
          lowerText.includes('why envied') || lowerText.includes('y nvd')) {
        return 'YNVD';
      }
      
      // Generic investment if we detected "share" but not specific ticker
      return 'Wealthsimple';
    }
    
    // Original merchant detection logic
    const atMatch = text.match(/at\s+(\w+)/i);
    let rawMerchant = '';
    
    if (atMatch) {
      rawMerchant = atMatch[1];
    } else {
      // Your Tier 1 recurring vendors (70-75% of transactions)
      const merchants = [
        // Cafés
        'starbucks', 'kosa', 'phil', 'sebastian',
        // Groceries  
        'freshco', 'safeway', 'sunterra', 'sunnyside',
        // Car
        'shell', 'centex', 'petro', 'canada',
        // General
        'chipotle', 'walmart', 'target'
      ];
      
      for (const merchant of merchants) {
        if (text.toLowerCase().includes(merchant)) {
          rawMerchant = merchant.charAt(0).toUpperCase() + merchant.slice(1);
          return rawMerchant;
        }
      }
      rawMerchant = 'Unknown';
    }
    
    const key = rawMerchant.toLowerCase().trim();
    if (merchantCorrections[key]) {
      console.log(`Auto-correcting: "${rawMerchant}" → "${merchantCorrections[key]}"`);
      return merchantCorrections[key];
    }
    
    return rawMerchant.charAt(0).toUpperCase() + rawMerchant.slice(1);
  };

  const guessCategory = (merchant, text) => {
    const lowerText = text.toLowerCase();
    const lowerMerchant = merchant.toLowerCase();
    
    // Investments - check for ETF tickers or investment keywords
    if (merchant === 'HMAX' || merchant === 'YTSL' || merchant === 'YNVD' || 
        lowerMerchant === 'wealthsimple' ||
        lowerText.includes('share') || lowerText.includes('etf') || 
        lowerText.includes('stock') || lowerText.includes('investment')) {
      return 'Investments';
    }
    
    // Coffee + Cafés (Tier 1: Kosa, Phil & Sebastian, Starbucks)
    if (lowerText.includes('coffee') || lowerText.includes('cafe') ||
        lowerText.includes('americano') || lowerText.includes('espresso') ||
        lowerMerchant.includes('starbucks') || lowerMerchant.includes('kosa') ||
        lowerMerchant.includes('phil') || lowerMerchant.includes('sebastian')) {
      return 'Coffee + Cafes';
    }
    
    // Groceries (Tier 1: FreshCo, Sunnyside, Sunterra, Safeway)
    if (lowerText.includes('groceries') ||
        lowerMerchant.includes('freshco') || lowerMerchant.includes('safeway') || 
        lowerMerchant.includes('sunterra') || lowerMerchant.includes('sunnyside')) {
      return 'Groceries & Household';
    }
    
    // Car (Tier 1: Shell, Centex, Petro Canada)
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
  };

  const confirmTransaction = async () => {
    const transaction = {
      id: Date.now(),
      amount: confirmationData.amount,
      merchant: confirmationData.merchant,
      category: confirmationData.category,
      subcategory: confirmationData.subcategory,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      raw_transcript: confirmationData.raw_transcript,
      confidence: confirmationData.confidence,
      edited: false,
      note: confirmationData.note || ''
    };

    if (confirmationData.originalMerchant && 
        confirmationData.originalMerchant.toLowerCase() !== confirmationData.merchant.toLowerCase()) {
      saveMerchantCorrection(confirmationData.originalMerchant, confirmationData.merchant);
    }

    const updatedTransactions = [transaction, ...transactions];
    setTransactions(updatedTransactions);
    
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`spending:${today}`, JSON.stringify(updatedTransactions));

    // Update month data
    const updatedAllTransactions = {
      ...allTransactions,
      [today]: updatedTransactions
    };
    setAllTransactions(updatedAllTransactions);

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

    setShowConfirmation(false);
    setConfirmationData(null);
    setTranscript('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const deleteTransaction = (id) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`spending:${today}`, JSON.stringify(updated));

    // Update month data
    const updatedAllTransactions = {
      ...allTransactions,
      [today]: updated
    };
    setAllTransactions(updatedAllTransactions);
  };

  const updateTransaction = (id, field, value) => {
    const updated = transactions.map(t => 
      t.id === id ? { ...t, [field]: value, edited: true } : t
    );
    setTransactions(updated);
    
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`spending:${today}`, JSON.stringify(updated));

    // Update month data
    const updatedAllTransactions = {
      ...allTransactions,
      [today]: updated
    };
    setAllTransactions(updatedAllTransactions);
  };

  // Close edit mode when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editingTransaction && !event.target.closest('.transaction-card')) {
        setEditingTransaction(null);
        setEditingField(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingTransaction]);

  const updateConfirmationData = (field, value) => {
    const updated = {
      ...confirmationData,
      [field]: value
    };
    
    if (field === 'merchant' && !confirmationData.originalMerchant) {
      updated.originalMerchant = confirmationData.merchant;
    }
    
    setConfirmationData(updated);
  };

  const getTodayTotal = () => {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  };

  const getMonthTotal = () => {
    let total = 0;
    Object.values(allTransactions).forEach(dayTransactions => {
      dayTransactions.forEach(t => {
        total += t.amount;
      });
    });
    return total;
  };

  const getCategoryTotals = () => {
    const totals = {};
    
    Object.values(allTransactions).forEach(dayTransactions => {
      dayTransactions.forEach(t => {
        if (!totals[t.category]) {
          totals[t.category] = 0;
        }
        totals[t.category] += t.amount;
      });
    });

    // Convert to array and sort by amount (largest first)
    return Object.entries(totals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  const getCategoryStyle = (categoryName) => {
    const cat = categories.find(c => c.name === categoryName);
    return cat || categories[5]; // Default to Misc
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getMonthName = () => {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const clearMonthData = () => {
    // Get current month's date range
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Delete all localStorage entries for this month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toISOString().split('T')[0];
      localStorage.removeItem(`spending:${dateKey}`);
    }

    // Reset state
    setTransactions([]);
    setAllTransactions({});
    setShowClearConfirm(false);
    setShowSettings(false);

    // Show success message
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 pb-24">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-800">SpendVoice</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2">
            <Button
              variant={currentView === 'today' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('today')}
              className={`flex-1 ${currentView === 'today' ? '' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Today
            </Button>
            <Button
              variant={currentView === 'charts' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('charts')}
              className={`flex-1 ${currentView === 'charts' ? '' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Charts
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="max-w-md mx-auto px-6 py-4 bg-white/60 backdrop-blur-sm border-b border-gray-200/50">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Make.com Webhook URL
              </label>
              <Input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                onBlur={() => {
                  if (webhookUrl) {
                    localStorage.setItem('webhook-url', webhookUrl);
                  }
                }}
                placeholder="https://hook.us2.make.com/..."
              />
            </div>

            {/* Clear Month Data */}
            <div className="pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  setShowClearConfirm(true);
                  setShowSettings(false);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear This Month's Data
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                This will delete all transactions for {getMonthName()}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto px-6 py-8">
        {/* Today View */}
        {currentView === 'today' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Card className="bg-green-50 border-2 border-green-200">
                <CardContent className="p-6">
                  <div className="text-xs text-green-700 font-medium mb-1 uppercase tracking-wide">
                    Today
                  </div>
                  <div className="text-3xl font-bold text-green-600 font-mono tabular-nums">
                    {formatCurrency(getTodayTotal())}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">
                    This Month
                  </div>
                  <div className="text-xl font-semibold text-gray-600 font-mono tabular-nums">
                    {formatCurrency(getMonthTotal())}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Success Notification */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="bg-green-50 border-2 border-green-200 mb-6">
                    <CardContent className="p-4 text-center">
                      <div className="text-green-600 font-semibold mb-1">✓ Saved!</div>
                      <div className="text-xs text-gray-600">
                        Added to today's expenses
                        {webhookUrl && ' • Synced to Google Sheets'}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Voice Recording UI */}
            <AnimatePresence>
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="shadow-xl shadow-green-100/50 mb-6">
                    <CardContent className="p-8 text-center">
                      <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-base font-medium text-gray-700">Listening</span>
                      </div>

                      <div className="flex justify-center items-center gap-1 mb-8 h-16">
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-2 bg-gradient-to-t from-green-500 to-emerald-600 rounded-full"
                            animate={{
                              height: ['20%', '100%', '20%'],
                            }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              delay: i * 0.1,
                            }}
                          />
                        ))}
                      </div>

                      <div className="min-h-[60px] mb-8">
                        <p className="text-base text-gray-800 font-medium">
                          {transcript || 'Say what you spent'}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <Button onClick={stopRecording} className="flex-1" size="lg">
                          Done
                        </Button>
                        <Button onClick={cancelRecording} variant="secondary" className="flex-1" size="lg">
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Processing UI */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="shadow-xl shadow-green-100/50 mb-6">
                    <CardContent className="p-8 text-center">
                      <div className="text-base font-semibold text-gray-800 mb-6">
                        Processing
                      </div>
                      <div className="space-y-3 mb-6">
                        {['Extracting amount', 'Identifying merchant', 'Detecting category'].map((step, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-3 text-sm transition-all ${
                              processingStep >= index + 1 ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            <div className="w-5 h-5 flex items-center justify-center">
                              {processingStep >= index + 1 ? '✓' : '○'}
                            </div>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confirmation UI with Notes */}
            <AnimatePresence>
              {showConfirmation && confirmationData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                >
                  <Card className="shadow-xl shadow-green-100/50 mb-6">
                    <CardContent className="p-8 text-center">
                      {/* Editable Amount */}
                      {editingField === 'amount' ? (
                        <div className="mb-8">
                          <Input
                            type="number"
                            step="0.01"
                            value={tempEditValue}
                            onChange={(e) => setTempEditValue(e.target.value)}
                            className="text-5xl font-bold text-green-600 font-mono tabular-nums text-center"
                            autoFocus
                          />
                          <div className="flex gap-2 mt-4 justify-center">
                            <Button
                              size="sm"
                              onClick={() => {
                                updateConfirmationData('amount', parseFloat(tempEditValue));
                                setEditingField(null);
                              }}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setEditingField(null)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingField('amount');
                            setTempEditValue(confirmationData.amount.toString());
                          }}
                          className="text-5xl font-bold text-green-600 mb-8 font-mono tabular-nums cursor-pointer hover:bg-green-50 rounded-xl py-2 transition-colors"
                        >
                          {formatCurrency(confirmationData.amount)}
                        </div>
                      )}

                      <div className="space-y-4 mb-8">
                        {/* Editable Merchant */}
                        {editingField === 'merchant' ? (
                          <div className="bg-gray-50 rounded-xl p-4">
                            <div className="text-xs text-gray-500 mb-2">Merchant</div>
                            <Input
                              type="text"
                              value={tempEditValue}
                              onChange={(e) => setTempEditValue(e.target.value)}
                              className="text-xl font-semibold text-gray-900 text-center"
                              autoFocus
                            />
                            <div className="flex gap-2 mt-3 justify-center">
                              <Button
                                size="sm"
                                onClick={() => {
                                  updateConfirmationData('merchant', tempEditValue);
                                  setEditingField(null);
                                }}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setEditingField(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingField('merchant');
                              setTempEditValue(confirmationData.merchant);
                            }}
                            className="bg-gray-50 rounded-xl p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <div className="text-xs text-gray-500 mb-1">Merchant</div>
                            <div className="text-xl font-semibold text-gray-900 flex items-center justify-center gap-2">
                              {confirmationData.merchant}
                              <Edit2 className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                        )}

                        {/* Editable Category */}
                        <div
                          onClick={() => setShowCategorySelector(true)}
                          className="bg-gray-50 rounded-xl p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <div className="text-xs text-gray-500 mb-1">Category</div>
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-2xl">
                              {getCategoryStyle(confirmationData.category).icon}
                            </span>
                            <span className="text-base text-gray-600">
                              {confirmationData.category}
                            </span>
                            <Edit2 className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>

                        {/* Notes Field */}
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                            <StickyNote className="w-3 h-3" />
                            Note (optional)
                          </div>
                          <Input
                            type="text"
                            value={confirmationData.note}
                            onChange={(e) => updateConfirmationData('note', e.target.value)}
                            placeholder="Add a note..."
                            className="text-sm"
                          />
                        </div>
                      </div>

                      <Badge variant="default" className="mb-6">
                        Tap to edit • Confidence: {Math.round(confirmationData.confidence * 100)}%
                      </Badge>

                      <Button onClick={confirmTransaction} className="w-full mb-3" size="xl">
                        Looks Good
                      </Button>

                      <Button
                        onClick={() => setShowConfirmation(false)}
                        variant="ghost"
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Primary Action Button */}
            {!isRecording && !isProcessing && !showConfirmation && (
              <div className="mb-8">
                <Button
                  onClick={startRecording}
                  className="w-full shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300"
                  size="xl"
                >
                  <Mic className="w-6 h-6 mr-3" />
                  <span>Tap to Log</span>
                </Button>
                <p className="text-center text-sm text-gray-500 mt-4">
                  Say what you spent
                </p>
              </div>
            )}

            {/* Recent Transactions with Notes */}
            {transactions.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
                  Recent
                </div>
                <div className="space-y-3">
                  {transactions.map((transaction) => {
                    const categoryStyle = getCategoryStyle(transaction.category);
                    const isEditing = editingTransaction?.id === transaction.id;
                    
                    return (
                      <Card key={transaction.id} className="group hover:shadow-md transition-shadow transaction-card">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-start gap-3 flex-1">
                              <div className={`w-12 h-12 ${categoryStyle.bgColor} rounded-full border-2 ${categoryStyle.borderColor} flex items-center justify-center flex-shrink-0`}>
                                <span className="text-2xl">
                                  {categoryStyle.icon}
                                </span>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                {isEditing && editingField === 'merchant' ? (
                                  <Input
                                    type="text"
                                    value={tempEditValue}
                                    onChange={(e) => setTempEditValue(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        updateTransaction(transaction.id, 'merchant', tempEditValue);
                                        setEditingTransaction(null);
                                        setEditingField(null);
                                      }
                                    }}
                                    className="font-semibold text-gray-900 text-base"
                                    autoFocus
                                  />
                                ) : (
                                  <div
                                    onClick={() => {
                                      setEditingTransaction(transaction);
                                      setEditingField('merchant');
                                      setTempEditValue(transaction.merchant);
                                    }}
                                    className="font-semibold text-gray-900 text-base cursor-pointer hover:text-green-600 transition-colors"
                                  >
                                    {transaction.merchant}
                                  </div>
                                )}
                                
                                <div className="text-sm text-gray-500">
                                  {transaction.category}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {transaction.time}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {isEditing && editingField === 'amount' ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={tempEditValue}
                                  onChange={(e) => setTempEditValue(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      updateTransaction(transaction.id, 'amount', parseFloat(tempEditValue));
                                      setEditingTransaction(null);
                                      setEditingField(null);
                                    }
                                  }}
                                  className="text-base font-bold text-gray-900 font-mono tabular-nums w-24"
                                  autoFocus
                                />
                              ) : (
                                <div
                                  onClick={() => {
                                    setEditingTransaction(transaction);
                                    setEditingField('amount');
                                    setTempEditValue(transaction.amount.toString());
                                  }}
                                  className="text-base font-bold text-gray-900 font-mono tabular-nums cursor-pointer hover:text-green-600 transition-colors"
                                >
                                  {formatCurrency(transaction.amount)}
                                </div>
                              )}
                              
                              {/* Note icon - only show on hover if no note, or always if note exists */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingTransaction(transaction);
                                  setEditingField('note');
                                  setTempEditValue(transaction.note || '');
                                }}
                                className={`${transaction.note ? 'opacity-100 text-blue-500' : 'opacity-0 group-hover:opacity-100'} transition-opacity hover:bg-blue-50`}
                              >
                                <StickyNote className="w-4 h-4" />
                              </Button>

                              {/* Delete button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteTransaction(transaction.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Note Display/Edit - only show if note exists or editing */}
                          {isEditing && editingField === 'note' ? (
                            <div className="mt-2 flex gap-2">
                              <Input
                                type="text"
                                value={tempEditValue}
                                onChange={(e) => setTempEditValue(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    updateTransaction(transaction.id, 'note', tempEditValue);
                                    setEditingTransaction(null);
                                    setEditingField(null);
                                  }
                                }}
                                placeholder="Add a note..."
                                className="flex-1 text-sm"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={() => {
                                  updateTransaction(transaction.id, 'note', tempEditValue);
                                  setEditingTransaction(null);
                                  setEditingField(null);
                                }}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setEditingTransaction(null);
                                  setEditingField(null);
                                }}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : transaction.note ? (
                            <div className="mt-2 text-xs text-gray-600 bg-blue-50 px-3 py-2 rounded-lg flex items-start gap-2 border border-blue-100">
                              <StickyNote className="w-3 h-3 flex-shrink-0 mt-0.5 text-blue-500" />
                              <span className="flex-1">{transaction.note}</span>
                            </div>
                          ) : null}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty State */}
            {transactions.length === 0 && !isRecording && !isProcessing && !showConfirmation && (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle className="text-base mb-2">Ready to Track</CardTitle>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto">
                    Tap the button above to log your first expense
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Charts View */}
        {currentView === 'charts' && (
          <div>
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                      {getMonthName()}
                    </div>
                    <CardTitle className="text-3xl font-bold text-green-600 font-mono">
                      {formatCurrency(getMonthTotal())}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getCategoryTotals().map((item) => {
                    const categoryStyle = getCategoryStyle(item.category);
                    const percentage = (item.amount / getMonthTotal()) * 100;
                    const showLabelInside = percentage > 20; // Only show inside if bar is wide enough
                    
                    return (
                      <div key={item.category} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{categoryStyle.icon}</span>
                            <span className="font-medium text-gray-700">{item.category}</span>
                          </div>
                          {!showLabelInside && (
                            <span className="font-bold text-gray-900 font-mono tabular-nums text-sm">
                              {formatCurrency(item.amount)}
                            </span>
                          )}
                        </div>
                        <div className="relative h-10 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`absolute inset-y-0 left-0 ${categoryStyle.bgColor} flex items-center justify-end px-4 transition-all duration-500 shadow-sm`}
                            style={{ 
                              width: `${Math.max(percentage, 8)}%`,
                              background: `linear-gradient(to right, ${categoryStyle.color}, ${categoryStyle.color}dd)`
                            }}
                          >
                            {showLabelInside && (
                              <span className="text-sm font-bold text-white font-mono tabular-nums">
                                {formatCurrency(item.amount)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {getCategoryTotals().length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-2">
                      <BarChart3 className="w-12 h-12 mx-auto" />
                    </div>
                    <p className="text-sm text-gray-500">
                      No spending data for this month yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Global Dialogs - Outside view conditionals */}
      
      {/* Category Selector Dialog */}
      <Dialog open={showCategorySelector} onOpenChange={setShowCategorySelector}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Category</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {categories.map((cat) => (
              <Button
                key={cat.name}
                variant="outline"
                className={`${cat.bgColor} ${cat.borderColor} border-2 h-auto py-4 flex flex-col items-center gap-2 hover:opacity-80`}
                onClick={() => {
                  if (showConfirmation) {
                    updateConfirmationData('category', cat.name);
                  }
                  setShowCategorySelector(false);
                }}
              >
                <div className="text-3xl">{cat.icon}</div>
                <div className={`text-xs font-semibold text-white text-center`}>
                  {cat.name}
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear Month Confirmation Dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="z-50">
          <DialogHeader>
            <DialogTitle>Clear All Data?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This will permanently delete all transactions for <strong>{getMonthName()}</strong>.
            </p>
            <p className="text-sm text-red-600 font-semibold">
              This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <Button
                variant="destructive"
                className="flex-1 bg-red-500 hover:bg-red-600"
                onClick={clearMonthData}
              >
                Yes, Delete All
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
