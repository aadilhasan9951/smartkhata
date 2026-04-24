import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Plus, IndianRupee, Trash2, Send, Calendar, Bell, Sparkles } from 'lucide-react';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';

const WhatsAppShare = registerPlugin('WhatsAppShare');
const SMSPermission = registerPlugin('SMSPermission');

const API_URL = process.env.REACT_APP_API_URL || 'https://smartkhata-8jaj.onrender.com/api';

// Hybrid storage - Preferences for native, localStorage for web
const isNative = Capacitor.isNativePlatform();

const getToken = async () => {
  if (isNative) {
    const { value } = await Preferences.get({ key: 'token' });
    return value;
  }
  return localStorage.getItem('token');
};

// Create axios instance with JWT token
const api = axios.create({
  baseURL: API_URL,
  withCredentials: false
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [showBalanceImageModal, setShowBalanceImageModal] = useState(false);
  const [balanceImageUrl, setBalanceImageUrl] = useState('');
  const [showReminderSuccessModal, setShowReminderSuccessModal] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    amount: '',
    type: 'credit',
    note: ''
  });
  const [reminderSettings, setReminderSettings] = useState({
    frequency: 'weekly',
    day_of_week: 1,
    time_of_day: '10:00',
    active: true
  });
  const [existingReminder, setExistingReminder] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [particles, setParticles] = useState([]);

  const fetchCustomerData = useCallback(async () => {
    try {
      const customerResponse = await api.get(`/customers/${id}`);
      setCustomer(customerResponse.data);

      let url = `/transactions/customer/${id}`;
      if (filterType !== 'all') {
        url += `?type=${filterType}`;
      }
      const transactionsResponse = await api.get(url);
      setTransactions(transactionsResponse.data.transactions);
    } catch (error) {
      console.error('Failed to fetch customer data:', error);
    } finally {
      setLoading(false);
    }
  }, [id, filterType]);

  const fetchReminderSchedule = useCallback(async () => {
    try {
      const response = await api.get(`/reminders/customer/${id}`);
      if (response.data.schedule) {
        setExistingReminder(response.data.schedule);
        setReminderSettings({
          frequency: response.data.schedule.frequency,
          day_of_week: response.data.schedule.day_of_week,
          time_of_day: response.data.schedule.time_of_day,
          active: response.data.schedule.active
        });
      }
    } catch (error) {
      console.error('Failed to fetch reminder schedule:', error);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomerData();
    fetchReminderSchedule();
    // Create particles
    const newParticles = [];
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 4 + 2,
        delay: Math.random() * 5,
        duration: Math.random() * 10 + 10
      });
    }
    setParticles(newParticles);
  }, [id, filterType, fetchCustomerData, fetchReminderSchedule]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transactions', {
        customer_id: id,
        amount: parseFloat(transactionForm.amount),
        type: transactionForm.type,
        note: transactionForm.note
      });
      setShowAddTransaction(false);
      setTransactionForm({ amount: '', type: 'credit', note: '' });
      fetchCustomerData();
    } catch (error) {
      console.error('Failed to add transaction:', error);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;

    try {
      await api.delete(`/transactions/${transactionId}`);
      fetchCustomerData();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const handleSendReminder = () => {
    // Generate balance image
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, '#7C3AED');
    gradient.addColorStop(1, '#EC4899');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 400);
    
    // White card
    ctx.fillStyle = '#FFFFFF';
    ctx.roundRect(50, 50, 500, 300, 20);
    ctx.fill();
    
    // Shop name
    ctx.fillStyle = '#7C3AED';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(user?.name || 'Shop', 300, 100);
    
    // Customer name
    ctx.fillStyle = '#374151';
    ctx.font = '18px Arial';
    ctx.fillText(`Customer: ${customer.name}`, 300, 140);
    
    // Balance label
    ctx.fillStyle = '#6B7280';
    ctx.font = '16px Arial';
    ctx.fillText('Outstanding Balance', 300, 180);
    
    // Balance amount
    ctx.fillStyle = customer.balance > 0 ? '#DC2626' : '#059669';
    ctx.font = 'bold 48px Arial';
    ctx.fillText(`₹${customer.balance?.toFixed(2) || '0.00'}`, 300, 240);
    
    // Date
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '14px Arial';
    ctx.fillText(new Date().toLocaleDateString('en-IN'), 300, 300);
    
    // Convert to blob
    canvas.toBlob((blob) => {
      const safeName = customer.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'customer';
      const fileName = `balance_${safeName}_${Date.now()}.png`;
      const file = new File([blob], fileName, { type: 'image/png', lastModified: Date.now() });
      const message = `Hello ${customer.name}, your outstanding balance is ₹${customer.balance?.toFixed(2)}. Please pay when possible. - ${user?.name || 'Shop'}`;
      
      // Try Web Share API (works on mobile)
      if (navigator.share && navigator.canShare) {
        const shareData = {
          files: [file],
          text: message
        };
        
        if (navigator.canShare(shareData)) {
          navigator.share(shareData).catch((err) => {
            console.log('Share failed, falling back to WhatsApp');
            fallbackToWhatsApp(message, canvas);
          });
        } else {
          fallbackToWhatsApp(message, canvas);
        }
      } else {
        fallbackToWhatsApp(message, canvas);
      }
    }, 'image/png');
  };
  
  const fallbackToWhatsApp = (message, canvas) => {
    const imageUrl = canvas.toDataURL('image/png');
    setBalanceImageUrl(imageUrl);
    setShowBalanceImageModal(true);
  };

  const handleSaveReminder = async () => {
    try {
      // Request SMS permission on Android
      if (Capacitor.isNativePlatform()) {
        const { granted } = await SMSPermission.checkPermission();
        if (!granted) {
          const permissionResult = await SMSPermission.requestPermission();
          if (!permissionResult.granted) {
            alert('SMS permission is required for auto reminders. Please grant permission in settings.');
            return;
          }
        }
      }
      
      await api.post('/reminders', {
        customer_id: id,
        ...reminderSettings
      });
      setShowReminderSettings(false);
      fetchReminderSchedule();
      
      // Show success modal
      setShowReminderSuccessModal(true);
    } catch (error) {
      console.error('Failed to save reminder:', error);
      alert('Failed to set reminder. Please try again.');
    }
  };

  const handleSendSMSReminder = async () => {
    try {
      // Request SMS permission on Android
      if (Capacitor.isNativePlatform()) {
        const { granted } = await SMSPermission.checkPermission();
        if (!granted) {
          const permissionResult = await SMSPermission.requestPermission();
          if (!permissionResult.granted) {
            alert('SMS permission is required to send reminders. Please grant permission in settings.');
            return;
          }
        }
      }
      
      const message = `Dear ${customer.name}, your pending amount is ₹${customer.balance?.toFixed(2)}. Please clear your dues. - ${user?.name || 'Shop'}`;
      
      // Call backend to send SMS
      await api.post('/reminders/send-sms', {
        phone: customer.phone,
        message: message
      });
      
      alert('SMS reminder sent successfully!');
    } catch (error) {
      console.error('Failed to send SMS reminder:', error);
      alert('Failed to send SMS reminder. Please try again.');
    }
  };

  const handleToggleReminder = async () => {
    if (!existingReminder) return;
    
    try {
      await api.patch(`/reminders/${existingReminder._id}/toggle`, {});
      fetchReminderSchedule();
    } catch (error) {
      console.error('Failed to toggle reminder:', error);
    }
  };

  const handleDeleteReminder = async () => {
    if (!existingReminder) return;
    
    if (!window.confirm('Are you sure you want to delete this reminder schedule?')) return;

    try {
      await api.delete(`/reminders/${existingReminder._id}`);
      
      // If running on Android app, cancel local reminder
      if (window.AndroidInterface && window.AndroidInterface.cancelReminder) {
        window.AndroidInterface.cancelReminder(customer.phone);
      }
      
      setExistingReminder(null);
      setShowReminderSettings(false);
    } catch (error) {
      console.error('Failed to delete reminder:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 animate-gradient"></div>
        <div className="loading-spinner w-16 h-16 relative z-10"></div>
      </div>
    );
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-purple-50 to-blue-100 animate-gradient"></div>
      
      <div className="particles">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        <div className="glass-dark border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/customers')}
              className="text-purple-600 hover:text-purple-700 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">{customer?.name}</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <div className="premium-card p-4 sm:p-8 mb-4 sm:mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-4 sm:mb-8 gap-4">
              <div className="w-full sm:w-auto">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2 truncate">{customer?.name}</h2>
                <p className="text-xs sm:text-sm text-gray-500 truncate">{customer?.phone}</p>
              </div>
              <div className="text-right w-full sm:w-auto">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Current Balance</p>
                <p className={`text-2xl sm:text-4xl font-bold ${customer?.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  ₹{customer?.balance?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <button
                onClick={() => setShowAddTransaction(true)}
                className="premium-button flex items-center justify-center gap-2 text-xs sm:text-sm py-2 sm:py-3"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="truncate">Add Transaction</span>
              </button>
              <button
                onClick={handleSendReminder}
                className="premium-button flex items-center justify-center gap-2 text-xs sm:text-sm py-2 sm:py-3"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="truncate">WhatsApp</span>
              </button>
              <button
                onClick={handleSendSMSReminder}
                className="premium-button flex items-center justify-center gap-2 text-xs sm:text-sm py-2 sm:py-3"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="truncate">SMS</span>
              </button>
              <button
                onClick={() => setShowReminderSettings(true)}
                className="premium-button flex items-center justify-center gap-2 text-xs sm:text-sm py-2 sm:py-3"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="truncate">Auto Reminder</span>
              </button>
            </div>

            {existingReminder && (
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base text-gray-800 font-medium truncate">
                      {existingReminder.active ? 'Reminder Active' : 'Reminder Paused'}
                    </p>
                    <p className="text-[10px] sm:text-sm text-gray-500 truncate">
                      {existingReminder.frequency.charAt(0).toUpperCase() + existingReminder.frequency.slice(1)} at {existingReminder.time_of_day}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleToggleReminder}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-colors w-full sm:w-auto text-xs sm:text-sm ${
                    existingReminder.active ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' : 'bg-green-100 text-green-600 hover:bg-green-200'
                  }`}
                >
                  {existingReminder.active ? 'Pause' : 'Activate'}
                </button>
              </div>
            )}
          </div>

          <div className="premium-card p-3 sm:p-6 mb-4 sm:mb-8">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-colors text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                  filterType === 'all' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('credit')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-colors text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                  filterType === 'credit' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Credit
              </button>
              <button
                onClick={() => setFilterType('debit')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-colors text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                  filterType === 'debit' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Debit
              </button>
            </div>
          </div>

          <div className="premium-card">
            <h3 className="text-base sm:text-xl font-semibold text-gray-800 p-4 sm:p-6 border-b border-gray-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
              Transaction History
            </h3>
            {transactions.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <div key={transaction._id} className="p-3 sm:p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-sm font-medium rounded-lg sm:rounded-xl ${
                            transaction.type === 'credit' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                          </span>
                          <span className="text-[10px] sm:text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                            {new Date(transaction.date).toLocaleDateString()} at {new Date(transaction.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        {transaction.note && (
                          <p className="text-xs sm:text-sm text-gray-500 truncate">{transaction.note}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <p className={`text-lg sm:text-2xl font-bold ${
                          transaction.type === 'credit' ? 'text-red-500' : 'text-green-500'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                        </p>
                        <button
                          onClick={() => handleDeleteTransaction(transaction._id)}
                          className="p-2 sm:p-3 bg-red-100 text-red-600 hover:bg-red-200 rounded-xl transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-16">
                <IndianRupee className="w-12 h-12 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-3 sm:mb-6" />
                <p className="text-gray-500 text-sm sm:text-base">No transactions found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddTransaction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="premium-card p-4 sm:p-8 w-full max-w-md animate-scale-in">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-8 flex items-center gap-2">
              <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-purple-500" />
              Add Transaction
            </h2>
            <form onSubmit={handleAddTransaction} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Transaction Type</label>
                <div className="flex gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setTransactionForm({ ...transactionForm, type: 'credit' })}
                    className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-colors text-sm sm:text-base ${
                      transactionForm.type === 'credit' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Credit (Give)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionForm({ ...transactionForm, type: 'debit' })}
                    className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-colors text-sm sm:text-base ${
                      transactionForm.type === 'debit' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Debit (Receive)
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Amount</label>
                <input
                  type="number"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                  className="premium-input w-full text-sm sm:text-base"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Note (Optional)</label>
                <textarea
                  value={transactionForm.note}
                  onChange={(e) => setTransactionForm({ ...transactionForm, note: e.target.value })}
                  className="premium-input w-full text-sm sm:text-base"
                  rows="2"
                />
              </div>
              <div className="flex gap-3 sm:gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddTransaction(false)}
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 premium-button text-sm sm:text-base"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReminderSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="premium-card p-4 sm:p-8 w-full max-w-md animate-scale-in">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-8 flex items-center gap-2">
              <Bell className="w-4 h-4 sm:w-6 sm:h-6 text-purple-500" />
              Reminder Settings
            </h2>
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Frequency</label>
                <select
                  value={reminderSettings.frequency}
                  onChange={(e) => setReminderSettings({ ...reminderSettings, frequency: e.target.value })}
                  className="premium-input w-full text-sm sm:text-base"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              {reminderSettings.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Day of Week</label>
                  <select
                    value={reminderSettings.day_of_week}
                    onChange={(e) => setReminderSettings({ ...reminderSettings, day_of_week: parseInt(e.target.value) })}
                    className="premium-input w-full text-sm sm:text-base"
                  >
                    {days.map((day, index) => (
                      <option key={day} value={index}>{day}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Time</label>
                <input
                  type="time"
                  value={reminderSettings.time_of_day}
                  onChange={(e) => setReminderSettings({ ...reminderSettings, time_of_day: e.target.value })}
                  className="premium-input w-full text-sm sm:text-base"
                />
              </div>
              
              <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-100 rounded-xl">
                <span className="text-sm sm:text-base text-gray-800 font-medium">Active</span>
                <button
                  type="button"
                  onClick={() => setReminderSettings({ ...reminderSettings, active: !reminderSettings.active })}
                  className={`w-10 h-6 sm:w-12 sm:h-6 rounded-full transition-colors ${
                    reminderSettings.active ? 'bg-purple-500' : 'bg-gray-400'
                  }`}
                >
                  <div className={`w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full transform transition-transform ${
                    reminderSettings.active ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              
              <div className="flex gap-3 sm:gap-4 pt-4">
                {existingReminder && (
                  <button
                    onClick={handleDeleteReminder}
                    className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors text-sm sm:text-base"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={() => setShowReminderSettings(false)}
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveReminder}
                  className="flex-1 premium-button text-sm sm:text-base"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBalanceImageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="premium-card p-4 sm:p-8 w-full max-w-md animate-scale-in">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
              <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-purple-500" />
              Balance Image
            </h2>
            
            <div className="bg-gray-100 rounded-xl p-4 mb-4 flex justify-center">
              <img src={balanceImageUrl} alt="Balance" className="max-w-full h-auto rounded-lg" />
            </div>
            
            <p className="text-xs sm:text-sm text-gray-600 mb-4 text-center">
              This image shows the outstanding balance. Send it via WhatsApp.
            </p>
            
            <div className="flex gap-3 sm:gap-4">
              <button
                onClick={async () => {
                  try {
                    // Convert dataURL to blob
                    const response = await fetch(balanceImageUrl);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `balance_${customer.name}.png`;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    
                    // Cleanup
                    setTimeout(() => window.URL.revokeObjectURL(url), 100);
                  } catch (err) {
                    console.error('Download error:', err);
                    alert('Failed to download image');
                  }
                }}
                className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm sm:text-base"
              >
                Download Image
              </button>
              <button
                onClick={async () => {
                  const message = `Hello ${customer.name}, your outstanding balance is ₹${customer.balance?.toFixed(2)}. Please pay when possible. - ${user?.name || 'Shop'}`;
                  
                  try {
                    // Try native Android plugin first
                    if (Capacitor.isNativePlatform() && WhatsAppShare) {
                      await WhatsAppShare.shareImage({
                        imageData: balanceImageUrl,
                        message: message
                      });
                      setShowBalanceImageModal(false);
                      setBalanceImageUrl('');
                      return;
                    }
                    
                    // Fallback to Web Share API
                    const response = await fetch(balanceImageUrl);
                    const blob = await response.blob();
                    const file = new File([blob], `balance_${customer.name}.png`, { type: 'image/png' });
                    
                    if (navigator.share && navigator.canShare) {
                      const shareData = {
                        files: [file],
                        text: message
                      };
                      
                      if (navigator.canShare(shareData)) {
                        await navigator.share(shareData);
                        setShowBalanceImageModal(false);
                        setBalanceImageUrl('');
                        return;
                      }
                    }
                    
                    // Fallback: Open WhatsApp with text only
                    const cleanPhone = customer.phone.replace('+91', '').replace(/\s/g, '');
                    const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                    setShowBalanceImageModal(false);
                    setBalanceImageUrl('');
                  } catch (err) {
                    console.error('Share error:', err);
                    // Fallback to text-only WhatsApp
                    const cleanPhone = customer.phone.replace('+91', '').replace(/\s/g, '');
                    const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                    setShowBalanceImageModal(false);
                    setBalanceImageUrl('');
                  }
                }}
                className="flex-1 premium-button text-sm sm:text-base"
              >
                Send via WhatsApp
              </button>
            </div>
            <button
              onClick={() => {
                setShowBalanceImageModal(false);
                setBalanceImageUrl('');
              }}
              className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors text-xs sm:text-sm mt-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showReminderSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="premium-card p-6 sm:p-8 w-full max-w-md animate-scale-in text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Bell className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">
              Reminder Set Successfully!
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Reminder has been set for <span className="font-semibold text-purple-600">{customer.name}</span>
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
              {reminderSettings.frequency.charAt(0).toUpperCase() + reminderSettings.frequency.slice(1)} at {reminderSettings.time_of_day}
            </p>
            <button
              onClick={() => setShowReminderSuccessModal(false)}
              className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-xl hover:shadow-lg hover:shadow-green-400/30 transition-all duration-300 text-sm sm:text-base font-semibold"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;
