import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, IndianRupee, TrendingUp, Calendar, LogOut, ArrowRight, Sparkles, Plus, User, Download, Upload, Shield } from 'lucide-react';
import { Preferences } from '@capacitor/preferences';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with JWT token
const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  const { value: token } = await Preferences.get({ key: 'token' });
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [particles, setParticles] = useState([]);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState('');

  useEffect(() => {
    fetchDashboard();
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

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
            <div className="flex items-center gap-3 animate-fade-in-up w-full sm:w-auto">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center animate-glow flex-shrink-0">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">SmartKhata</h1>
                <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  <span className="truncate">Welcome, {user?.name}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowBackupModal(true)}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-400/30 transition-all duration-300 animate-fade-in-up w-full sm:w-auto text-sm sm:text-base"
              style={{ animationDelay: '0.1s' }}
            >
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              Backup
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-red-400 to-pink-400 text-white rounded-xl hover:shadow-lg hover:shadow-red-400/30 transition-all duration-300 animate-fade-in-up w-full sm:w-auto text-sm sm:text-base"
              style={{ animationDelay: '0.15s' }}
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              Logout
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 flex flex-col gap-4 sm:gap-8">
          {/* Top Customers with Outstanding - Order 1 on mobile, default on desktop */}
          <div className="premium-card p-3 sm:p-6 animate-fade-in-up order-1 sm:order-3" style={{ animationDelay: '0.6s' }}>
            <div className="flex flex-row justify-between items-center mb-3 sm:mb-6 gap-2">
              <h2 className="text-base sm:text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
                <span className="truncate">Top Outstanding</span>
              </h2>
              <button
                onClick={() => navigate('/customers')}
                className="flex items-center gap-1 sm:gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors text-xs sm:text-base px-2 sm:px-0"
              >
                <span className="hidden sm:inline">View All</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {stats?.customersWithOutstanding?.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {stats.customersWithOutstanding.map((customer, index) => (
                  <div
                    key={customer.id}
                    onClick={() => navigate(`/customers/${customer.id}`)}
                    className="flex items-center justify-between p-2.5 sm:p-4 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl hover:bg-gray-100 hover:scale-[1.01] cursor-pointer transition-all duration-300 animate-fade-in-up"
                    style={{ animationDelay: `${0.7 + index * 0.1}s` }}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-xs sm:text-base truncate">{customer.name}</p>
                        <p className="text-[10px] sm:text-sm text-gray-500 truncate hidden sm:block">{customer.phone}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      <p className="text-sm sm:text-xl font-bold text-red-500">
                        ₹{customer.balance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-12">
                <div className="w-12 h-12 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
                  <IndianRupee className="w-6 h-6 sm:w-10 sm:h-10 text-gray-400" />
                </div>
                <p className="text-gray-500 text-xs sm:text-base">No outstanding balances</p>
              </div>
            )}
          </div>

          {/* Quick Actions - Order 2 on mobile, default on desktop */}
          <div className="flex justify-center animate-fade-in-up order-2 sm:order-4" style={{ animationDelay: '0.8s' }}>
            <button
              onClick={() => navigate('/customers')}
              className="premium-button flex items-center justify-center gap-3 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
            >
              <Plus className="w-5 h-5" />
              Manage Customers
            </button>
          </div>

          {/* Stats Cards - Order 3 on mobile, default on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 animate-fade-in-up order-3 sm:order-1" style={{ animationDelay: '0.1s' }}>
            <div className="premium-card p-4 sm:p-6 card-3d" style={{ animationDelay: '0.1s' }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">Total Customers</p>
                  <p className="text-2xl sm:text-4xl font-bold text-gray-800">{stats?.totalCustomers || 0}</p>
                </div>
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl flex items-center justify-center animate-float flex-shrink-0">
                  <Users className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="premium-card p-4 sm:p-6 card-3d" style={{ animationDelay: '0.2s' }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">Total Outstanding</p>
                  <p className="text-2xl sm:text-4xl font-bold text-red-500">
                    ₹{stats?.totalOutstanding?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-red-400 to-orange-400 rounded-2xl flex items-center justify-center animate-float-reverse flex-shrink-0">
                  <IndianRupee className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="premium-card p-4 sm:p-6 card-3d" style={{ animationDelay: '0.3s' }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">Total Collected</p>
                  <p className="text-2xl sm:text-4xl font-bold text-green-500">
                    ₹{stats?.totalCollected?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-green-400 to-emerald-400 rounded-2xl flex items-center justify-center animate-float flex-shrink-0">
                  <TrendingUp className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="premium-card p-4 sm:p-6 card-3d" style={{ animationDelay: '0.4s' }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">Today's Transactions</p>
                  <p className="text-2xl sm:text-4xl font-bold text-purple-500">
                    {stats?.todaySummary?.transactions || 0}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center animate-float-reverse flex-shrink-0">
                  <Calendar className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Today's Summary - Order 4 on mobile, default on desktop */}
          <div className="premium-card p-4 sm:p-6 animate-fade-in-up order-4 sm:order-2" style={{ animationDelay: '0.5s' }}>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
              Today's Summary
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 border border-green-200 rounded-2xl p-4 sm:p-6 hover:scale-105 transition-transform duration-300">
                <p className="text-xs sm:text-sm text-green-700 mb-2">Credit Given</p>
                <p className="text-xl sm:text-3xl font-bold text-green-600">
                  ₹{stats?.todaySummary?.credit?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 border border-blue-200 rounded-2xl p-4 sm:p-6 hover:scale-105 transition-transform duration-300">
                <p className="text-xs sm:text-sm text-blue-700 mb-2">Payment Received</p>
                <p className="text-xl sm:text-3xl font-bold text-blue-600">
                  ₹{stats?.todaySummary?.debit?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Backup/Restore Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="premium-card p-4 sm:p-8 w-full max-w-md animate-scale-in">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-6 flex items-center gap-2">
              <Shield className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-500" />
              Backup & Restore
            </h2>

            {importResult && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded-xl mb-3 sm:mb-4 animate-fade-in">
                <p className="font-semibold text-sm sm:text-base">Restore Successful!</p>
                <p className="text-xs sm:text-sm mt-1">Customers: {importResult.customers}, Transactions: {importResult.transactions}, Reminders: {importResult.reminders}</p>
              </div>
            )}

            {importError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 sm:px-4 py-2 sm:py-3 rounded-xl mb-3 sm:mb-4 animate-fade-in text-xs sm:text-sm">
                {importError}
              </div>
            )}

            {/* Export Backup */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-3 sm:p-5 mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Download className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-xs sm:text-base">Export Backup (PDF)</h3>
                  <p className="text-[10px] sm:text-sm text-gray-600">Download all your data as a PDF report</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    const response = await api.get('/backup/export', {
                      responseType: 'blob'
                    });
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `smartkhata_backup_${new Date().toISOString().slice(0, 10)}.pdf`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                  } catch (err) {
                    setImportError('Failed to export backup');
                  }
                }}
                className="w-full premium-button flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-base py-2 sm:py-2.5"
              >
                <Download className="w-3 h-3 sm:w-5 sm:h-5" />
                Download PDF
              </button>
            </div>

            {/* Import Backup */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-3 sm:p-5 mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Upload className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-xs sm:text-base">Restore Backup</h3>
                  <p className="text-[10px] sm:text-sm text-gray-600">Import data from a backup file</p>
                </div>
              </div>
              <input
                type="file"
                accept=".json"
                id="backupFileInput"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setImporting(true);
                  setImportResult(null);
                  setImportError('');
                  try {
                    const text = await file.text();
                    const backupData = JSON.parse(text);
                    if (!backupData.customers) {
                      setImportError('Invalid backup file');
                      setImporting(false);
                      return;
                    }
                    const response = await api.post('/backup/import', { backupData });
                    setImportResult(response.data.imported);
                    fetchDashboard();
                  } catch (err) {
                    setImportError(err.response?.data?.error || 'Failed to import backup');
                  } finally {
                    setImporting(false);
                    e.target.value = '';
                  }
                }}
              />
              <button
                onClick={() => document.getElementById('backupFileInput').click()}
                disabled={importing}
                className={`w-full premium-button flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-base py-2 sm:py-2.5 ${importing ? 'opacity-60' : ''}`}
              >
                {importing ? (
                  <>
                    <div className="loading-spinner w-3 h-3 sm:w-5 sm:h-5"></div>
                    Restoring...
                  </>
                ) : (
                  <>
                    <Upload className="w-3 h-3 sm:w-5 sm:h-5" />
                    Choose File
                  </>
                )}
              </button>
            </div>

            {/* Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-2 sm:p-4 mb-3 sm:mb-4">
              <p className="text-[10px] sm:text-sm text-gray-600 leading-relaxed">
                <strong>Note:</strong> Export backup saves all your data as a PDF report for printing/sharing. Import restores data from a JSON backup file. Duplicates are automatically skipped during import.
              </p>
            </div>

            <button
              onClick={() => {
                setShowBackupModal(false);
                setImportResult(null);
                setImportError('');
              }}
              className="w-full px-3 sm:px-6 py-2 sm:py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-xs sm:text-base"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
