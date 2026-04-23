import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Plus, Phone, User, Trash2, Edit, ArrowLeft, Sparkles } from 'lucide-react';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Storage helpers
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
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [particles, setParticles] = useState([]);
  const [isValidPhone, setIsValidPhone] = useState(false);

  useEffect(() => {
    fetchCustomers();
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
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) {
      fetchCustomers();
      return;
    }

    try {
      const response = await api.get(`/customers/search?query=${searchQuery}`);
      setCustomers(response.data.customers);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    
    // Remove +91 prefix and spaces from phone number
    const cleanPhone = formData.phone.replace('+91', '').replace(/\s/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      alert('Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9');
      return;
    }
    
    try {
      await api.post('/customers', { ...formData, phone: cleanPhone });
      setShowAddModal(false);
      setFormData({ name: '', phone: '' });
      setIsValidPhone(false);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to add customer:', error);
    }
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    
    // Remove +91 prefix and spaces from phone number
    const cleanPhone = formData.phone.replace('+91', '').replace(/\s/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      alert('Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9');
      return;
    }
    
    try {
      await api.put(`/customers/${editingCustomer._id}`, { ...formData, phone: cleanPhone });
      setEditingCustomer(null);
      setFormData({ name: '', phone: '' });
      setIsValidPhone(false);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to update customer:', error);
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;

    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to delete customer:', error);
    }
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({ name: customer.name, phone: customer.phone });
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingCustomer(null);
    setFormData({ name: '', phone: '' });
    setIsValidPhone(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-purple-50 to-blue-100 animate-gradient"></div>
        <div className="loading-spinner w-16 h-16 relative z-10"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-purple-50 to-blue-100 animate-gradient"></div>
      
      {/* Floating Particles */}
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

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="glass-dark border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors animate-fade-in-up w-full sm:w-auto justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
              Customers
            </h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 animate-fade-in-up w-full sm:w-auto justify-center"
              style={{ animationDelay: '0.2s' }}
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Add Customer
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
          {/* Search Bar */}
          <div className="premium-card p-4 sm:p-6 mb-4 sm:mb-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-purple-500 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search customers by name or phone..."
                  className="premium-input w-full pl-10 sm:pl-12 text-sm sm:text-base"
                />
              </div>
              <button
                onClick={handleSearch}
                className="premium-button flex items-center justify-center gap-2 text-sm sm:text-base px-4 sm:px-6"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                Search
              </button>
            </div>
          </div>

          {/* Customers List */}
          <div className="premium-card animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {customers.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {customers.map((customer, index) => (
                  <div
                    key={customer._id}
                    className="p-4 sm:p-6 hover:bg-gray-50 transition-all duration-300 animate-fade-in-up"
                    style={{ animationDelay: `${0.5 + index * 0.05}s` }}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                      <div
                        className="flex-1 cursor-pointer w-full"
                        onClick={() => navigate(`/customers/${customer._id}`)}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center animate-float flex-shrink-0">
                            <User className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-base sm:text-lg truncate">{customer.name}</p>
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                              <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span className="truncate">{customer.phone}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right">
                          <p className="text-xs sm:text-sm text-gray-500 mb-1">Balance</p>
                          <p className={`text-lg sm:text-2xl font-bold ${customer.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            ₹{customer.balance?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(customer)}
                            className="p-2 sm:p-3 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-xl transition-colors"
                          >
                            <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer._id)}
                            className="p-2 sm:p-3 bg-red-100 text-red-600 hover:bg-red-200 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16 animate-fade-in-up">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 animate-float">
                  <User className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
                </div>
                <p className="text-gray-500 text-base sm:text-lg mb-4">No customers found</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="premium-button inline-flex items-center gap-2 text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  Add your first customer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingCustomer) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="premium-card p-6 sm:p-8 w-full max-w-md animate-scale-in">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 sm:mb-8 flex items-center gap-2">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            <form onSubmit={editingCustomer ? handleUpdateCustomer : handleAddCustomer} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="premium-input w-full text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                  Phone Number
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-gray-50 border border-gray-300 rounded-l-xl px-3 py-2 sm:py-3">
                    <span className="text-gray-500 font-medium text-sm sm:text-base">+91</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.phone}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length > 0 && !['6', '7', '8', '9'].includes(value[0])) {
                        value = '';
                      }
                      if (value.length > 10) {
                        value = value.slice(0, 10);
                      }
                      setFormData({ ...formData, phone: value });
                      const phoneRegex = /^[6-9]\d{9}$/;
                      setIsValidPhone(value.length === 10 && phoneRegex.test(value));
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pastedText = e.clipboardData.getData('text');
                      const digitsOnly = pastedText.replace(/\D/g, '');
                      const phoneRegex = /^[6-9]\d{9}$/;
                      if (phoneRegex.test(digitsOnly)) {
                        setFormData({ ...formData, phone: digitsOnly });
                        setIsValidPhone(true);
                      } else if (digitsOnly.length > 0 && ['6', '7', '8', '9'].includes(digitsOnly[0])) {
                        setFormData({ ...formData, phone: digitsOnly.slice(0, 10) });
                        setIsValidPhone(digitsOnly.length >= 10 && phoneRegex.test(digitsOnly.slice(0, 10)));
                      }
                    }}
                    placeholder="Enter 10-digit number"
                    maxLength={10}
                    className="premium-input flex-1 rounded-l-none text-sm sm:text-base"
                    required
                  />
                </div>
                {formData.phone.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    {formData.phone.length === 10 && isValidPhone ? (
                      <div className="flex items-center gap-1 text-green-600 text-xs sm:text-sm">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        Valid number
                      </div>
                    ) : formData.phone.length === 10 ? (
                      <div className="flex items-center gap-1 text-red-600 text-xs sm:text-sm">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        Invalid number
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">
                        {formData.phone.length}/10 digits
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  Enter valid Indian mobile number (e.g., 9876543210)
                </p>
              </div>
              <div className="flex gap-3 sm:gap-4 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isValidPhone}
                  className={`flex-1 premium-button text-sm sm:text-base transition-all duration-300 ${
                    isValidPhone ? 'scale-105' : 'opacity-80'
                  }`}
                >
                  {editingCustomer ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
