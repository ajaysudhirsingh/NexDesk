import React, { useState, useEffect } from 'react';
import './App.css';


const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Icon component helper
const IconComponent = ({ icon, className = 'w-5 h-5' }) => {
  const iconMap = {
    chart: <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/></svg>,
    calendar: <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>,
    laptop: <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M20 3H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V5c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2z"/></svg>,
    users: <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm8 0c1.66 0 2.99-1.34 2.99-3S25.66 5 24 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.89 1.97 1.74 1.97 2.95V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
    desktop: <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M20 3H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V5c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2z"/></svg>,
    mobile: <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm5-3H7V4h10v13z"/></svg>,
    monitor: <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M20 3H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V5c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2z"/></svg>,
    printer: <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>,
    package: <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M18 6.5L12 3.82 6 6.5v11L12 20.18l6-3.68v-11zM12 5.18L16.82 7.5 12 9.82 7.18 7.5 12 5.18zM17 15.5l-5 3.07-5-3.07v-2.64L7 10.5v5l5 3.07 5-3.07v-5l-1 2.36v2.64z"/></svg>,
  };
  return iconMap[icon] || null;
};


import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, ResponsiveContainer
} from 'recharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import ITInfrastructureHealthAdvanced from './components/ITInfrastructureHealthAdvanced';
import PasswordInput from './components/PasswordInput';

const App = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    // Check if window is defined (browser environment)
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('token');
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [tickets, setTickets] = useState([]);
  const [closedTickets, setClosedTickets] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});

  // Login form state
  const [loginData, setLoginData] = useState({ username: '', password: '', client_code: '' });
  const [loginError, setLoginError] = useState('');

  
  // TOTP state
  const [requiresTOTP, setRequiresTOTP] = useState(false);
  const [requiresTOTPSetup, setRequiresTOTPSetup] = useState(false);
  const [totpToken, setTotpToken] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [totpSetupData, setTotpSetupData] = useState(null);
  const [setupToken, setSetupToken] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [requires2FASetup, setRequires2FASetup] = useState(false);
  const [twofaSetupData, setTwofaSetupData] = useState(null);

  // Ticket form state
  const [ticketForm, setTicketForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: ''
  });

  // Asset form state
  const [assetForm, setAssetForm] = useState({
    name: '',
    description: '',
    asset_type: '',
    value: 0,
    serial_number: ''
  });

  // Edit asset state
  const [editingAsset, setEditingAsset] = useState(null);
  const [editAssetForm, setEditAssetForm] = useState({
    name: '',
    description: '',
    asset_type: '',
    value: 0,
    serial_number: '',
    assigned_to: ''
  });

  // User form state
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });

  // Chat state
  const [newMessage, setNewMessage] = useState('');
  const [selectedChatUser, setSelectedChatUser] = useState(null);

  // Mobile navigation state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Sorting and filtering state
  const [ticketFilters, setTicketFilters] = useState({
    sort_by: 'created_at',
    sort_order: 'desc',
    status_filter: '',
    priority_filter: '',
    assigned_to_filter: '',
    created_by_filter: '',
    search: ''
  });
  const [filterOptions, setFilterOptions] = useState({});
  
  // Edit username state
  const [editingUser, setEditingUser] = useState(null);
  const [newUsername, setNewUsername] = useState('');

  // Modal states
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedClientForReset, setSelectedClientForReset] = useState('');
  const [closeComment, setCloseComment] = useState('');
  const [ticketToClose, setTicketToClose] = useState(null);
  const [userToReset, setUserToReset] = useState(null);
  const [newPassword, setNewPassword] = useState('');



  // Loading and message states
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageTimeout, setMessageTimeout] = useState(null);

  // Replace analyticsRange state with two separate states:
  const [analyticsFrom, setAnalyticsFrom] = useState(null);
  const [analyticsTo, setAnalyticsTo] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({});
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Add state for daily work analytics
  const [dailyWorkData, setDailyWorkData] = useState([]);

  // Add state for ticket priority volume
  const [priorityVolume, setPriorityVolume] = useState([]);

  // Add state for profile dropdown
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Add state to track read messages per user
  const [readMessages, setReadMessages] = useState({});

  // Reports state
  const [reportsData, setReportsData] = useState({});
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsFrom, setReportsFrom] = useState(null);
  const [reportsTo, setReportsTo] = useState(null);
  const [selectedReport, setSelectedReport] = useState(() => {
    // Set default report based on user role
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      return 'overview';
    } else {
      return 'daily';
    }
  });
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Teams state
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamMessages, setTeamMessages] = useState([]);
  const [newTeamMessage, setNewTeamMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // WebSocket state for real-time Teams chat
  const [teamWebSocket, setTeamWebSocket] = useState(null);
  const [isConnectedToTeam, setIsConnectedToTeam] = useState(false);
  const [showTicketDetailModal, setShowTicketDetailModal] = useState(false);
  const [selectedTicketDetail, setSelectedTicketDetail] = useState(null);
  const [showAssetDetailModal, setShowAssetDetailModal] = useState(false);
  const [selectedAssetDetail, setSelectedAssetDetail] = useState(null);
  const [teamForm, setTeamForm] = useState({
    name: '',
    description: '',
    manager_id: ''
  });
  const [editingTeam, setEditingTeam] = useState(null);
  const [editTeamForm, setEditTeamForm] = useState({
    name: '',
    description: '',
    manager_id: ''
  });
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [teamToAddMember, setTeamToAddMember] = useState(null);
  const [memberToAdd, setMemberToAdd] = useState('');

  // Client management state
  const [clients, setClients] = useState([]);
  const [clientForm, setClientForm] = useState({
    name: '',
    code: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    user_limit: 10,
    asset_limit: 50
  });
  const [editingClient, setEditingClient] = useState(null);
  const [editClientForm, setEditClientForm] = useState({
    name: '',
    code: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    user_limit: 10,
    asset_limit: 50
  });
  const [showInactiveClients, setShowInactiveClients] = useState(true);
  const [clientStats, setClientStats] = useState({});
  const [editingUserLimit, setEditingUserLimit] = useState(null);
  const [userLimitForm, setUserLimitForm] = useState({ user_limit: 10 });
  const [editingAssetLimit, setEditingAssetLimit] = useState(null);
  const [assetLimitForm, setAssetLimitForm] = useState({ asset_limit: 50 });

  const visibleUsers = user && user.role === 'superadmin' ? users : users.filter(u => u.role !== 'superadmin');

  // Mobile detection useEffect
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (messageTimeout) {
        clearTimeout(messageTimeout);
      }
    };
  }, [messageTimeout]);

  useEffect(() => {
    if (user && token && !requiresTOTPSetup) {
      fetchDashboardData();
      // Fetch messages and dashboard data every 5 seconds
      const messageInterval = setInterval(fetchMessages, 5000);
      const dashboardInterval = setInterval(fetchDashboardData, 5000);
      return () => {
        clearInterval(messageInterval);
        clearInterval(dashboardInterval);
      };
    }
  }, [user, token, requiresTOTPSetup]);

  useEffect(() => {
    if (user && user.role === 'superadmin' && currentView === 'clients') {
      fetchClients();
    }
  }, [user, currentView]);

  // Fetch clients when reset modal is opened
  useEffect(() => {
    if (showResetModal && user && user.role === 'superadmin') {
      fetchClients();
    }
  }, [showResetModal, user]);



  // Handle login errors from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
      setLoginError(decodeURIComponent(error));
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (currentView === 'analytics') {
      fetchAnalytics(
        analyticsFrom instanceof Date ? analyticsFrom.toISOString().slice(0, 10) : undefined,
        analyticsTo instanceof Date ? analyticsTo.toISOString().slice(0, 10) : undefined
      );
      fetchDailyWork(
        analyticsFrom ? analyticsFrom.toISOString().slice(0, 10) : undefined,
        analyticsTo ? analyticsTo.toISOString().slice(0, 10) : undefined
      );
      // Fetch ticket priority volume in analytics useEffect
      const fetchPriorityVolume = async () => {
        try {
          const params = new URLSearchParams();
          if (analyticsFrom) params.append('start', analyticsFrom.toISOString().slice(0, 10));
          if (analyticsTo) params.append('end', analyticsTo.toISOString().slice(0, 10));
          const headers = { 'Authorization': `Bearer ${token}` };
          const resp = await fetch(`${API_URL}/api/reports/ticket-priority-volume?${params}`, { headers });
          const rawData = await resp.json();
          
          // Transform the data for the chart (same as in fetchAnalytics)
          const highCount = rawData.find(p => p.priority === 'high')?.count || 0;
          const mediumCount = rawData.find(p => p.priority === 'medium')?.count || 0;
          const lowCount = rawData.find(p => p.priority === 'low')?.count || 0;
          
          const transformedData = [
            {
              date: new Date().toISOString().split('T')[0],
              high: highCount,
              medium: mediumCount,
              low: lowCount
            }
          ];
          
          setPriorityVolume(transformedData);
        } catch (e) {
          setPriorityVolume([]);
        }
      };
      fetchPriorityVolume();
    }
    // eslint-disable-next-line
  }, [currentView, analyticsFrom, analyticsTo, token]);

  useEffect(() => {
    if (currentView === 'reports') {
      fetchReportsData(
        reportsFrom instanceof Date ? reportsFrom.toISOString().slice(0, 10) : undefined,
        reportsTo instanceof Date ? reportsTo.toISOString().slice(0, 10) : undefined
      );
    }
    // eslint-disable-next-line
  }, [currentView, reportsFrom, reportsTo, token]);

  useEffect(() => {
    if (currentView === 'teams' || currentView === 'manage-groups') {
      fetchTeams();
    }
    // eslint-disable-next-line
  }, [currentView, token]);

  // WebSocket cleanup when switching views or unmounting
  useEffect(() => {
    return () => {
      // Cleanup WebSocket connection when component unmounts or view changes
      if (currentView !== 'teams' && teamWebSocket) {
        disconnectFromTeamWebSocket();
      }
    };
  }, [currentView, teamWebSocket]);

  // Cleanup WebSocket on component unmount
  useEffect(() => {
    return () => {
      disconnectFromTeamWebSocket();
    };
  }, []);

  // Auto-refresh for reports
  useEffect(() => {
    let interval;
    if (currentView === 'reports' && autoRefresh) {
      interval = setInterval(() => {
        fetchReportsData(
          reportsFrom instanceof Date ? reportsFrom.toISOString().slice(0, 10) : undefined,
          reportsTo instanceof Date ? reportsTo.toISOString().slice(0, 10) : undefined
        );
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentView, autoRefresh, reportsFrom, reportsTo, token]);

  // Update selected report when user changes
  useEffect(() => {
    if (user) {
      if (user.role === 'admin' || user.role === 'superadmin') {
        setSelectedReport('overview');
      } else {
        setSelectedReport('daily');
      }
    }
  }, [user]);

  useEffect(() => {
    function handleClick(e) {
      if (!e.target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false);
      }
    }
    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [showProfileDropdown]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('token');
        setToken(null);
      }
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      await Promise.all([
        fetchTickets(),
        fetchClosedTickets(),
        fetchAssets(),
        fetchUsers(),
        fetchMessages(),
        fetchDashboardStats(),
        fetchDailyWork() // Fetch daily work data for dashboard pie chart
      ]);
    } catch (error) {
    }
  };

  const fetchTickets = async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.entries({...ticketFilters, ...filters}).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`${API_URL}/api/tickets/open?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const ticketsData = await response.json();
        setTickets(ticketsData);
      }
    } catch (error) {
    }
  };

  const fetchClosedTickets = async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.entries({...ticketFilters, ...filters}).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`${API_URL}/api/tickets/closed?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const ticketsData = await response.json();
        setClosedTickets(ticketsData);
      }
    } catch (error) {
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tickets/filter-options`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const options = await response.json();
        setFilterOptions(options);
      }
    } catch (error) {
    }
  };

  const updateUsername = async (userId, newUsername) => {
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}/update-username`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ new_username: newUsername })
      });
      
      if (response.ok) {
        await fetchUsers();
        setEditingUser(null);
        setNewUsername('');
        showMessage('Username updated successfully');
      } else {
        const error = await response.json();
        showMessage(error.detail || 'Failed to update username', 'error');
      }
    } catch (error) {
      showMessage('Failed to update username', 'error');
    }
  };

  const deleteUser = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await fetchUsers();
        showMessage('User deleted successfully');
      } else {
        const error = await response.json();
        showMessage(error.detail || 'Failed to delete user', 'error');
      }
    } catch (error) {
      showMessage('Failed to delete user', 'error');
    }
  };

  const downloadFile = async (url, filename) => {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        showMessage('File downloaded successfully');
      } else {
        showMessage('Export failed', 'error');
      }
    } catch (error) {
      showMessage('Export failed', 'error');
    }
  };

  const bulkDelete = async (endpoint, type) => {
    if (!window.confirm(`Are you sure you want to delete ALL ${type}? This action cannot be undone!`)) {
      return;
    }
    
    if (!window.confirm(`This will permanently delete ALL ${type} data. Type YES to confirm:`)) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/superadmin/${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        showMessage(result.message);
        // Refresh data
        fetchDashboardData();
      } else {
        const error = await response.json();
        showMessage(error.detail || `Failed to delete ${type}`, 'error');
      }
    } catch (error) {
      showMessage(`Failed to delete ${type}`, 'error');
    }
  };

  const handleSystemReset = () => {
    resetSystem();
  };



  const fetchAssets = async () => {
    try {
      const response = await fetch(`${API_URL}/api/assets`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const assetsData = await response.json();
        setAssets(assetsData);
      }
    } catch (error) {
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      }
    } catch (error) {
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const messagesData = await response.json();
        setMessages(messagesData);
      }
    } catch (error) {
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/dashboard/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const analyticsData = await response.json();
        setDashboardStats({
          ...analyticsData,
          total_tickets_change: analyticsData.total_tickets_change || '0%',
          open_tickets_change: analyticsData.open_tickets_change || '0%',
          total_assets_change: analyticsData.total_assets_change || '0%',
          asset_value_change: analyticsData.asset_value_change || '0%',
          total_users_change: analyticsData.total_users_change || '0%'
        });
      }
    } catch (error) {
    }
  };

  const showMessage = (msg, type = 'success') => {
    // Clear any existing timeout
    if (messageTimeout) {
      clearTimeout(messageTimeout);
      setMessageTimeout(null);
    }
    
    setMessage({ text: msg, type });
    
    // Set new timeout
    const timeout = setTimeout(() => {
      setMessage(null);
      setMessageTimeout(null);
    }, 3000);
    
    setMessageTimeout(timeout);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    try {
      const loginPayload = { ...loginData };
      
      // Add TOTP token or backup code if provided
      if (requiresTOTP) {
        if (useBackupCode) {
          loginPayload.backup_code = backupCode;
        } else {
          loginPayload.twofa_token = totpToken;
        }
      }

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginPayload)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Check if 2FA setup is required
        if (data.requires_2fa_setup) {
          setRequires2FASetup(true);
          setSetupToken(data.setup_token);
          setUser(data.user);
          showMessage('SuperAdmin accounts require 2FA. Please set up 2FA to continue.');
          return;
        }
        
        // Check if user needs 2FA setup (but can still access system)
        if (data.user?.needs_2fa_setup) {
          showMessage(data.warning || 'Please set up 2FA for enhanced security.', 'warning');
        }
        
        // Check if 2FA token is required
        if (data.requires_2fa) {
          setRequires2FA(true);
          showMessage(data.message);
          return;
        }
        
        // Successful login - this should NOT happen for superadmin without 2FA
        if (data.user.role === 'superadmin' && !requiresTOTP) {
        }
        
        setToken(data.access_token);
        localStorage.setItem('token', data.access_token);
        setUser(data.user);
        
        // Reset form and TOTP state
        setLoginData({ username: '', password: '', client_code: '' });
        setRequiresTOTP(false);
        setRequiresTOTPSetup(false);
        setTotpToken('');
        setBackupCode('');
        setUseBackupCode(false);
        
        if (data.user.role === 'superadmin') {
          showMessage('SuperAdmin login successful with 2FA verification!');
        }
      } else {
        const errorData = await response.json();
        
        // Check if this is a TOTP setup requirement (403 status)
        if (response.status === 403 && errorData.requires_totp_setup) {
          setRequiresTOTPSetup(true);
          setUser(errorData.user);
          showMessage('SuperAdmin accounts require Google Authenticator. Please set up TOTP to continue.');
          return;
        }
        
        // Check if this is a TOTP token requirement (403 status)
        if (response.status === 403 && errorData.requires_totp) {
          setRequiresTOTP(true);
          showMessage('Please enter your Google Authenticator code to continue.');
          return;
        }
        
        setLoginError(errorData.detail || 'Login failed');
      }
    } catch (error) {
      setLoginError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };



  // 2FA Setup Functions
  const setup2FA = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/2fa/initial-setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: loginData.username,
          password: loginData.password,
          client_code: loginData.client_code
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTwofaSetupData(data);
        showMessage('2FA setup initiated. Please scan the QR code with your authenticator app.');
      } else {
        const errorData = await response.json();
        setLoginError(errorData.detail || 'Failed to setup 2FA');
      }
    } catch (error) {
      setLoginError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const setupTOTP = async () => {
    try {
      setIsLoading(true);
      
      // If we have a token (authenticated user), use the authenticated endpoint
      if (token) {
        const response = await fetch(`${API_URL}/api/auth/setup-totp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setTotpSetupData(data);
        } else {
          const errorData = await response.json();
          setLoginError(errorData.error || 'Failed to setup TOTP');
        }
      } else {
        // For unauthenticated setup during login, use login credentials
        const response = await fetch(`${API_URL}/api/auth/setup-totp-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: loginData.username,
            password: loginData.password,
            client_code: loginData.client_code
          })
        });

        if (response.ok) {
          const data = await response.json();
          setTotpSetupData(data);
        } else {
          const errorData = await response.json();
          setLoginError(errorData.error || 'Failed to setup TOTP');
        }
      }
    } catch (error) {
      setLoginError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTOTPSetup = async (token) => {
    try {
      setIsLoading(true);
      
      // If we have a stored token (authenticated user), use the authenticated endpoint
      if (localStorage.getItem('token')) {
        const response = await fetch(`${API_URL}/api/auth/verify-totp-setup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ 
            totp_code: token
          })
        });

        if (response.ok) {
          const data = await response.json();
          showMessage('Google Authenticator setup completed successfully! Please login again.');
          
          // Reset all states and redirect to login
          setRequiresTOTPSetup(false);
          setTotpSetupData(null);
          setUser(null);
          setLoginData({ username: '', password: '', client_code: '' });
          localStorage.removeItem('token');
          setToken(null);
        } else {
          const errorData = await response.json();
          setLoginError(errorData.error || 'Failed to verify TOTP setup');
        }
      } else {
        // For unauthenticated verification during login
        const response = await fetch(`${API_URL}/api/auth/verify-totp-setup-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: loginData.username,
            password: loginData.password,
            client_code: loginData.client_code,
            totp_code: token
          })
        });

        if (response.ok) {
          const data = await response.json();
          showMessage('Google Authenticator setup completed successfully! Please login again.');
          
          // Reset all states and redirect to login
          setRequiresTOTPSetup(false);
          setTotpSetupData(null);
          setUser(null);
          setLoginData({ username: '', password: '', client_code: '' });
        } else {
          const errorData = await response.json();
          setLoginError(errorData.error || 'Failed to verify TOTP setup');
        }
      }
    } catch (error) {
      setLoginError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetTOTP = async () => {
    try {
      setIsLoading(true);
      setLoginError('');

      const response = await fetch(`${API_URL}/api/auth/reset-totp-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: loginData.username,
          password: loginData.password,
          client_code: loginData.client_code
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTotpSetupData(data);
        setRequiresTOTP(false);
        setRequiresTOTPSetup(true);
        setTotpToken('');
        setBackupCode('');
        showMessage('TOTP reset successful! Please scan the new QR code with Google Authenticator.');
      } else {
        const errorData = await response.json();
        setLoginError(errorData.error || 'Failed to reset TOTP');
      }
    } catch (error) {
      setLoginError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setCurrentView('dashboard');
    
    // Reset TOTP states
    setRequiresTOTP(false);
    setRequiresTOTPSetup(false);
    setTotpToken('');
    setBackupCode('');
    setUseBackupCode(false);
    setSetupToken('');
    setTwofaSetupData(null);
    setRequires2FA(false);
    setRequires2FASetup(false);
    setTotpSetupData(null);
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      let mediaUrl = null;
      if (selectedFile) {
        mediaUrl = await handleFileUpload(selectedFile);
        if (!mediaUrl) {
          setIsLoading(false);
          return; // Upload failed
        }
      }
      
      const ticketData = {
        title: ticketForm.title,
        description: ticketForm.description,
        priority: ticketForm.priority,
        assigned_to: ticketForm.assigned_to || null,
        media_url: mediaUrl
      };
      
      
      const response = await fetch(`${API_URL}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(ticketData)
      });

      if (response.ok) {
        const createdTicket = await response.json();
        // Reset form and UI first
        setTicketForm({ title: '', description: '', priority: 'medium', assigned_to: '' });
        setSelectedFile(null);
        setUploadedMediaUrl('');
        setCurrentView('tickets');
        
        // Then fetch fresh data
        await Promise.all([
          fetchTickets(),
          fetchDashboardStats()
        ]);
        
        showMessage('Ticket created successfully!');
      } else {
        const errorData = await response.json();
        showMessage(errorData.detail || 'Failed to create ticket', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTicket = async (ticketId, updateData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await fetchDashboardData();
        setSelectedTicket(null);
        showMessage('Ticket updated successfully!');
      } else {
        const errorData = await response.json();
        showMessage(errorData.detail || 'Failed to update ticket', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!closeComment.trim()) {
      showMessage('Please provide a close comment', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/tickets/${ticketToClose.id}/close`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ close_comment: closeComment })
      });

      if (response.ok) {
        await fetchDashboardData();
        setShowCloseModal(false);
        setCloseComment('');
        setTicketToClose(null);
        showMessage('Ticket closed successfully!');
      } else {
        const errorData = await response.json();
        showMessage(errorData.detail || 'Failed to close ticket', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChatUser) return;

    setIsLoading(true);
    try {
      let mediaUrl = null;
      if (selectedFile) {
        mediaUrl = await handleFileUpload(selectedFile);
        if (!mediaUrl) {
          setIsLoading(false);
          return; // Upload failed
        }
      }
      
      const response = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: newMessage,
          recipient_id: selectedChatUser.id,
          media_url: mediaUrl
        })
      });

      if (response.ok) {
        await fetchMessages();
        setNewMessage('');
        setSelectedFile(null);
        setUploadedMediaUrl('');
      } else {
        const errorData = await response.json();
        showMessage(errorData.detail || 'Failed to send message', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let mediaUrl = null;
      if (selectedFile) {
        mediaUrl = await handleFileUpload(selectedFile);
        if (!mediaUrl) {
          setIsLoading(false);
          return;
        }
      }
      const response = await fetch(`${API_URL}/api/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...assetForm, media_url: mediaUrl })
      });
      if (response.ok) {
        // Reset form and UI first
        setAssetForm({ name: '', description: '', asset_type: '', value: 0, serial_number: '' });
        setSelectedFile(null);
        setUploadedMediaUrl('');
        setCurrentView('assets');
        
        // Then fetch fresh data
        await Promise.all([
          fetchAssets(),
          fetchDashboardStats()
        ]);
        
        showMessage('Asset created successfully!');
      } else {
        const errorData = await response.json();
        showMessage(errorData.detail || 'Failed to create asset', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignAsset = async (assetId, userId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/assets/${assetId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ assigned_to: userId })
      });

      if (response.ok) {
        await fetchDashboardData();
        showMessage('Asset assigned successfully!');
      } else {
        const errorData = await response.json();
        showMessage(errorData.detail || 'Failed to assign asset', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAsset = async (assetId, assetName) => {
    if (!window.confirm(`Are you sure you want to delete the asset "${assetName}"? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/assets/${assetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchDashboardData();
        showMessage('Asset deleted successfully!');
      } else {
        const errorData = await response.json();
        showMessage(errorData.detail || 'Failed to delete asset', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAsset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let mediaUrl = null;
      if (selectedFile) {
        mediaUrl = await handleFileUpload(selectedFile);
        if (!mediaUrl) {
          setIsLoading(false);
          return;
        }
      }
      const response = await fetch(`${API_URL}/api/assets/${editingAsset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...editAssetForm, media_url: mediaUrl })
      });
      if (response.ok) {
        await fetchDashboardData();
        setEditingAsset(null);
        setEditAssetForm({
          name: '',
          description: '',
          asset_type: '',
          value: 0,
          serial_number: '',
          assigned_to: ''
        });
        setSelectedFile(null);
        setUploadedMediaUrl('');
        showMessage('Asset updated successfully!');
      } else {
        const errorData = await response.json();
        showMessage(errorData.detail || 'Failed to update asset', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userForm)
      });

      if (response.ok) {
        await fetchUsers();
        setUserForm({ username: '', email: '', password: '', role: 'user' });
        setCurrentView('users');
        showMessage('User created successfully!');
      } else {
        const errorData = await response.json();
        showMessage(errorData.detail || 'Failed to create user', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword.trim()) {
      showMessage('Please provide a new password', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/users/${userToReset.id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ new_password: newPassword })
      });

      if (response.ok) {
        setShowPasswordResetModal(false);
        setNewPassword('');
        setUserToReset(null);
        showMessage('Password reset successfully!');
      } else {
        const errorData = await response.json();
        showMessage(errorData.detail || 'Failed to reset password', 'error');
      }

    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };



  const getConversationMessages = (userId) => {
    return messages.filter(msg => 
      (msg.sender_id === user.id && msg.recipient_id === userId) ||
      (msg.sender_id === userId && msg.recipient_id === user.id)
    ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  };

  const getLastMessage = (userId) => {
    const conversation = getConversationMessages(userId);
    return conversation[conversation.length - 1];
  };

  // Filtered users for assignment (hide superadmin unless current user is superadmin)
  const assignableUsers = user && user.role === 'superadmin' ? users : users.filter(u => u.role !== 'superadmin');

  const fetchAnalytics = async (start, end) => {
    setAnalyticsLoading(true);
    try {
      const params = new URLSearchParams();
      if (start) params.append('start', start);
      if (end) params.append('end', end);
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Use the actual backend endpoints that exist
      const requests = [
        fetch(`${API_URL}/api/reports/analytics?${params}`, { headers }),
        fetch(`${API_URL}/api/reports/daily-work?${params}`, { headers }),
        fetch(`${API_URL}/api/reports/ticket-priority-volume?${params}`, { headers }),
        fetch(`${API_URL}/api/reports/overview?${params}`, { headers })
      ];
      
      // Add agent performance for admins only
      if (user.role === 'admin' || user.role === 'superadmin') {
        requests.push(fetch(`${API_URL}/api/reports/agent-performance?${params}`, { headers }));
      }
      
      const responses = await Promise.all(requests);
      const [analytics, dailyWork, priorityVolume, overview, agentPerf] = responses;
      
      const analyticsResult = await analytics.json();
      const dailyWorkResult = await dailyWork.json();
      const priorityVolumeResult = await priorityVolume.json();
      const overviewResult = await overview.json();
      const agentPerfResult = agentPerf ? await agentPerf.json() : [];
      
      // Transform data to match frontend chart expectations
      
      // 1. Transform ticket trends data
      const transformedTicketTrends = {
        labels: dailyWorkResult.map(item => item.date),
        created: dailyWorkResult.map(item => (item.open || 0) + (item.in_progress || 0) + (item.closed || 0)),
        resolved: dailyWorkResult.map(item => item.closed || 0)
      };
      
      // 2. Transform agent performance data (use real data from backend)
      const transformedAgentPerf = {
        labels: agentPerfResult.map(agent => agent.agent_name),
        assigned: agentPerfResult.map(agent => agent.assigned),
        resolved: agentPerfResult.map(agent => agent.resolved)
      };
      
      // 3. Transform priority volume data for stacked bar chart
      // Use actual priority data from the backend
      const highCount = priorityVolumeResult.find(p => p.priority === 'high')?.count || 0;
      const mediumCount = priorityVolumeResult.find(p => p.priority === 'medium')?.count || 0;
      const lowCount = priorityVolumeResult.find(p => p.priority === 'low')?.count || 0;
      
      const transformedPriorityVolume = [
        {
          date: new Date().toISOString().split('T')[0],
          high: highCount,
          medium: mediumCount,
          low: lowCount
        }
      ];
      

      
      setAnalyticsData({
        ticketStatus: {
          labels: ['open', 'closed'],
          values: [analyticsResult.tickets?.open || 0, analyticsResult.tickets?.closed || 0]
        },
        ticketTrends: transformedTicketTrends,
        sla: { compliance: 85 }, // Placeholder since SLA endpoint doesn't exist
        agentPerf: transformedAgentPerf,
        assetDist: {
          by_type: {
            labels: ['Hardware', 'Software', 'Other'],
            values: [
              Math.floor((analyticsResult.assets?.total || 0) * 0.6),
              Math.floor((analyticsResult.assets?.total || 0) * 0.3),
              Math.floor((analyticsResult.assets?.total || 0) * 0.1)
            ]
          }
        },
        priorityVolume: priorityVolumeResult,
        overview: overviewResult,
        analytics: analyticsResult
      });
      
      // Also set the priorityVolume state for the chart
      setPriorityVolume(transformedPriorityVolume);
    } catch (e) {
      setAnalyticsData({});
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Fetch daily work analytics
  const fetchDailyWork = async (start, end) => {
    try {
      const params = new URLSearchParams();
      if (start) params.append('start', start);
      if (end) params.append('end', end);
      const headers = { 'Authorization': `Bearer ${token}` };
      const resp = await fetch(`${API_URL}/api/reports/daily-work?${params}`, { headers });
      const data = await resp.json();
      setDailyWorkData(data);
    } catch (e) {
      setDailyWorkData([]);
    }
  };

  const fetchReportsData = async (start, end) => {
    setReportsLoading(true);
    try {
      const params = new URLSearchParams();
      if (start) params.append('start', start);
      if (end) params.append('end', end);
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch all reports data using existing endpoints
      const requests = [
        fetch(`${API_URL}/api/reports/analytics?${params}`, { headers }),
        fetch(`${API_URL}/api/reports/daily-work?${params}`, { headers }),
        fetch(`${API_URL}/api/reports/ticket-priority-volume?${params}`, { headers }),
        fetch(`${API_URL}/api/reports/overview?${params}`, { headers }),
        fetch(`${API_URL}/api/reports/asset-distribution?${params}`, { headers }),
        fetch(`${API_URL}/api/reports/ticket-status?${params}`, { headers })
      ];
      
      // Add agent performance for admins only
      if (user.role === 'admin' || user.role === 'superadmin') {
        requests.push(fetch(`${API_URL}/api/reports/agent-performance?${params}`, { headers }));
      }
      
      const responses = await Promise.all(requests);
      const [analytics, dailyWork, priorityVolume, overview, assetDist, ticketStatus, agentPerf] = responses;
      
      const analyticsData = await analytics.json();
      const dailyWorkData = await dailyWork.json();
      const priorityVolumeData = await priorityVolume.json();
      const overviewData = await overview.json();
      const assetDistData = await assetDist.json();
      const ticketStatusData = await ticketStatus.json();
      const agentPerfData = agentPerf ? await agentPerf.json() : [];
      
      // Transform data for reports view
      const agentPerformanceData = {
        labels: agentPerfData.map(agent => agent.agent_name),
        assigned: agentPerfData.map(agent => agent.assigned),
        resolved: agentPerfData.map(agent => agent.resolved),
        resolutionRates: agentPerfData.map(agent => agent.resolution_rate)
      };

      setReportsData({
        ticketStatus: ticketStatusData,
        ticketTrends: dailyWorkData,
        slaCompliance: { compliance: 85 }, // Placeholder
        agentPerformance: agentPerformanceData,
        assetDistribution: assetDistData,
        customerSatisfaction: { rating: 4.2 }, // Placeholder
        overview: overviewData,
        analytics: analyticsData
      });
    } catch (error) {
      setReportsData({});
    } finally {
      setReportsLoading(false);
    }
  };

  // When a chat user is selected, mark all their messages as read
  const handleSelectChatUser = (chatUser) => {
    setSelectedChatUser(chatUser);
    setReadMessages((prev) => ({ ...prev, [chatUser.id]: Date.now() }));
  };

  // Teams functions
  const fetchTeams = async () => {
    try {
      const response = await fetch(`${API_URL}/api/teams`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const teamsData = await response.json();
        setTeams(teamsData);
      }
    } catch (error) {
    }
  };

  const fetchTeamMessages = async (teamId, loadMore = false) => {
    if (!teamId) {
      return { messages: [], hasMore: false };
    }
    
    
    try {
      const url = `${API_URL}/api/teams/${teamId}/messages`;
      
      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const messages = await response.json();
      
      // Backend returns messages sorted by created_at DESC (newest first)
      // Reverse them to show oldest first for chat display
      const sortedMessages = Array.isArray(messages) ? messages.reverse() : [];
      
      // Set messages (ignore loadMore for now since backend doesn't support pagination)
      setTeamMessages(sortedMessages);
      
      return {
        messages: sortedMessages,
        hasMore: false, // Backend doesn't support pagination yet
        total: sortedMessages.length
      };
      
    } catch (error) {
      
      // Don't show the error message here, let handleSelectTeam handle it
      setTeamMessages([]);
      throw error; // Re-throw so handleSelectTeam can catch it
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(teamForm)
      });

      if (response.ok) {
        await fetchTeams();
        setTeamForm({ name: '', description: '', manager_id: '' });
        setCurrentView('teams');
        showMessage('Team created successfully!');
      } else {
        const errorData = await response.json();
        showMessage(errorData.detail || 'Failed to create team', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTeam = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // For non-admin users, don't send manager_id field
      const updateData = { ...editTeamForm };
      if (user.role !== 'admin' && user.role !== 'superadmin') {
        delete updateData.manager_id;
      }
      
      const response = await fetch(`${API_URL}/api/teams/${editingTeam.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await fetchTeams();
        setEditingTeam(null);
        setEditTeamForm({ name: '', description: '', manager_id: '' });
        showMessage('Team updated successfully!');
      } else {
        const errorData = await response.json();
        showMessage(errorData.detail || 'Failed to update team', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/teams/${teamId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchTeams();
        showMessage('Team deleted successfully!');
      } else {
        const errorData = await response.json();
        showMessage(errorData.detail || 'Failed to delete team', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTeamMember = async () => {
    if (!memberToAdd) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/teams/${teamToAddMember.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: memberToAdd })
      });

      if (response.ok) {
        await fetchTeams();
        setShowAddMemberModal(false);
        setMemberToAdd('');
        setTeamToAddMember(null);
        showMessage('Member added successfully!');
      } else {
        const errorData = await response.json();
        showMessage(errorData.detail || 'Failed to add member', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTeamMember = async (teamId, userId) => {
    if (!window.confirm('Are you sure you want to remove this member from the team?')) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/teams/${teamId}/members/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchTeams();
        showMessage('Member removed successfully!');
      } else {
        const errorData = await response.json();
        showMessage(errorData.detail || 'Failed to remove member', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return null;
    
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      showMessage('Only image files are allowed', 'error');
      return null;
    }
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      showMessage('File size must be less than 5MB', 'error');
      return null;
    }
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_URL}/api/upload/photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      
      if (response.ok) {
        const data = await response.json();
        showMessage('File uploaded successfully!', 'success');
        return data.url;
      } else {
        const errorData = await response.json();
        showMessage(errorData.detail || 'Failed to upload file', 'error');
        return null;
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendTeamMessage = async (e) => {
    e.preventDefault();
    if (!newTeamMessage.trim() || !selectedTeam) return;

    setIsLoading(true);
    try {
      let mediaUrl = null;
      if (selectedFile) {
        mediaUrl = await handleFileUpload(selectedFile);
        if (!mediaUrl) {
          setIsLoading(false);
          return; // Upload failed
        }
      }
      
      const response = await fetch(`${API_URL}/api/teams/${selectedTeam.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message: newTeamMessage,
          media_url: mediaUrl
        })
      });

      if (response.ok) {
        const sentMessage = await response.json();
        setTeamMessages(prevMessages => [...prevMessages, sentMessage]);
        setNewTeamMessage('');
        setSelectedFile(null);
        setUploadedMediaUrl('');
        
        // Clear file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
        
        showMessage('Message sent successfully!', 'success');
      } else {
        const errorText = await response.text();
        let errorMessage = 'Failed to send message';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status}`;
        }
        showMessage(errorMessage, 'error');
      }
    } catch (error) {
      showMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTeam = async (team) => {
    if (!team || !team.id) {
      return;
    }
    
    // Disconnect from previous team WebSocket if exists
    if (teamWebSocket) {
      teamWebSocket.close();
      setTeamWebSocket(null);
      setIsConnectedToTeam(false);
    }
    
    setSelectedTeam(team);
    setIsLoading(true);
    
    try {
      // Fetch messages first (this is the critical part)
      await fetchTeamMessages(team.id);
    } catch (error) {
      showMessage('Failed to load team messages. Please try again.', 'error');
      setIsLoading(false);
      return;
    }
    
    // Try to connect to WebSocket (temporarily disabled for debugging)
    try {
      // connectToTeamWebSocket(team.id);
    } catch (error) {
      // Don't show error message for WebSocket failures
    }
    
    setIsLoading(false);
  };

  // WebSocket functions for real-time Teams chat
  const connectToTeamWebSocket = (teamId) => {
    if (!token || !teamId) {
      return;
    }

    try {
      const wsUrl = `ws://localhost:8001/ws/teams/${teamId}?token=${token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnectedToTeam(true);
        setTeamWebSocket(ws);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Add the new message to the team messages
          setTeamMessages(prevMessages => {
            // Check if message already exists to avoid duplicates
            const messageExists = prevMessages.some(msg => msg.id === message.id);
            if (!messageExists) {
              return [...prevMessages, message];
            }
            return prevMessages;
          });
        } catch (error) {
        }
      };

      ws.onclose = (event) => {
        setIsConnectedToTeam(false);
        setTeamWebSocket(null);
        
        // Attempt to reconnect after a delay if not intentionally closed
        if (event.code !== 1000 && selectedTeam && selectedTeam.id === teamId) {
          setTimeout(() => {
            connectToTeamWebSocket(teamId);
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        setIsConnectedToTeam(false);
      };

    } catch (error) {
    }
  };

  const disconnectFromTeamWebSocket = () => {
    if (teamWebSocket) {
      teamWebSocket.close(1000, 'User disconnected');
      setTeamWebSocket(null);
      setIsConnectedToTeam(false);
    }
  };

  // Check if user can manage team (admin or team manager)
  const canManageTeam = (team) => {
    return user.role === 'admin' || user.role === 'superadmin' || team.manager_id === user.id;
  };

  // Check if user is member of team
  const isTeamMember = (team) => {
    return team.members?.includes(user.id) || team.manager_id === user.id;
  };

  // Helper function to get user object from ID
  const getUserById = (userId) => {
    if (!userId || !users || users.length === 0) return null;
    return users.find(u => u && u.id === userId) || null;
  };

  // Helper function to get team members as user objects
  const getTeamMembers = (team) => {
    if (!team || !team.members || !Array.isArray(team.members)) return [];
    if (!users || users.length === 0) return []; // Ensure users are loaded
    return team.members.map(memberId => getUserById(memberId)).filter(Boolean);
  };

  const handleTicketClick = (ticket) => {
    setSelectedTicketDetail(ticket);
    setShowTicketDetailModal(true);
  };

  const handleAssetClick = (asset) => {
    setSelectedAssetDetail(asset);
    setShowAssetDetailModal(true);
  };

  const downloadMedia = (mediaUrl, filename) => {
    const link = document.createElement('a');
    link.href = `${API_URL}${mediaUrl}`;
    link.download = filename || 'media';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Client management functions
  const fetchClients = async () => {
    try {
      const response = await fetch(`${API_URL}/api/clients`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data);
        
        // Fetch statistics for each client
        const statsPromises = data.map(async (client) => {
          try {
            const statsResponse = await fetch(`${API_URL}/api/clients/${client.id}/stats`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (statsResponse.ok) {
              const stats = await statsResponse.json();
              return { clientId: client.id, stats };
            }
          } catch (error) {
          }
          return { clientId: client.id, stats: null };
        });
        
        const statsResults = await Promise.all(statsPromises);
        const statsMap = {};
        statsResults.forEach(({ clientId, stats }) => {
          if (stats) {
            statsMap[clientId] = stats;
          }
        });
        setClientStats(statsMap);
      }
    } catch (error) {
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(clientForm)
      });

      if (response.ok) {
        const data = await response.json();
        await fetchClients();
        setClientForm({ name: '', code: '', contact_email: '', contact_phone: '', address: '', user_limit: 10, asset_limit: 50 });
        
        // Show detailed success message with admin credentials
        const adminCreds = data.admin_credentials;
        showMessage(
          `[✓] Client "${data.client.name}" created successfully!\n` +
          `[*] Default Admin Login:\n` +
          `• Username: ${adminCreds.username}\n` +
          `• Password: ${adminCreds.password}\n` +
          `• Client Code: ${data.client.code}\n` +
          `• Email: ${adminCreds.email}`
        );
      } else {
        const errorData = await response.json();
        showMessage(errorData.detail || 'Failed to create client', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClient = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editClientForm)
      });

      if (response.ok) {
        await fetchClients();
        setEditingClient(null);
        setEditClientForm({ name: '', code: '', contact_email: '', contact_phone: '', address: '', user_limit: 10, asset_limit: 50 });
        showMessage('Client updated successfully!');
      } else {
        const errorData = await response.json();
        showMessage(errorData.detail || 'Failed to update client', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClient = async (clientId) => {
    // Find the client
    const client = clients.find(c => c.id === clientId);
    if (!client) {
      showMessage('Client not found', 'error');
      return;
    }

    // Protect main organization
    if (client.code === '031210') {
      showMessage('Cannot delete the main organization', 'error');
      return;
    }

    if (!window.confirm('Are you sure you want to deactivate this client?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/clients/${clientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchClients();
        showMessage('Client deactivated successfully!');
      } else {
        const errorData = await response.json();
        showMessage(errorData.detail || 'Failed to deactivate client', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermanentlyDeleteClient = async (clientId, clientName) => {
    // Find the client
    const client = clients.find(c => c.id === clientId);
    if (!client) {
      showMessage('Client not found', 'error');
      return;
    }

    // Protect main organization
    if (client.code === '031210') {
      showMessage('Cannot delete the main organization', 'error');
      return;
    }

    const confirmMessage = `Are you sure you want to PERMANENTLY DELETE the client "${clientName}"?\n\nThis action will:\n• Delete all users in this client\n• Delete all tickets\n• Delete all assets\n• Delete all messages\n• Delete all teams\n• Delete the client itself\n\nThis action cannot be undone!`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/clients/${clientId}/permanent`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        await fetchClients();
        showMessage(result.message || 'Client permanently deleted successfully!');
      } else {
        const errorData = await response.json();
        showMessage(errorData.detail || 'Failed to delete client', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetSystem = async () => {
    if (!selectedClientForReset) {
      showMessage('Please select a client to reset', 'error');
      return;
    }

    const selectedClient = clients.find(c => c.id === selectedClientForReset);
    if (!selectedClient) {
      showMessage('Invalid client selected', 'error');
      return;
    }

    // Protect main organization
    if (selectedClient.code === '031210') {
      showMessage('Cannot reset the main organization\'s system', 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to reset the system for client "${selectedClient.name}"? This will delete all their data.`)) {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/superadmin/reset-system/${selectedClientForReset}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          showMessage(`${result.message}. ${result.note}`);
          setShowResetModal(false);
          setSelectedClientForReset('');
          await fetchDashboardData();
          await fetchClients();
        } else {
          const errorData = await response.json();
          showMessage(errorData.detail || 'Failed to reset system', 'error');
        }
      } catch (error) {
        showMessage('Network error. Please try again.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleReactivateClient = async (clientId) => {
    if (!window.confirm('Are you sure you want to reactivate this client?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/clients/${clientId}/reactivate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchClients();
        showMessage('Client reactivated successfully!');
      } else {
        const errorData = await response.json();
        showMessage(errorData.detail || 'Failed to reactivate client', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUserLimit = async (clientId, newLimit) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/clients/${clientId}/user-limit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_limit: newLimit })
      });

      if (response.ok) {
        await fetchClients();
        setEditingUserLimit(null);
        setUserLimitForm({ user_limit: 10 });
        showMessage('User limit updated successfully!');
      } else {
        const errorData = await response.json();
        showMessage(errorData.detail || 'Failed to update user limit', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAssetLimit = async (clientId, newLimit) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/clients/${clientId}/asset-limit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ asset_limit: newLimit })
      });

      if (response.ok) {
        await fetchClients();
        setEditingAssetLimit(null);
        setAssetLimitForm({ asset_limit: 50 });
        showMessage('Asset limit updated successfully!');
      } else {
        const errorData = await response.json();
        showMessage(errorData.detail || 'Failed to update asset limit', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }



  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-500/30 to-blue-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/4 right-1/4 w-60 h-60 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-2xl animate-pulse delay-500"></div>
          <div className="absolute bottom-1/4 left-1/4 w-60 h-60 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-2xl animate-pulse delay-700"></div>
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-bounce delay-300"></div>
          <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-blue-300/30 rounded-full animate-bounce delay-700"></div>
          <div className="absolute bottom-1/3 left-2/3 w-1.5 h-1.5 bg-purple-300/25 rounded-full animate-bounce delay-1000"></div>
        </div>

        <div className="relative z-10 w-full max-w-md px-6">
          {/* Branding */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-3">
              NEXDESK
            </h1>
            <p className="text-lg font-medium text-blue-200 mb-2">Advanced IT Management Platform</p>
            <p className="text-sm text-slate-300">
              Sign in to access your workspace
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 transform hover:scale-[1.02] transition-all duration-300">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Client Code Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Client Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-50/50 hover:bg-white focus:bg-white"
                    placeholder="Enter your client code"
                    value={loginData.client_code}
                    onChange={(e) => setLoginData({ ...loginData, client_code: e.target.value })}
                  />
                </div>
              </div>

              {/* Username Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-50/50 hover:bg-white focus:bg-white"
                    placeholder="Enter your username"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <PasswordInput
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="Enter your password"
                    required={true}
                    showIcon={true}
                  />
                </div>
              </div>

              {/* Error Message */}
              {loginError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
                  <svg className="h-5 w-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-600">{loginError}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign In</span>
                  </div>
                )}
              </button>
            </form>

            {/* TOTP Token Input */}
            {requiresTOTP && (
              <div className="mt-6 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-orange-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-orange-600 font-semibold">Google Authenticator Required</span>
                  </div>
                </div>
                
                {!useBackupCode ? (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Google Authenticator Code
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        maxLength="6"
                        className="block w-full pl-10 pr-3 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-gray-50/50 hover:bg-white focus:bg-white text-center text-lg font-mono"
                        placeholder="000000"
                        value={totpToken}
                        onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && totpToken.length === 6) {
                            handleLogin(e);
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Backup Code
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2V5a2 2 0 00-2-2m0 0H9a2 2 0 00-2 2v0a2 2 0 002 2h6a2 2 0 002-2V5z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-gray-50/50 hover:bg-white focus:bg-white text-center font-mono"
                        placeholder="Enter backup code"
                        value={backupCode}
                        onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && backupCode.trim()) {
                            handleLogin(e);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => {
                    setUseBackupCode(!useBackupCode);
                    setTotpToken('');
                    setBackupCode('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  {useBackupCode ? 'Use authenticator app instead' : 'Use backup code instead'}
                </button>
                
                {/* 2FA Submit Button */}
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={isLoading || (!useBackupCode && totpToken.length !== 6) || (useBackupCode && !backupCode.trim())}
                  className="w-full bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-orange-700 hover:via-red-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-orange-500/50 focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Verify & Sign In</span>
                    </div>
                  )}
                </button>

                {/* Reset TOTP Button */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Need a new QR code?</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetTOTP}
                  disabled={isLoading}
                  className="w-full bg-gray-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-500/50 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Resetting...' : 'Reset & Setup New Google Authenticator'}
                </button>
              </div>
            )}



            {/* Debug Info */}
            {requiresTOTPSetup && (
              <div className="mt-4 p-2 bg-yellow-100 border border-yellow-400 rounded text-center">
                <p className="text-sm text-yellow-800">
                  [*] DEBUG: TOTP Setup Required (State: {requiresTOTPSetup.toString()})
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-400">
                © 2024 NEXDESK. All rights reserved.
              </p>
            </div>
          </div>

          {/* TOTP Setup Modal */}
          {requiresTOTPSetup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{zIndex: 9999}}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="text-center mb-6">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
                    <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Google Authenticator Setup Required
                  </h3>
                  <p className="text-sm text-gray-600">
                    SuperAdmin accounts require Google Authenticator for enhanced security.
                  </p>
                </div>

                {!totpSetupData ? (
                  <div className="space-y-3">
                    <button
                      onClick={setupTOTP}
                      disabled={isLoading}
                      className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      {isLoading ? 'Setting up...' : 'Setup Google Authenticator Now'}
                    </button>
                    
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs text-red-700 text-center">
                        <strong>Required:</strong> SuperAdmin accounts must have Google Authenticator enabled for security compliance.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="font-semibold text-gray-900 mb-2">Scan QR Code with Google Authenticator</h4>
                      <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                        <img src={totpSetupData.qr_code} alt="Google Authenticator QR Code" className="w-48 h-48" />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Or enter this key manually: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{totpSetupData.secret}</code>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Enter 6-digit code from Google Authenticator
                      </label>
                      <input
                        type="text"
                        maxLength="6"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-center text-lg font-mono"
                        placeholder="000000"
                        onChange={(e) => {
                          const token = e.target.value.replace(/\D/g, '').slice(0, 6);
                          e.target.value = token;
                          if (token.length === 6) {
                            verifyTOTPSetup(token);
                          }
                        }}
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h5 className="font-semibold text-blue-800 text-sm mb-2">Important Notes</h5>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>• Keep your secret key safe as a backup</li>
                        <li>• The 6-digit codes change every 30 seconds</li>
                        <li>• You'll need this for every superadmin login</li>
                        <li>• Don't share your QR code or secret key</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex relative">
      {/* Mobile Menu Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Enhanced Sidebar */}
      <div className={`${
        isMobile 
          ? `fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : 'w-80 sticky top-0 z-30 h-screen'
      } bg-gradient-to-b from-gray-50 via-white to-gray-50 shadow-2xl border-r border-gray-200`}>
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 py-6 px-6 text-white h-[88px] flex flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold leading-tight text-white">NEXDESK</h1>
                <p className="text-xs text-blue-100 font-medium mt-1" style={{fontFamily: 'Inter, sans-serif'}}>
                  IT Management Platform
                </p>
              </div>
              <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="mx-4 mt-4 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-full p-2">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800 text-sm">{user.username}</p>
              <p className="text-xs text-blue-600 font-medium capitalize">{user.role}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{format(new Date(), "MMM dd")}</p>
              <p className="text-xs text-gray-500">{format(new Date(), "HH:mm")}</p>
            </div>
          </div>
        </div>
        
        <nav className="px-4 pb-6 overflow-y-auto" style={{maxHeight: 'calc(100vh - 200px)'}}>
          {/* Main Features Section */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Main Features</h3>
            <div className="space-y-2">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`w-full flex items-center justify-between px-4 py-4 text-sm font-semibold rounded-xl transition-all duration-200 group ${
                  currentView === 'dashboard'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 transform scale-105'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 hover:shadow-md'
                }`}
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${currentView === 'dashboard' ? 'bg-white/20' : 'bg-blue-100 group-hover:bg-blue-200'}`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Dashboard</div>
                    <div className="text-xs opacity-75">System Overview</div>
                  </div>
                </div>
                <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button
                onClick={() => setCurrentView('create-ticket')}
                className={`w-full flex items-center justify-between px-4 py-4 text-sm font-semibold rounded-xl transition-all duration-200 group ${
                  currentView === 'create-ticket'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/30 transform scale-105'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 hover:shadow-md'
                }`}
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${currentView === 'create-ticket' ? 'bg-white/20' : 'bg-green-100 group-hover:bg-green-200'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Create Ticket</div>
                    <div className="text-xs opacity-75">New Support Request</div>
                  </div>
                </div>
                <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => setCurrentView('tickets')}
                className={`w-full flex items-center justify-between px-4 py-4 text-sm font-semibold rounded-xl transition-all duration-200 group ${
                  currentView === 'tickets'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 transform scale-105'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 hover:shadow-md'
                }`}
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${currentView === 'tickets' ? 'bg-white/20' : 'bg-blue-100 group-hover:bg-blue-200'}`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Active Tickets</div>
                    <div className="text-xs opacity-75">Manage Open Issues</div>
                  </div>
                </div>
                <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => setCurrentView('closed-tickets')}
                className={`w-full flex items-center justify-between px-4 py-4 text-sm font-semibold rounded-xl transition-all duration-200 group ${
                  currentView === 'closed-tickets'
                    ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg shadow-gray-500/30 transform scale-105'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 hover:text-gray-700 hover:shadow-md'
                }`}
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${currentView === 'closed-tickets' ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Closed Tickets</div>
                    <div className="text-xs opacity-75">Resolved Issues</div>
                  </div>
                </div>
                <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button
                onClick={() => setCurrentView('assets')}
                className={`w-full flex items-center justify-between px-4 py-4 text-sm font-semibold rounded-xl transition-all duration-200 group ${
                  currentView === 'assets'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/30 transform scale-105'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 hover:text-purple-700 hover:shadow-md'
                }`}
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${currentView === 'assets' ? 'bg-white/20' : 'bg-purple-100 group-hover:bg-purple-200'}`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"/>
                      <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Assets</div>
                    <div className="text-xs opacity-75">Hardware & Equipment</div>
                  </div>
                </div>
                <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Communication Section */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Communication</h3>
            <div className="space-y-2">
              <button
                onClick={() => setCurrentView('chat')}
                className={`w-full flex items-center justify-between px-4 py-4 text-sm font-semibold rounded-xl transition-all duration-200 group ${
                  currentView === 'chat'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/30 transform scale-105'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 hover:text-indigo-700 hover:shadow-md'
                }`}
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${currentView === 'chat' ? 'bg-white/20' : 'bg-indigo-100 group-hover:bg-indigo-200'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Team Chat</div>
                    <div className="text-xs opacity-75">Internal Communication</div>
                  </div>
                </div>
                <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button
                onClick={() => setCurrentView('teams')}
                className={`w-full flex items-center justify-between px-4 py-4 text-sm font-semibold rounded-xl transition-all duration-200 group ${
                  currentView === 'teams'
                    ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg shadow-teal-500/30 transform scale-105'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 hover:text-teal-700 hover:shadow-md'
                }`}
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${currentView === 'teams' ? 'bg-white/20' : 'bg-teal-100 group-hover:bg-teal-200'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Teams</div>
                    <div className="text-xs opacity-75">Team Management</div>
                  </div>
                </div>
                <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Analytics & Reports Section */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Analytics & Reports</h3>
            <div className="space-y-2">
              <button
                onClick={() => setCurrentView('analytics')}
                className={`w-full flex items-center justify-between px-4 py-4 text-sm font-semibold rounded-xl transition-all duration-200 group ${
                  currentView === 'analytics'
                    ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg shadow-orange-500/30 transform scale-105'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 hover:text-orange-700 hover:shadow-md'
                }`}
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${currentView === 'analytics' ? 'bg-white/20' : 'bg-orange-100 group-hover:bg-orange-200'}`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Analytics</div>
                    <div className="text-xs opacity-75">Performance Insights</div>
                  </div>
                </div>
                <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => setCurrentView('reports')}
                className={`w-full flex items-center justify-between px-4 py-4 text-sm font-semibold rounded-xl transition-all duration-200 group ${
                  currentView === 'reports'
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/30 transform scale-105'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 hover:text-emerald-700 hover:shadow-md'
                }`}
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${currentView === 'reports' ? 'bg-white/20' : 'bg-emerald-100 group-hover:bg-emerald-200'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Reports</div>
                    <div className="text-xs opacity-75">Advanced Reports</div>
                  </div>
                </div>
                <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {(user.role === 'admin' || user.role === 'superadmin') && (
                <button
                  onClick={() => setCurrentView('infrastructure')}
                  className={`w-full flex items-center justify-between px-4 py-4 text-sm font-semibold rounded-xl transition-all duration-200 group ${
                    currentView === 'infrastructure'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/30 transform scale-105'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-700 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${currentView === 'infrastructure' ? 'bg-white/20' : 'bg-red-100 group-hover:bg-red-200'}`}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Infrastructure</div>
                      <div className="text-xs opacity-75">System Health</div>
                    </div>
                  </div>
                  <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Administration Section */}
          {(user.role === 'admin' || user.role === 'superadmin') && (
            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Administration</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setCurrentView('users')}
                  className={`w-full flex items-center justify-between px-4 py-4 text-sm font-semibold rounded-xl transition-all duration-200 group ${
                    currentView === 'users'
                      ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-500/30 transform scale-105'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 hover:text-cyan-700 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${currentView === 'users' ? 'bg-white/20' : 'bg-cyan-100 group-hover:bg-cyan-200'}`}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Users</div>
                      <div className="text-xs opacity-75">User Management</div>
                    </div>
                  </div>
                  <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => setCurrentView('manage-groups')}
                  className={`w-full flex items-center justify-between px-4 py-4 text-sm font-semibold rounded-xl transition-all duration-200 group ${
                    currentView === 'manage-groups'
                      ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white shadow-lg shadow-yellow-500/30 transform scale-105'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-amber-50 hover:text-yellow-700 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${currentView === 'manage-groups' ? 'bg-white/20' : 'bg-yellow-100 group-hover:bg-yellow-200'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Manage Groups</div>
                      <div className="text-xs opacity-75">Group Administration</div>
                    </div>
                  </div>
                  <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {user.role === 'superadmin' && (
                  <>
                    <button
                      onClick={() => setCurrentView('superadmin')}
                      className={`w-full flex items-center justify-between px-4 py-4 text-sm font-semibold rounded-xl transition-all duration-200 group ${
                        currentView === 'superadmin'
                          ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/30 transform scale-105'
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-700 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${currentView === 'superadmin' ? 'bg-white/20' : 'bg-red-100 group-hover:bg-red-200'}`}>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                          </svg>
                        </div>
                        <div className="text-left">
                          <div className="font-semibold">SuperAdmin</div>
                          <div className="text-xs opacity-75">System Administration</div>
                        </div>
                      </div>
                      <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    <button
                      onClick={() => setCurrentView('clients')}
                      className={`w-full flex items-center justify-between px-4 py-4 text-sm font-semibold rounded-xl transition-all duration-200 group ${
                        currentView === 'clients'
                          ? 'bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-lg shadow-violet-500/30 transform scale-105'
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 hover:text-violet-700 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${currentView === 'clients' ? 'bg-white/20' : 'bg-violet-100 group-hover:bg-violet-200'}`}>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"/>
                          </svg>
                        </div>
                        <div className="text-left">
                          <div className="font-semibold">Client Management</div>
                          <div className="text-xs opacity-75">Multi-tenant Control</div>
                        </div>
                      </div>
                      <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-r from-gray-100 to-gray-50 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-500 font-medium">NEXDESK v2.0</p>
            <p className="text-xs text-gray-400">{format(new Date(), "EEEE, MMMM do, yyyy")}</p>
          </div>
        </div>
      </div>

      {/* Reset System Modal */}
      {showResetModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Reset Client System</h3>
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Client</label>
                      <select
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={selectedClientForReset}
                        onChange={(e) => setSelectedClientForReset(e.target.value)}
                      >
                        <option value="">Select a client...</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>{client.name} ({client.code})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSystemReset}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Reset System
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false);
                    setSelectedClientForReset('');
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-gradient-to-r from-blue-900 to-blue-700 shadow-lg sticky top-0 z-40">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center h-[88px] px-4 md:px-6 gap-3">
              {/* Mobile Menu Button */}
              {isMobile && (
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-white hover:text-blue-200 focus:outline-none focus:text-blue-200 transition-colors duration-200 flex-shrink-0"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h1 className="text-lg md:text-2xl font-bold text-white leading-tight truncate">
                  {currentView === 'dashboard' && 'Dashboard'}
                  {currentView === 'tickets' && 'Tickets'}
                  {currentView === 'create-ticket' && 'New Ticket'}
                  {currentView === 'closed-tickets' && 'Closed Tickets'}
                  {currentView === 'assets' && 'Assets'}
                  {currentView === 'create-asset' && 'New Asset'}
                  {currentView === 'users' && 'Users'}
                  {currentView === 'create-user' && 'New User'}
                  {currentView === 'superadmin' && 'Administration'}
                  {currentView === 'clients' && 'Clients'}
                  {currentView === 'chat' && 'Chat'}
                  {currentView === 'teams' && 'Teams'}
                  {currentView === 'manage-groups' && 'Groups'}
                  {currentView === 'analytics' && 'Analytics'}
                  {currentView === 'infrastructure' && 'Infrastructure'}
                  {currentView === 'reports' && 'Reports'}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  {currentView === 'dashboard' && (
                    <>
                      <span className="hidden md:flex items-center gap-1 bg-green-500/20 text-green-100 px-2 py-1 rounded-full text-xs font-medium">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                        Live
                      </span>
                      <span className="hidden sm:inline text-xs md:text-sm text-blue-100">Welcome, {user.username}</span>
                      <span className={`hidden md:inline px-2 py-1 rounded-full text-xs font-medium ${
                        dashboardStats.is_admin 
                          ? 'bg-green-500/20 text-green-100' 
                          : 'bg-blue-500/20 text-blue-100'
                      }`}>
                        {dashboardStats.is_admin ? 'Admin' : 'Personal'}
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                {/* User Menu */}
                <div className="flex items-center gap-1 md:gap-2 relative">
                  <span className="hidden md:inline text-xs md:text-sm text-blue-100">{user.username}</span>
                  <span className={`hidden md:inline px-2 py-1 text-xs rounded-full ${user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-blue-100 text-blue-800'}`}>{user.role}</span>
                  <button
                    onClick={() => setShowProfileDropdown(v => !v)}
                    className="flex items-center px-2 md:px-3 py-2 rounded-full bg-blue-800 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <svg className="w-5 h-5 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="hidden md:inline ml-2 text-sm font-medium">Profile</span>
                    <svg className="w-4 h-4 ml-1 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 profile-dropdown">
                      <button
                        onClick={() => { setShowProfileDropdown(false); setTimeout(handleLogout, 100); }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Message Display */}
        {message && (
          <div className={`fixed top-20 right-4 z-50 px-4 py-2 rounded-md shadow-lg flex items-center space-x-2 ${message.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
            <span>{message.text}</span>
            <button
              onClick={() => {
                if (messageTimeout) {
                  clearTimeout(messageTimeout);
                  setMessageTimeout(null);
                }
                setMessage('');
              }}
              className="text-white hover:text-gray-200 ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-100">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
            
            {/* Dashboard View */}
            {currentView === 'dashboard' && (
              <div className="space-y-6">
                {/* Role-based Data Scope Notice */}
                <div className={`border rounded-lg p-4 ${
                  dashboardStats.is_admin 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {dashboardStats.is_admin ? (
                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd"/>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm ${dashboardStats.is_admin ? 'text-green-700' : 'text-blue-700'}`}>
                        {dashboardStats.is_admin ? (
                          <>
                            <span className="font-medium">Admin Dashboard:</span> You're viewing all data for your organization.
                          </>
                        ) : (
                          <>
                            <span className="font-medium">Personal Dashboard:</span> You're viewing only tickets and assets assigned to you.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total Tickets Card */}
                  <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-200 hover:scale-105">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4z" clipRule="evenodd"/>
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">
                          {dashboardStats.is_admin ? 'All Tickets (Tenant)' : 'My Tickets'}
                        </h3>
                        <p className="text-2xl font-bold text-gray-900">{dashboardStats.total_tickets || 0}</p>
                        <p className="text-xs mt-1 font-medium">
                          {dashboardStats.is_admin ? (
                            <span className="text-green-600">Organization-wide</span>
                          ) : (
                            <span className="text-blue-600">Created by or assigned to you</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Open Tickets Card */}
                  <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-200 hover:scale-105">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">
                          {dashboardStats.is_admin ? 'Open Tickets (All)' : 'My Open Tickets'}
                        </h3>
                        <p className="text-2xl font-bold text-gray-900">{dashboardStats.open_tickets || 0}</p>
                        <p className="text-xs mt-1 font-medium">
                          {dashboardStats.is_admin ? (
                            <span className="text-orange-600">Across organization</span>
                          ) : (
                            <span className="text-red-600">Requiring your attention</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Total Assets Card */}
                  <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-200 hover:scale-105">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"/>
                            <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd"/>
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">
                          {dashboardStats.is_admin ? 'All Assets (Tenant)' : 'My Assets'}
                        </h3>
                        <p className="text-2xl font-bold text-gray-900">{dashboardStats.total_assets || 0}</p>
                        <p className="text-xs mt-1 font-medium">
                          {dashboardStats.is_admin ? (
                            <span className="text-purple-600">Organization inventory</span>
                          ) : (
                            <span className="text-green-600">Assigned to you</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Asset Value Card */}
                  <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-200 hover:scale-105">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                          </svg>
                         </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">
                          {dashboardStats.is_admin ? 'Total Asset Value' : 'My Asset Value'}
                        </h3>
                        <p className="text-2xl font-bold text-gray-900">₹ {dashboardStats.total_asset_value || 0}</p>
                        <p className="text-xs mt-1 font-medium">
                          {dashboardStats.is_admin ? (
                            <span className="text-indigo-600">Organization total</span>
                          ) : (
                            <span className="text-purple-600">Your assigned assets</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {user.role === 'admin' && (
                    <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-200 hover:scale-105">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
                                                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.total_users || 0}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Ticket Status Chart */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Status Overview</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Open', value: dashboardStats.open_tickets || 0, color: '#EF4444' },
                              { name: 'Closed', value: dashboardStats.closed_tickets || 0, color: '#10B981' }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {[
                              { name: 'Open', color: '#EF4444' },
                              { name: 'Closed', color: '#10B981' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                        </div>
                        </div>

                  {/* Daily Activity Chart */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity Overview</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { 
                                name: 'Tickets Raised', 
                                value: Array.isArray(dailyWorkData) ? dailyWorkData.reduce((sum, day) => sum + (day.raised || 0), 0) : 0, 
                                color: '#3B82F6' 
                              },
                              { 
                                name: 'Tickets Assigned', 
                                value: Array.isArray(dailyWorkData) ? dailyWorkData.reduce((sum, day) => sum + (day.assigned || 0), 0) : 0, 
                                color: '#10B981' 
                              },
                              { 
                                name: 'Tickets Closed', 
                                value: Array.isArray(dailyWorkData) ? dailyWorkData.reduce((sum, day) => sum + (day.closed || 0), 0) : 0, 
                                color: '#F59E0B' 
                              }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {[
                              { name: 'Tickets Raised', color: '#3B82F6' },
                              { name: 'Tickets Assigned', color: '#10B981' },
                              { name: 'Tickets Closed', color: '#F59E0B' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    </div>
                  </div>

                {/* Recent Activity & Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Recent Activity */}
                  <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                      {tickets.slice(0, 5).map((ticket, index) => (
                        <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                          <div className={`w-2 h-2 mt-2 rounded-full ${
                            ticket.priority === 'high' ? 'bg-red-500' :
                            ticket.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{ticket.title}</p>
                            <p className="text-sm text-gray-500 truncate">{ticket.description}</p>
                            <div className="flex items-center mt-1 space-x-2">
                              <span className="text-xs text-gray-400">
                                {new Date(ticket.created_at).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-400">by {ticket.created_by_username}</span>
                              </div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              ticket.status === 'open' ? 'bg-red-100 text-red-800' :
                              ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {ticket.status}
                              </span>
                            </div>
                        </div>
                      ))}
                      {tickets.length === 0 && (
                        <div className="text-center py-8">
                          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-gray-500">No recent activity</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setCurrentView('create-ticket')}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                      >
                        Create New Ticket
                      </button>
                      <button
                        onClick={() => setCurrentView('assets')}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                      >
                        Manage Assets
                      </button>
                      <button
                        onClick={() => setCurrentView('teams')}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                      >
                        Teams
                      </button>
                      <button
                        onClick={() => setCurrentView('reports')}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200"
                      >
                        View Reports
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tickets View */}
            {currentView === 'tickets' && (
              <div>
                {/* Filters and Search */}
                <div className="bg-white/80 backdrop-blur border border-gray-200 shadow-lg rounded-xl p-4 mb-4 flex flex-wrap gap-4 items-end justify-between">
                  <div className="flex flex-wrap gap-4 items-end">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                      <input
                        type="text"
                        placeholder="Search tickets..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={ticketFilters.search}
                        onChange={(e) => {
                          const newFilters = {...ticketFilters, search: e.target.value};
                          setTicketFilters(newFilters);
                          fetchTickets(newFilters);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={ticketFilters.sort_by}
                        onChange={(e) => {
                          const newFilters = {...ticketFilters, sort_by: e.target.value};
                          setTicketFilters(newFilters);
                          fetchTickets(newFilters);
                        }}
                      >
                        <option value="created_at">Created Date</option>
                        <option value="updated_at">Updated Date</option>
                        <option value="priority">Priority</option>
                        <option value="status">Status</option>
                        <option value="title">Title</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Order</label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={ticketFilters.sort_order}
                        onChange={(e) => {
                          const newFilters = {...ticketFilters, sort_order: e.target.value};
                          setTicketFilters(newFilters);
                          fetchTickets(newFilters);
                        }}
                      >
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={ticketFilters.priority_filter}
                        onChange={(e) => {
                          const newFilters = {...ticketFilters, priority_filter: e.target.value};
                          setTicketFilters(newFilters);
                          fetchTickets(newFilters);
                        }}
                      >
                        <option value="">All Priorities</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Assigned To</label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={ticketFilters.assigned_to_filter}
                        onChange={(e) => {
                          const newFilters = {...ticketFilters, assigned_to_filter: e.target.value};
                          setTicketFilters(newFilters);
                          fetchTickets(newFilters);
                        }}
                      >
                        <option value="">All Users</option>
                        {assignableUsers.map(user => (
                          <option key={user.id} value={user.id}>{user.username}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          const resetFilters = {
                            sort_by: 'created_at',
                            sort_order: 'desc',
                            status_filter: '',
                            priority_filter: '',
                            assigned_to_filter: '',
                            created_by_filter: '',
                            search: ''
                          };
                          setTicketFilters(resetFilters);
                          fetchTickets(resetFilters);
                        }}
                        className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-600"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          downloadFile(`${API_URL}/api/export/tickets?format=${e.target.value}`, `tickets.${e.target.value}`);
                          e.target.value = '';
                        }
                      }}
                      className="bg-green-600 text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-green-700 transition-colors min-w-[120px]"
                    >
                      <option value="">Export Data</option>
                      <option value="csv">CSV</option>
                      <option value="excel">Excel</option>
                      <option value="pdf">PDF</option>
                      <option value="json">JSON</option>
                    </select>
                  <button
                    onClick={() => setCurrentView('create-ticket')}
                      className="bg-blue-600 text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors min-w-[120px]"
                  >
                    + Create Ticket
                  </button>
                  </div>
                </div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Open Tickets</h2>
                
                <div className="bg-white rounded-lg shadow p-4 md:p-6 overflow-y-auto" style={{maxHeight: 'calc(100vh - 300px)'}}>
                  <div className="space-y-3 md:space-y-4">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="border rounded-lg p-3 md:p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleTicketClick(ticket)}>
                        {/* Mobile Layout */}
                        <div className="flex flex-col space-y-3">
                          {/* Title and Description */}
                          <div>
                            <h3 className="text-base md:text-lg font-medium text-gray-900 line-clamp-2">{ticket.title}</h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ticket.description}</p>
                          </div>
                          
                          {/* Badges Row */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${ticket.priority === 'high' ? 'bg-red-100 text-red-800' : ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                              {ticket.priority}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${ticket.status === 'open' ? 'bg-blue-100 text-blue-800' : ticket.status === 'in_progress' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
                              {ticket.status}
                            </span>
                            {ticket.media_url && (
                              <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                                📎 Media
                              </span>
                            )}
                          </div>
                          
                          {/* Info Row - Responsive */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                              <span className="truncate">By: {ticket.created_by_username}</span>
                              {ticket.assigned_to_username && (
                                <span className="truncate">To: {ticket.assigned_to_username}</span>
                              )}
                              <span className="whitespace-nowrap">{new Date(ticket.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          {/* Action Buttons - Mobile Friendly */}
                          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTicket(ticket);
                              }}
                              className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTicketToClose(ticket);
                                setShowCloseModal(true);
                              }}
                              className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-green-600 hover:text-green-900 hover:bg-green-50 rounded-md transition-colors"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {tickets.length === 0 && (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="mt-2 text-sm font-medium text-gray-900">No open tickets</p>
                        <p className="mt-1 text-sm text-gray-500">All caught up! No tickets to display.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Create Ticket View */}
            {currentView === 'create-ticket' && (
              <div className="max-w-4xl mx-auto h-full flex flex-col">
                {/* Compact Hero Section */}
                <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-lg shadow-lg mb-4 overflow-hidden flex-shrink-0">
                  <div className="px-6 py-4 text-center relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
                    <div className="relative z-10">
                      <div className="inline-flex items-center justify-center w-10 h-10 bg-white/20 rounded-full mb-2 backdrop-blur-sm">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-bold text-white mb-1">Create New Support Ticket</h2>
                      <p className="text-blue-100 text-sm">We're here to help! Describe your issue and we'll get right on it.</p>
                    </div>
                  </div>
                </div>

                {/* Form Container */}
                <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden flex-1 flex flex-col">
                  <div className="p-6 flex-1">
                    <form onSubmit={handleCreateTicket} className="h-full flex flex-col">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                        {/* Left Column */}
                        <div className="space-y-4">
                          {/* Title Section */}
                          <div className="space-y-1">
                            <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                              <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              What's the issue?
                            </label>
                            <input
                              type="text"
                              required
                              className="w-full border-2 border-gray-200 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                              placeholder="Give your ticket a clear, descriptive title..."
                              value={ticketForm.title}
                              onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                            />
                          </div>
                          
                          {/* Description Section */}
                          <div className="space-y-1">
                            <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                              <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Tell us more about it
                            </label>
                            <textarea
                              required
                              rows={4}
                              className="w-full border-2 border-gray-200 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 resize-none"
                              placeholder="Provide detailed information about the issue..."
                              value={ticketForm.description}
                              onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                          {/* Priority Section */}
                          <div className="space-y-1">
                            <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                              <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Priority Level
                            </label>
                            <div className="space-y-2">
                              {[
                                { value: 'low', label: 'Low Priority', color: 'green', icon: '🟢' },
                                { value: 'medium', label: 'Medium Priority', color: 'yellow', icon: '🟡' },
                                { value: 'high', label: 'High Priority', color: 'red', icon: '🔴' }
                              ].map((priority) => (
                                <label key={priority.value} className={`flex items-center p-2.5 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                                  ticketForm.priority === priority.value 
                                    ? `border-${priority.color}-500 bg-${priority.color}-50 shadow-sm` 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}>
                                  <input
                                    type="radio"
                                    name="priority"
                                    value={priority.value}
                                    checked={ticketForm.priority === priority.value}
                                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                                    className="sr-only"
                                  />
                                  <span className="text-lg mr-3">{priority.icon}</span>
                                  <span className="font-medium text-sm">{priority.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Assignment Section */}
                          <div className="space-y-1">
                            <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                              <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Assign to (Optional)
                            </label>
                            <select
                              className="w-full border-2 border-gray-200 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-white"
                              value={ticketForm.assigned_to}
                              onChange={(e) => setTicketForm({ ...ticketForm, assigned_to: e.target.value })}
                            >
                              <option value="">Auto-assign to best available agent</option>
                              {assignableUsers.map(user => (
                                <option key={user.id} value={user.id}>{user.username}</option>
                              ))}
                            </select>
                          </div>
                          
                          {/* File Upload Section */}
                          <div className="space-y-1">
                            <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                              <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              Add file (Optional)
                            </label>
                            <div className={`relative border-2 border-dashed rounded-lg p-3 text-center transition-all duration-200 ${
                              selectedFile 
                                ? 'border-green-400 bg-green-50' 
                                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                            }`}>
                              {!selectedFile ? (
                                <div>
                                  <svg className="mx-auto h-6 w-6 text-gray-400 mb-1" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                  <div className="font-medium text-gray-700 text-sm mb-1">Drop file or click</div>
                                  <div className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                      <div className="font-medium text-gray-800 text-xs">{selectedFile.name}</div>
                                      <div className="text-xs text-gray-600">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedFile(null)}
                                    className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-200"
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
                            </div>
                            {isUploading && (
                              <div className="flex items-center justify-center py-1">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-blue-600 font-medium text-sm">Uploading...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setCurrentView('tickets')}
                          className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md flex items-center justify-center"
                        >
                          {isLoading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Creating...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Create Ticket
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Closed Tickets View */}
            {currentView === 'closed-tickets' && (
              <div>
                {/* Filters and Search for Closed Tickets */}
                <div className="bg-white/80 backdrop-blur border border-gray-200 shadow-lg rounded-xl p-4 mb-4 flex flex-wrap gap-4 items-end justify-between">
                  <div className="flex flex-wrap gap-4 items-end">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                      <input
                        type="text"
                        placeholder="Search closed tickets..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={ticketFilters.search}
                        onChange={(e) => {
                          const newFilters = {...ticketFilters, search: e.target.value};
                          setTicketFilters(newFilters);
                          fetchClosedTickets(newFilters);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={ticketFilters.sort_by}
                        onChange={(e) => {
                          const newFilters = {...ticketFilters, sort_by: e.target.value};
                          setTicketFilters(newFilters);
                          fetchClosedTickets(newFilters);
                        }}
                      >
                        <option value="closed_at">Closed Date</option>
                        <option value="created_at">Created Date</option>
                        <option value="priority">Priority</option>
                        <option value="title">Title</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Order</label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={ticketFilters.sort_order}
                        onChange={(e) => {
                          const newFilters = {...ticketFilters, sort_order: e.target.value};
                          setTicketFilters(newFilters);
                          fetchClosedTickets(newFilters);
                        }}
                      >
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={ticketFilters.priority_filter}
                        onChange={(e) => {
                          const newFilters = {...ticketFilters, priority_filter: e.target.value};
                          setTicketFilters(newFilters);
                          fetchClosedTickets(newFilters);
                        }}
                      >
                        <option value="">All Priorities</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Closed By</label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={ticketFilters.closed_by_filter}
                        onChange={(e) => {
                          const newFilters = {...ticketFilters, closed_by_filter: e.target.value};
                          setTicketFilters(newFilters);
                          fetchClosedTickets(newFilters);
                        }}
                      >
                        <option value="">All Users</option>
                        {assignableUsers.map(user => (
                          <option key={user.id} value={user.id}>{user.username}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          const resetFilters = {
                            sort_by: 'closed_at',
                            sort_order: 'desc',
                            status_filter: '',
                            priority_filter: '',
                            assigned_to_filter: '',
                            created_by_filter: '',
                            closed_by_filter: '',
                            search: ''
                          };
                          setTicketFilters(resetFilters);
                          fetchClosedTickets(resetFilters);
                        }}
                        className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-600"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                  <div className="flex items-end ml-auto">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          downloadFile(`${API_URL}/api/export/tickets?format=${e.target.value}`, `closed-tickets.${e.target.value}`);
                          e.target.value = '';
                        }
                      }}
                      className="bg-green-600 text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-green-700 transition-colors min-w-[120px]"
                    >
                      <option value="">Export Data</option>
                      <option value="csv">CSV</option>
                      <option value="excel">Excel</option>
                      <option value="pdf">PDF</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>
                </div>

                <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Closed Tickets</h2>
                
                <div className="bg-white rounded-lg shadow p-4 md:p-6 overflow-y-auto" style={{maxHeight: 'calc(100vh - 300px)'}}>
                  <div className="space-y-3 md:space-y-4">
                    {closedTickets.map((ticket) => (
                      <div key={ticket.id} className="border rounded-lg p-3 md:p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleTicketClick(ticket)}>
                        {/* Mobile Layout */}
                        <div className="flex flex-col space-y-3">
                          {/* Title and Description */}
                          <div>
                            <h3 className="text-base md:text-lg font-medium text-gray-900 line-clamp-2">{ticket.title}</h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ticket.description}</p>
                          </div>
                          
                          {/* Badges Row */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${ticket.priority === 'high' ? 'bg-red-100 text-red-800' : ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                              {ticket.priority}
                            </span>
                            <span className="px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-800">
                              ✓ Closed
                            </span>
                            {ticket.media_url && (
                              <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                                📎 Media
                              </span>
                            )}
                          </div>
                          
                          {/* Info Grid - Responsive */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500">
                            <div className="flex flex-col space-y-1">
                              <span className="truncate">Created: {ticket.created_by_username}</span>
                              {ticket.assigned_to_username && (
                                <span className="truncate">Assigned: {ticket.assigned_to_username}</span>
                              )}
                            </div>
                            <div className="flex flex-col space-y-1">
                              <span className="truncate">Closed by: {ticket.closed_by_username}</span>
                              <span className="whitespace-nowrap">Date: {new Date(ticket.closed_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          {/* Close Comment */}
                          {ticket.close_comment && (
                            <div className="p-3 bg-gray-50 rounded-md border-l-4 border-green-500">
                              <p className="text-xs font-medium text-gray-700 mb-1">Close Comment:</p>
                              <p className="text-sm text-gray-600">{ticket.close_comment}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {closedTickets.length === 0 && (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="mt-2 text-sm font-medium text-gray-900">No closed tickets</p>
                        <p className="mt-1 text-sm text-gray-500">Closed tickets will appear here.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Assets View */}
            {currentView === 'assets' && (
              <div className="space-y-4 md:space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                    {user.role === 'admin' ? 'All Assets' : 'My Assets'}
                  </h2>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {user.role === 'admin' && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              downloadFile(`${API_URL}/api/export/assets?format=${e.target.value}`, `assets.${e.target.value}`);
                              e.target.value = '';
                            }
                          }}
                        className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors w-full sm:w-auto"
                        >
                          <option value="">Export Assets</option>
                          <option value="csv">CSV</option>
                          <option value="excel">Excel</option>
                          <option value="pdf">PDF</option>
                          <option value="json">JSON</option>
                        </select>
                    )}
                    {user.role === 'admin' && (
                      <button
                        onClick={() => setCurrentView('create-asset')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto"
                      >
                        + Create Asset
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 md:p-6">
                    <div className="space-y-3 md:space-y-4">
                      {assets.map((asset) => (
                        <div key={asset.id} className="border rounded-lg p-3 md:p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleAssetClick(asset)}>
                          {/* Mobile Layout */}
                          <div className="flex flex-col space-y-3">
                            {/* Title and Description */}
                            <div>
                              <h3 className="text-base md:text-lg font-medium text-gray-900 line-clamp-1">{asset.name}</h3>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{asset.description}</p>
                            </div>
                            
                            {/* Info Grid - Responsive */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-500">
                              <div>
                                <span className="font-medium text-gray-700">Type:</span>
                                <p className="truncate">{asset.asset_type}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Value:</span>
                                <p>₹{asset.value}</p>
                              </div>
                              {asset.serial_number && (
                                <div className="col-span-2 sm:col-span-1">
                                  <span className="font-medium text-gray-700">S/N:</span>
                                  <p className="truncate">{asset.serial_number}</p>
                                </div>
                              )}
                              {asset.assigned_to_username && (
                                <div className="col-span-2 sm:col-span-1">
                                  <span className="font-medium text-gray-700">Assigned:</span>
                                  <p className="truncate">{asset.assigned_to_username}</p>
                                </div>
                              )}
                            </div>
                            
                            {/* Status Badge */}
                            <div className="flex items-center">
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${asset.assigned_to ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {asset.assigned_to ? '✓ Assigned' : '○ Available'}
                              </span>
                            </div>
                            
                            {/* Action Buttons - Mobile Friendly */}
                            {user.role === 'admin' && (
                              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingAsset(asset);
                                    setEditAssetForm({
                                      name: asset.name,
                                      description: asset.description,
                                      asset_type: asset.asset_type,
                                      value: asset.value,
                                      serial_number: asset.serial_number || '',
                                      assigned_to: asset.assigned_to || ''
                                    });
                                  }}
                                  className="flex items-center justify-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </button>
                                {!asset.assigned_to && (
                                  <select
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        handleAssignAsset(asset.id, e.target.value);
                                        e.target.value = '';
                                      }
                                    }}
                                    className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                                  >
                                    <option value="">Assign to...</option>
                                    {assignableUsers.map(u => (
                                      <option key={u.id} value={u.id}>{u.username}</option>
                                    ))}
                                  </select>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteAsset(asset.id, asset.name);
                                  }}
                                  className="flex items-center justify-center px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {assets.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-gray-500">
                            {user.role === 'admin' ? 'No assets found' : 'No assets assigned to you'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Create Asset View */}
            {currentView === 'create-asset' && user.role === 'admin' && (
              <div className="max-w-3xl mx-auto">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 rounded-xl shadow-xl mb-6 overflow-hidden">
                  <div className="px-6 py-6 text-center relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20"></div>
                    <div className="relative z-10">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-full mb-3 backdrop-blur-sm">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-1">Create New Asset</h2>
                      <p className="text-purple-100 text-sm">Add a new asset to your inventory management system</p>
                    </div>
                  </div>
                </div>

                {/* Form Container */}
                <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="p-6">
                    <form onSubmit={handleCreateAsset} className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                          {/* Asset Name */}
                          <div className="space-y-1">
                            <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                              <svg className="w-4 h-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              Asset Name
                            </label>
                            <input
                              type="text"
                              required
                              className="w-full border-2 border-gray-200 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                              placeholder="Enter asset name (e.g., MacBook Pro 2023)..."
                              value={assetForm.name}
                              onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                            />
                          </div>
                          
                          {/* Description */}
                          <div className="space-y-1">
                            <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                              <svg className="w-4 h-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Description
                            </label>
                            <textarea
                              required
                              rows={4}
                              className="w-full border-2 border-gray-200 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 resize-none"
                              placeholder="Provide detailed information about the asset..."
                              value={assetForm.description}
                              onChange={(e) => setAssetForm({ ...assetForm, description: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                          {/* Asset Type */}
                          <div className="space-y-1">
                            <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                              <svg className="w-4 h-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                              Asset Type
                            </label>
                            <div className="space-y-2">
                              {[
                                { value: 'laptop', label: 'Laptop', icon: 'laptop' },
                                { value: 'desktop', label: 'Desktop', icon: 'desktop' },
                                { value: 'mobile', label: 'Mobile', icon: 'mobile' },
                                { value: 'monitor', label: 'Monitor', icon: 'monitor' },
                                { value: 'printer', label: 'Printer', icon: 'printer' },
                                { value: 'other', label: 'Other', icon: 'package' }
                              ].map((type) => (
                                <label key={type.value} className={`flex items-center p-2.5 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                                  assetForm.asset_type === type.value 
                                    ? 'border-purple-500 bg-purple-50 shadow-sm' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}>
                                  <input
                                    type="radio"
                                    name="asset_type"
                                    value={type.value}
                                    checked={assetForm.asset_type === type.value}
                                    onChange={(e) => setAssetForm({ ...assetForm, asset_type: e.target.value })}
                                    className="sr-only"
                                  />
                                  <span className="text-lg mr-3">{type.icon}</span>
                                  <span className="font-medium text-sm">{type.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Value and Serial Number */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                                <svg className="w-4 h-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                Value (₹)
                              </label>
                              <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                className="w-full border-2 border-gray-200 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                                placeholder="0.00"
                                value={assetForm.value}
                                onChange={(e) => setAssetForm({ ...assetForm, value: parseFloat(e.target.value) })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                                <svg className="w-4 h-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                </svg>
                                Serial Number
                              </label>
                              <input
                                type="text"
                                className="w-full border-2 border-gray-200 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                                placeholder="Optional serial number"
                                value={assetForm.serial_number}
                                onChange={(e) => setAssetForm({ ...assetForm, serial_number: e.target.value })}
                              />
                            </div>
                          </div>
                          
                          {/* File Upload */}
                          <div className="space-y-1">
                            <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                              <svg className="w-4 h-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              Add photo (Optional)
                            </label>
                            <div className={`relative border-2 border-dashed rounded-lg p-3 text-center transition-all duration-200 ${
                              selectedFile 
                                ? 'border-green-400 bg-green-50' 
                                : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                            }`}>
                              {!selectedFile ? (
                                <div>
                                  <svg className="mx-auto h-6 w-6 text-gray-400 mb-1" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                  <div className="font-medium text-gray-700 text-sm mb-1">Drop file or click</div>
                                  <div className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                      <div className="font-medium text-gray-800 text-xs">{selectedFile.name}</div>
                                      <div className="text-xs text-gray-600">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedFile(null)}
                                    className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-200"
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
                            </div>
                            {isUploading && (
                              <div className="flex items-center justify-center py-1">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-purple-600 font-medium text-sm">Uploading...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => setCurrentView('assets')}
                          className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md flex items-center justify-center"
                        >
                          {isLoading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Creating...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Create Asset
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* SuperAdmin View */}
            {currentView === 'superadmin' && user.role === 'superadmin' && (
              <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">SuperAdmin Panel</h3>
                  <p className="text-red-700 text-sm">
                    This panel allows you to bulk delete system data for testing purposes. All actions are irreversible.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Individual Delete Actions */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Delete Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => bulkDelete('delete-all-tickets', 'tickets')}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                      >
                        Delete All Tickets
                      </button>
                      <button
                        onClick={() => bulkDelete('delete-all-users', 'users (except superadmin)')}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                      >
                        Delete All Users
                      </button>
                      <button
                        onClick={() => bulkDelete('delete-all-assets', 'assets')}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                      >
                        Delete All Assets
                      </button>
                      <button
                        onClick={() => bulkDelete('delete-all-messages', 'chat messages')}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                      >
                        Delete All Messages
                      </button>
                    </div>
                  </div>

                  {/* System Reset */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete System Reset</h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-red-700 text-sm">
                        This will delete ALL data and recreate the default admin user with credentials: admin/admin123
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowResetModal(true);
                        fetchClients();
                      }}
                      className="w-full bg-red-800 text-white px-4 py-3 rounded-md hover:bg-red-900 transition-colors font-semibold"
                    >
                      RESET CLIENT SYSTEM
                    </button>
                  </div>
                </div>

                {/* Current System Stats */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current System Data</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{dashboardStats.total_tickets || 0}</div>
                      <div className="text-sm text-gray-500">Tickets</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{users.length || 0}</div>
                      <div className="text-sm text-gray-500">Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{dashboardStats.total_assets || 0}</div>
                      <div className="text-sm text-gray-500">Assets</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{messages.length || 0}</div>
                      <div className="text-sm text-gray-500">Messages</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Client Management View */}
            {currentView === 'clients' && user.role === 'superadmin' && (
              <div className="space-y-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-800 mb-2">Client Management</h3>
                  <p className="text-purple-700 text-sm">
                    Manage client organizations and their access codes. Each client has isolated data.
                  </p>
                </div>

                {/* Create Client Form */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Client</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-blue-800 text-sm">
                      Each client gets a unique code (e.g., 0012, 0013, 0014). Users will need this code to log in.
                    </p>
                    <p className="text-blue-800 text-sm mt-2">
                      A default admin user will be automatically created with credentials: <strong>admin / admin123</strong>
                    </p>
                  </div>
                  <form onSubmit={handleCreateClient} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
                        <input
                          type="text"
                          required
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={clientForm.name}
                          onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client Code *</label>
                        <input
                          type="text"
                          required
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={clientForm.code}
                          onChange={(e) => setClientForm({ ...clientForm, code: e.target.value })}
                          placeholder="e.g., 0012, 0013, 0014"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
                        <input
                          type="email"
                          required
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={clientForm.contact_email}
                          onChange={(e) => setClientForm({ ...clientForm, contact_email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                        <input
                          type="tel"
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={clientForm.contact_phone}
                          onChange={(e) => setClientForm({ ...clientForm, contact_phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <textarea
                        rows={3}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={clientForm.address}
                        onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">User Limit *</label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        required
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={clientForm.user_limit}
                        onChange={(e) => setClientForm({ ...clientForm, user_limit: parseInt(e.target.value) || 10 })}
                        placeholder="Maximum number of users allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum number of users this client can have
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Asset Limit *</label>
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        required
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={clientForm.asset_limit}
                        onChange={(e) => setClientForm({ ...clientForm, asset_limit: parseInt(e.target.value) || 50 })}
                        placeholder="Maximum number of assets allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum number of assets this client can have
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors min-w-[120px] disabled:opacity-50"
                      >
                        {isLoading ? 'Creating...' : 'Create Client'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Client Statistics */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
                      <div className="text-sm text-gray-600">Total Clients</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {clients.filter(c => c.is_active).length}
                      </div>
                      <div className="text-sm text-gray-600">Active Clients</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {clients.filter(c => !c.is_active).length}
                      </div>
                      <div className="text-sm text-gray-600">Inactive Clients</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {Object.values(clientStats).reduce((total, stats) => total + (stats?.current_users || 0), 0)}
                      </div>
                      <div className="text-sm text-gray-600">Total Users</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {Object.values(clientStats).reduce((total, stats) => total + (stats?.current_assets || 0), 0)}
                      </div>
                      <div className="text-sm text-gray-600">Total Assets</div>
                    </div>
                  </div>
                </div>

                {/* Clients List */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">All Clients</h3>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={showInactiveClients}
                          onChange={(e) => setShowInactiveClients(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Show Inactive Clients</span>
                      </label>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assets</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {clients
                          .filter(client => showInactiveClients || client.is_active)
                          .map((client) => (
                          <tr key={client.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{client.name}</div>
                                {client.address && (
                                  <div className="text-sm text-gray-500">{client.address}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {client.code}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm text-gray-900">{client.contact_email}</div>
                                {client.contact_phone && (
                                  <div className="text-sm text-gray-500">{client.contact_phone}</div>
                                )}
                                <div className="text-xs text-gray-400 mt-1">
                                  Admin: admin/admin123
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-900">
                                    {clientStats[client.id]?.current_users || 0}
                                  </span>
                                  <span className="text-gray-400">/</span>
                                  <span className="text-gray-600">
                                    {client.user_limit || 10}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {clientStats[client.id]?.current_users >= (client.user_limit || 10) ? (
                                    <span className="text-red-600">Limit reached</span>
                                  ) : (
                                    <span className="text-green-600">
                                      {((client.user_limit || 10) - (clientStats[client.id]?.current_users || 0))} available
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-900">
                                    {clientStats[client.id]?.current_assets || 0}
                                  </span>
                                  <span className="text-gray-400">/</span>
                                  <span className="text-gray-600">
                                    {client.asset_limit || 50}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {clientStats[client.id]?.current_assets >= (client.asset_limit || 50) ? (
                                    <span className="text-red-600">Limit reached</span>
                                  ) : (
                                    <span className="text-green-600">
                                      {((client.asset_limit || 50) - (clientStats[client.id]?.current_assets || 0))} available
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                client.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {client.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(client.created_at).toLocaleDateString()}
                            </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingClient(client);
                                    setEditClientForm({
                                      name: client.name,
                                      code: client.code,
                                      contact_email: client.contact_email,
                                      contact_phone: client.contact_phone || '',
                                      address: client.address || '',
                                      user_limit: client.user_limit || 10,
                                      asset_limit: client.asset_limit || 50
                                    });
                                  }}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Edit client details"
                                >
                                  Edit
                                </button>
                                <div className="relative group">
                                  <button
                                    className="text-purple-600 hover:text-purple-900"
                                    title="Manage limits"
                                  >
                                    Limits
                                  </button>
                                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                    <div className="py-1">
                                      <button
                                        onClick={() => {
                                          setEditingUserLimit(client);
                                          setUserLimitForm({ user_limit: client.user_limit || 10 });
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      >
                                        User Limits
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingAssetLimit(client);
                                          setAssetLimitForm({ asset_limit: client.asset_limit || 50 });
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      >
                                        Asset Limits
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                {client.is_active ? (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleDeleteClient(client.id)}
                                      className="text-orange-600 hover:text-orange-900"
                                      title="Deactivate client"
                                    >
                                      Deactivate
                                    </button>
                                    <button
                                      onClick={() => handlePermanentlyDeleteClient(client.id, client.name)}
                                      className="text-red-600 hover:text-red-900"
                                      title="Permanently delete client"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleReactivateClient(client.id)}
                                      className="text-green-600 hover:text-green-900"
                                      title="Reactivate client"
                                    >
                                      Reactivate
                                    </button>
                                    <button
                                      onClick={() => handlePermanentlyDeleteClient(client.id, client.name)}
                                      className="text-red-600 hover:text-red-900"
                                      title="Permanently delete client"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {clients.filter(client => showInactiveClients || client.is_active).length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-500">
                          {showInactiveClients ? 'No clients found' : 'No active clients found'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit Client Modal */}
                {editingClient && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Client</h3>
                      {editingClient.code === '031210' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                          <p className="text-yellow-800 text-sm">
                            This is the default client. Changes will affect all existing users using this client code.
                          </p>
                        </div>
                      )}
                      <form onSubmit={handleEditClient} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
                          <input
                            type="text"
                            required
                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={editClientForm.name}
                            onChange={(e) => setEditClientForm({ ...editClientForm, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Client Code *</label>
                          <input
                            type="text"
                            required
                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={editClientForm.code}
                            onChange={(e) => setEditClientForm({ ...editClientForm, code: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
                          <input
                            type="email"
                            required
                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={editClientForm.contact_email}
                            onChange={(e) => setEditClientForm({ ...editClientForm, contact_email: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                          <input
                            type="tel"
                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={editClientForm.contact_phone}
                            onChange={(e) => setEditClientForm({ ...editClientForm, contact_phone: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                          <textarea
                            rows={3}
                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={editClientForm.address}
                            onChange={(e) => setEditClientForm({ ...editClientForm, address: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">User Limit *</label>
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            required
                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={editClientForm.user_limit}
                            onChange={(e) => setEditClientForm({ ...editClientForm, user_limit: parseInt(e.target.value) || 10 })}
                            placeholder="Maximum number of users allowed"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Maximum number of users this client can have
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Asset Limit *</label>
                          <input
                            type="number"
                            min="1"
                            max="10000"
                            required
                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={editClientForm.asset_limit}
                            onChange={(e) => setEditClientForm({ ...editClientForm, asset_limit: parseInt(e.target.value) || 50 })}
                            placeholder="Maximum number of assets allowed"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Maximum number of assets this client can have
                          </p>
                        </div>
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingClient(null);
                              setEditClientForm({ name: '', code: '', contact_email: '', contact_phone: '', address: '', user_limit: 10, asset_limit: 50 });
                            }}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                          >
                            {isLoading ? 'Updating...' : 'Update Client'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Asset Limit Management Modal */}
                {editingAssetLimit && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Asset Limit</h3>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                        <p className="text-green-800 text-sm">
                          <strong>Client:</strong> {editingAssetLimit.name}
                        </p>
                        <p className="text-green-800 text-sm mt-1">
                          <strong>Current Assets:</strong> {clientStats[editingAssetLimit.id]?.current_assets || 0}
                        </p>
                        <p className="text-green-800 text-sm mt-1">
                          <strong>Current Limit:</strong> {editingAssetLimit.asset_limit || 50}
                        </p>
                      </div>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        handleUpdateAssetLimit(editingAssetLimit.id, assetLimitForm.asset_limit);
                      }} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">New Asset Limit *</label>
                          <input
                            type="number"
                            min="1"
                            max="10000"
                            required
                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={assetLimitForm.asset_limit}
                            onChange={(e) => setAssetLimitForm({ asset_limit: parseInt(e.target.value) || 50 })}
                            placeholder="Maximum number of assets allowed"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Cannot be less than current asset count ({clientStats[editingAssetLimit.id]?.current_assets || 0})
                          </p>
                        </div>
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAssetLimit(null);
                              setAssetLimitForm({ asset_limit: 50 });
                            }}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isLoading || assetLimitForm.asset_limit < (clientStats[editingAssetLimit.id]?.current_assets || 0)}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                          >
                            {isLoading ? 'Updating...' : 'Update Limit'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* User Limit Management Modal */}
                {editingUserLimit && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage User Limit</h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-blue-800 text-sm">
                          <strong>Client:</strong> {editingUserLimit.name}
                        </p>
                        <p className="text-blue-800 text-sm mt-1">
                          <strong>Current Users:</strong> {clientStats[editingUserLimit.id]?.current_users || 0}
                        </p>
                        <p className="text-blue-800 text-sm mt-1">
                          <strong>Current Limit:</strong> {editingUserLimit.user_limit || 10}
                        </p>
                      </div>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        handleUpdateUserLimit(editingUserLimit.id, userLimitForm.user_limit);
                      }} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">New User Limit *</label>
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            required
                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={userLimitForm.user_limit}
                            onChange={(e) => setUserLimitForm({ user_limit: parseInt(e.target.value) || 10 })}
                            placeholder="Maximum number of users allowed"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Cannot be less than current user count ({clientStats[editingUserLimit.id]?.current_users || 0})
                          </p>
                        </div>
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUserLimit(null);
                              setUserLimitForm({ user_limit: 10 });
                            }}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isLoading || userLimitForm.user_limit < (clientStats[editingUserLimit.id]?.current_users || 0)}
                            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
                          >
                            {isLoading ? 'Updating...' : 'Update Limit'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Chat View - Ultra Modern Design */}
            {currentView === 'chat' && (
              <div className="h-[calc(100vh-200px)] bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl shadow-2xl flex overflow-hidden">
                {/* Enhanced User List */}
                <div className={`${
                  isMobile 
                    ? (selectedChatUser ? 'hidden' : 'w-full')
                    : 'w-1/3'
                } bg-white border-r border-gray-200 flex flex-col`}>
                  {/* Enhanced Header with Gradient */}
                  <div className="p-6 flex-shrink-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-pink-600/90"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">Team Chat</h3>
                            <p className="text-indigo-100 text-sm">Connect & collaborate</p>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Search Bar */}
                  <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-indigo-50">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search conversations..."
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white shadow-sm transition-all duration-200 hover:shadow-md"
                      />
                      <div className="absolute left-4 top-3.5">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced User List */}
                  <div className="flex-1 flex flex-col">
                    {assignableUsers.filter(u => u.id !== user.id).map((chatUser) => {
                      const lastMessage = getLastMessage(chatUser.id);
                      const unreadCount = messages.filter(msg => 
                        msg.sender_id === chatUser.id && 
                        msg.recipient_id === user.id &&
                        (!readMessages[chatUser.id] || new Date(msg.created_at).getTime() > readMessages[chatUser.id])
                      ).length;
                      
                      return (
                        <div
                          key={chatUser.id}
                          onClick={() => handleSelectChatUser(chatUser)}
                          className={`p-4 border-b border-gray-50 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:shadow-md group ${
                            selectedChatUser?.id === chatUser.id ? 'bg-gradient-to-r from-indigo-100 to-purple-100 border-l-4 border-indigo-500 shadow-md' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-xl transition-all duration-200 ${
                                chatUser.role === 'admin' 
                                  ? 'bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600' 
                                  : 'bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-600'
                              }`}>
                                {chatUser.username.charAt(0).toUpperCase()}
                              </div>
                              {/* Unread Messages Badge */}
                              {unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                                  <span className="text-white text-xs font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm font-bold text-gray-900 truncate">
                                    {chatUser.username}
                                  </p>
                                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full shadow-sm ${
                                    chatUser.role === 'admin' 
                                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                                      : 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white'
                                  }`}>
                                    {chatUser.role}
                                  </span>
                                </div>
                              </div>
                              {lastMessage && (
                                <div className="flex items-center justify-between mt-2">
                                  <p className="text-sm text-gray-600 truncate flex-1 font-medium">
                                    {lastMessage.sender_id === user.id ? (
                                      <span className="text-indigo-600 font-bold">You: </span>
                                    ) : null}
                                    {lastMessage.message}
                                  </p>
                                  <div className="flex flex-col items-end ml-2">
                                    <span className="text-xs text-gray-400 font-medium">
                                      {new Date(lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {lastMessage.sender_id !== user.id && (
                                      <div className="flex items-center mt-1">
                                        <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              {!lastMessage && (
                                <p className="text-sm text-gray-400 italic">No messages yet</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {assignableUsers.filter(u => u.id !== user.id).length === 0 && (
                      <div className="p-8 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                          <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">No Team Members</h3>
                        <p className="text-gray-600 font-medium mb-1">Your team is waiting to be built!</p>
                        <p className="text-gray-400 text-sm mb-6">Invite colleagues to start collaborating</p>
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                          <div className="flex items-center justify-center space-x-2 text-indigo-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-semibold">Contact your admin to add team members</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex flex-col bg-white ${isMobile && !selectedChatUser ? 'hidden' : ''}`}>
                  {selectedChatUser ? (
                    <>
                      {/* Chat Header */}
                      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50 flex-shrink-0 flex items-center space-x-4">
                        {/* Back Button on Mobile */}
                        {isMobile && (
                          <button
                            className="mr-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                            onClick={() => setSelectedChatUser(null)}
                          >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                        )}
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shadow-lg ${
                            selectedChatUser.role === 'admin' ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'
                          }`}>
                            {selectedChatUser.username.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{selectedChatUser.username}</h4>
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                            selectedChatUser.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {selectedChatUser.role}
                          </span>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 flex flex-col justify-end p-4 min-h-0 bg-gradient-to-b from-gray-50 to-white">
                        <div className="flex flex-col justify-end space-y-3 max-h-full">
                          {getConversationMessages(selectedChatUser.id).slice(-10).map((msg, index) => {
                          const isOwn = msg.sender_id === user.id;
                          const showAvatar = index === 0 || getConversationMessages(selectedChatUser.id)[index - 1]?.sender_id !== msg.sender_id;
                          
                          return (
                            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end space-x-2`}>
                              {!isOwn && (
                                <div className="w-8 h-8 flex-shrink-0">
                                  {showAvatar ? (
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${
                                      selectedChatUser.role === 'admin' ? 'bg-gradient-to-br from-purple-400 to-purple-500' : 'bg-gradient-to-br from-blue-400 to-blue-500'
                                    }`}>
                                      {selectedChatUser.username.charAt(0).toUpperCase()}
                                    </div>
                                  ) : null}
                                </div>
                              )}
                              <div className={`max-w-xs lg:max-w-md group`}>
                                <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                                  isOwn 
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md' 
                                    : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                                }`}>
                                  <p className="text-sm leading-relaxed break-words">{msg.message}</p>
                                  {msg.media_url && (
                                    <div className="mt-3">
                                      <img 
                                        src={`${API_URL}${msg.media_url}`} 
                                        alt="Attached media" 
                                        className="max-w-full h-auto rounded-xl cursor-pointer hover:opacity-90 transition-opacity shadow-md"
                                        onClick={() => window.open(`${API_URL}${msg.media_url}`, '_blank')}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                              {isOwn && (
                                <div className="w-8 h-8 flex-shrink-0">
                                  {showAvatar ? (
                                    <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                      {user.username.charAt(0).toUpperCase()}
                                    </div>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          );
                          })}
                          {getConversationMessages(selectedChatUser.id).length === 0 && (
                            <div className="text-center py-8">
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">Start a conversation</h3>
                              <p className="text-gray-500">Send a message to {selectedChatUser.username} to get started!</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Message Input */}
                      <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
                        <form onSubmit={handleSendMessage} className="space-y-4">
                          <div className="flex items-end space-x-3">
                            <div className="flex-1">
                              <div className="relative">
                                <input
                                  type="text"
                                  required
                                  className="w-full border border-gray-300 rounded-2xl py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm placeholder-gray-500"
                                  placeholder={`Type a message to ${selectedChatUser.username}...`}
                                  value={newMessage}
                                  onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <label className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                <input
                                  type="file"
                                  accept="image/*,document/*"
                                  onChange={(e) => setSelectedFile(e.target.files[0])}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="submit"
                                disabled={isLoading || (!newMessage.trim() && !selectedFile)}
                                className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                              >
                                {isLoading ? (
                                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                          
                          {selectedFile && (
                            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-blue-900">{selectedFile.name}</p>
                                  <p className="text-xs text-blue-600">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedFile(null)}
                                className="p-1 text-blue-400 hover:text-blue-600 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}
                          
                          {isUploading && (
                            <div className="flex items-center space-x-2 text-blue-600">
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span className="text-sm font-medium">Uploading file...</span>
                            </div>
                          )}
                        </form>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
                      <div className="text-center max-w-md">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Team Chat</h3>
                        <p className="text-gray-500 mb-4">Select a team member from the sidebar to start a conversation and collaborate effectively.</p>
                        <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>Secure</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>Real-time</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Teams View - Mobile Responsive */}
            {currentView === 'teams' && (
              <div className="h-[calc(100vh-200px)] bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg md:rounded-2xl shadow-lg md:shadow-2xl flex flex-col md:flex-row overflow-hidden">
                {/* Enhanced Teams List - Mobile Responsive */}
                <div className={`${selectedTeam ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 bg-white border-r border-gray-200 flex-col`}>
                  {/* Header with Gradient - Mobile Responsive */}
                  <div className="p-4 md:p-6 bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-600 text-white">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h3 className="text-lg md:text-xl font-bold">Teams</h3>
                        <p className="text-teal-100 text-xs md:text-sm mt-1">Collaborate with your teams</p>
                      </div>
                      {(user.role === 'admin' || user.role === 'superadmin') && (
                        <button
                          onClick={() => setCurrentView('create-team')}
                          className="w-full sm:w-auto bg-white/20 backdrop-blur-sm text-white px-3 md:px-4 py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-semibold hover:bg-white/30 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Create Team</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search teams..."
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition-all duration-200"
                      />
                      <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Teams List */}
                  <div className="flex-1 overflow-y-auto">
                    {!teams || teams.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <p className="text-gray-600 font-semibold">Loading teams...</p>
                        <p className="text-gray-400 text-sm mt-1">Please wait while we fetch your teams</p>
                      </div>
                    ) : (
                      teams.filter(team => isTeamMember(team)).map((team) => (
                      <div
                        key={team.id}
                        onClick={() => handleSelectTeam(team)}
                        className={`p-4 border-b border-gray-50 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 hover:shadow-md group ${
                          selectedTeam?.id === team.id ? 'bg-gradient-to-r from-teal-100 to-cyan-100 border-l-4 border-teal-500 shadow-md' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-xl transition-all duration-200">
                              {team.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-bold text-gray-900 truncate">
                                {team.name}
                              </p>
                              {canManageTeam(team) && (
                                <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-sm">
                                  Manager
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 truncate mb-2 font-medium">
                              {team.description}
                            </p>
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 715.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <span className="text-xs font-semibold text-teal-700">
                                {team.members?.length || 0} members
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      ))
                    )}
                    {teams && teams.length > 0 && teams.filter(team => isTeamMember(team)).length === 0 && (
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <p className="text-gray-600 font-semibold">No teams available</p>
                        <p className="text-gray-400 text-sm mt-1 mb-4">Join or create a team to get started</p>
                        {(user.role === 'admin' || user.role === 'superadmin') && (
                          <button
                            onClick={() => setCurrentView('create-team')}
                            className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                          >
                            Create your first team
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Team Chat Area - Mobile Responsive */}
                <div className={`${selectedTeam ? 'flex' : 'hidden md:flex'} flex-1 flex-col w-full`}>
                  {selectedTeam ? (
                    <div className="flex flex-col h-full">
                      {/* Team Header - Mobile Responsive */}
                      <div className="flex-shrink-0 p-3 md:p-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                            {/* Back Button - Mobile Only */}
                            <button
                              onClick={() => setSelectedTeam(null)}
                              className="md:hidden p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-medium text-sm md:text-base flex-shrink-0">
                              {selectedTeam.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm md:text-base text-gray-900 truncate">{selectedTeam.name}</p>
                              <p className="text-xs text-gray-500 truncate">{selectedTeam.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                            {canManageTeam(selectedTeam) && (
                              <>
                                <button
                                  onClick={() => {
                                    setTeamToAddMember(selectedTeam);
                                    setShowAddMemberModal(true);
                                  }}
                                  className="hidden sm:block text-blue-600 hover:text-blue-800 text-xs md:text-sm px-2 py-1 hover:bg-blue-50 rounded"
                                >
                                  Add
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingTeam(selectedTeam);
                                    setEditTeamForm({
                                      name: selectedTeam.name,
                                      description: selectedTeam.description,
                                      manager_id: selectedTeam.manager_id
                                    });
                                  }}
                                  className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-200 rounded"
                                  title="Edit Team"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                {(user.role === 'admin' || user.role === 'superadmin') && (
                                  <button
                                    onClick={() => handleDeleteTeam(selectedTeam.id)}
                                    className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded"
                                    title="Delete Team"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Team Members - Mobile Responsive */}
                      <div className="flex-shrink-0 p-3 md:p-4 border-b border-gray-200 bg-gray-25">
                        <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-2">Team Members</h4>
                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                          {getTeamMembers(selectedTeam).map((member) => (
                            member && member.id ? (
                              <div key={member.id} className="flex items-center space-x-1 bg-gray-100 rounded-full px-2 md:px-3 py-1">
                                <span className="text-xs text-gray-700">{member.username || 'Unknown User'}</span>
                                {canManageTeam(selectedTeam) && member.id !== selectedTeam.manager_id && (
                                  <button
                                    onClick={() => handleRemoveTeamMember(selectedTeam.id, member.id)}
                                    className="text-red-500 hover:text-red-700 text-sm ml-1"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ) : null
                          ))}
                          {selectedTeam.manager_username && (
                            <div className="flex items-center space-x-1 bg-purple-100 rounded-full px-2 md:px-3 py-1">
                              <span className="text-xs text-purple-700">{selectedTeam.manager_username} (Manager)</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 flex flex-col p-4 min-h-0">
                        <div className="flex-1 flex flex-col justify-end space-y-4 max-h-full">
                          {/* Load More Button */}
                          {teamMessages.length > 0 && (
                            <div className="flex justify-center">
                              <button
                                onClick={async () => {
                                  try {
                                    setIsLoading(true);
                                    await fetchTeamMessages(selectedTeam.id, true);
                                  } catch (error) {
                                  } finally {
                                    setIsLoading(false);
                                  }
                                }}
                                disabled={isLoading}
                                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 flex items-center space-x-2 transition-colors disabled:opacity-50"
                              >
                                {isLoading ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Loading...
                                  </>
                                ) : (
                                  'Load Older Messages'
                                )}
                              </button>
                            </div>
                          )}
                          
                          {/* Messages List */}
                          {teamMessages.map((msg) => (
                            <div 
                              key={msg.id} 
                              className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                            >
                              <div 
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  msg.sender_id === user.id 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-xs font-medium">
                                    {msg.sender_username}
                                    {msg.sender_role === 'admin' && (
                                      <span className="ml-1 text-xs text-blue-300">• Admin</span>
                                    )}
                                  </span>
                                  <span 
                                    className={`text-xs ${msg.sender_id === user.id ? 'text-green-100' : 'text-gray-500'}`}
                                    title={new Date(msg.created_at).toLocaleString()}
                                  >
                                    {new Date(msg.created_at).toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit',
                                      hour12: true 
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                {msg.media_url && (
                                  <div className="mt-2 rounded-lg overflow-hidden">
                                    <img 
                                      src={`${API_URL}${msg.media_url}`} 
                                      alt="Attached media" 
                                      className="max-w-full max-h-64 w-auto h-auto object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(`${API_URL}${msg.media_url}`, '_blank')}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {teamMessages.length === 0 && !isLoading && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                              <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              <p>No messages yet. Send a message to start the conversation!</p>
                            </div>
                          )}
                          
                          {isLoading && teamMessages.length === 0 && (
                            <div className="flex justify-center">
                              <div className="animate-pulse text-gray-500">Loading messages...</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Enhanced Message Input */}
                      <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
                        <form onSubmit={handleSendTeamMessage} className="space-y-4">
                          <div className="flex items-end space-x-3">
                            <div className="flex-1">
                              <div className="relative">
                                <input
                                  type="text"
                                  required
                                  className="w-full border border-gray-300 rounded-2xl py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm placeholder-gray-500"
                                  placeholder={`Type a message to ${selectedTeam.name}...`}
                                  value={newTeamMessage}
                                  onChange={(e) => setNewTeamMessage(e.target.value)}
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <label className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                <input
                                  type="file"
                                  accept="image/*,document/*"
                                  onChange={(e) => setSelectedFile(e.target.files[0])}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="submit"
                                disabled={isLoading || (!newTeamMessage.trim() && !selectedFile)}
                                className="p-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-full hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                              >
                                {isLoading ? (
                                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                          
                          {selectedFile && (
                            <div className="flex items-center justify-between p-3 bg-teal-50 border border-teal-200 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                                  <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-teal-900">{selectedFile.name}</p>
                                  <p className="text-xs text-teal-600">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedFile(null)}
                                className="p-1 text-teal-400 hover:text-teal-600 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}
                          
                          {isUploading && (
                            <div className="flex items-center space-x-2 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                              <svg className="w-4 h-4 text-teal-600 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span className="text-sm font-medium text-teal-700">Uploading file...</span>
                            </div>
                          )}
                        </form>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-gray-500">Select a team to start chatting</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Create Team View */}
            {currentView === 'create-team' && (user.role === 'admin' || user.role === 'superadmin') && (
              <div className="max-w-2xl">
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Team</h2>
                    <form onSubmit={handleCreateTeam} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                        <input
                          type="text"
                          required
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={teamForm.name}
                          onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          required
                          rows={3}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={teamForm.description}
                          onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Team Manager</label>
                        <select
                          required
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={teamForm.manager_id}
                          onChange={(e) => setTeamForm({ ...teamForm, manager_id: e.target.value })}
                        >
                          <option value="">Select Manager</option>
                          {assignableUsers.map(u => (
                            <option key={u.id} value={u.id}>{u.username}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setCurrentView('teams')}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isLoading ? 'Creating...' : 'Create Team'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* SuperAdmin View */}
            {currentView === 'superadmin' && (
              <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">System Management</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-base font-medium text-gray-900">Reset Client System</h4>
                          <p className="text-sm text-gray-500">Delete all data for a specific client and reset their system</p>
                        </div>
                        <button
                          onClick={() => setShowResetModal(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Reset System
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SuperAdmin View */}
            {currentView === 'superadmin' && (
              <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">System Management</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-base font-medium text-gray-900">Reset Client System</h4>
                          <p className="text-sm text-gray-500">Delete all data for a specific client and reset their system</p>
                        </div>
                        <button
                          onClick={() => setShowResetModal(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Reset System
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users View - Mobile Responsive */}
            {currentView === 'users' && (user.role === 'admin' || user.role === 'superadmin') && (
              <div className="space-y-4 md:space-y-6 w-full max-w-full overflow-x-hidden">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">Users Management</h2>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            downloadFile(`${API_URL}/api/export/users?format=${e.target.value}`, `users.${e.target.value}`);
                            e.target.value = '';
                          }
                        }}
                      className="bg-green-600 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-md text-xs md:text-sm font-medium hover:bg-green-700 transition-colors w-full sm:w-auto sm:min-w-[120px]"
                      >
                        <option value="">Export Users</option>
                        <option value="csv">CSV</option>
                        <option value="excel">Excel</option>
                        <option value="pdf">PDF</option>
                        <option value="json">JSON</option>
                      </select>
                    <button
                      onClick={() => setCurrentView('create-user')}
                      className="bg-blue-600 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-md text-xs md:text-sm font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto sm:min-w-[120px]"
                    >
                      + Create User
                    </button>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow w-full max-w-full overflow-hidden">
                  <div className="p-4 md:p-6">
                    <div className="space-y-3 md:space-y-4">
                      {visibleUsers.map((userData) => (
                        <div key={userData.id} className="border rounded-lg p-3 md:p-4 hover:bg-gray-50">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {editingUser?.id === userData.id ? (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <input
                                    type="text"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    className="text-base md:text-lg font-medium border border-gray-300 rounded px-2 py-1 w-full sm:w-auto"
                                    placeholder="Enter new username"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => updateUsername(userData.id, newUsername)}
                                      className="text-green-600 hover:text-green-900 text-xs md:text-sm font-medium px-3 py-1 border border-green-200 rounded hover:bg-green-50"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingUser(null);
                                        setNewUsername('');
                                      }}
                                      className="text-gray-600 hover:text-gray-900 text-xs md:text-sm font-medium px-3 py-1 border border-gray-200 rounded hover:bg-gray-50"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <h3 className="text-base md:text-lg font-medium text-gray-900 truncate">{userData.username}</h3>
                              )}
                              <p className="text-xs md:text-sm text-gray-600 mt-1 truncate">{userData.email}</p>
                              <div className="flex items-center flex-wrap gap-2 mt-2">
                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                  userData.role === 'superadmin' ? 'bg-red-100 text-red-800' :
                                  userData.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {userData.role}
                                </span>
                                {userData.role === 'superadmin' && user.role !== 'superadmin' && (
                                  <span className="text-xs text-red-600 font-medium">Protected</span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 lg:ml-4">
                              {editingUser?.id !== userData.id && !(userData.role === 'superadmin' && user.role !== 'superadmin') && (
                                <button
                                  onClick={() => {
                                    setEditingUser(userData);
                                    setNewUsername(userData.username);
                                  }}
                                  className="text-purple-600 hover:text-purple-900 text-xs md:text-sm font-medium px-3 py-1.5 border border-purple-200 rounded hover:bg-purple-50 whitespace-nowrap"
                                >
                                  Edit Username
                                </button>
                              )}
                              {!(userData.role === 'superadmin' && user.role !== 'superadmin') && (
                                <button
                                  onClick={() => {
                                    setUserToReset(userData);
                                    setShowPasswordResetModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 text-xs md:text-sm font-medium px-3 py-1.5 border border-blue-200 rounded hover:bg-blue-50 whitespace-nowrap"
                                >
                                  Reset Password
                                </button>
                              )}
                              {userData.role !== 'admin' && userData.role !== 'superadmin' && (
                                <button
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this user?')) {
                                      deleteUser(userData.id);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-900 text-xs md:text-sm font-medium px-3 py-1.5 border border-red-200 rounded hover:bg-red-50 whitespace-nowrap"
                                >
                                  🗑️ Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Create User View - Mobile Responsive */}
            {currentView === 'create-user' && (user.role === 'admin' || user.role === 'superadmin') && (
              <div className="w-full max-w-2xl mx-auto px-4 sm:px-0">
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 md:p-6">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">Create New User</h2>
                    <form onSubmit={handleCreateUser} className="space-y-4 md:space-y-6">
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input
                          type="text"
                          required
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                          value={userForm.username}
                          onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          required
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                          value={userForm.email}
                          onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Password</label>
                        <PasswordInput
                          value={userForm.password}
                          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                          placeholder="Enter password"
                          required={true}
                        />
                      </div>
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                          value={userForm.role}
                          onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          {user.role === 'superadmin' && (
                            <option value="superadmin">SuperAdmin</option>
                          )}
                        </select>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setCurrentView('users')}
                          className="w-full sm:w-auto px-4 py-2 text-xs md:text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full sm:w-auto px-4 py-2 text-xs md:text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isLoading ? 'Creating...' : 'Create User'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics View - Mobile Responsive */}
            {currentView === 'analytics' && (
              <div className="space-y-4 md:space-y-8">
                {/* Role-based Analytics Notice - Mobile Responsive */}
                <div className={`border rounded-lg p-3 md:p-4 ${
                  user.role === 'admin' || user.role === 'superadmin'
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-start md:items-center">
                    <div className="flex-shrink-0 mt-0.5 md:mt-0">
                      {user.role === 'admin' || user.role === 'superadmin' ? (
                        <svg className="w-4 h-4 md:w-5 md:h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd"/>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                        </svg>
                      )}
                    </div>
                    <div className="ml-2 md:ml-3">
                      <p className={`text-xs md:text-sm ${
                        user.role === 'admin' || user.role === 'superadmin' 
                          ? 'text-green-700' 
                          : 'text-blue-700'
                      }`}>
                        {user.role === 'admin' || user.role === 'superadmin' ? (
                          <>
                            <span className="font-medium">Admin Analytics:</span> Viewing all organizational data and agent performance metrics.
                          </>
                        ) : (
                          <>
                            <span className="font-medium">Personal Analytics:</span> Viewing only tickets and data related to your work.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Date Range Selector - Mobile Responsive */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-white p-3 md:p-4 rounded-lg shadow">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs md:text-sm font-semibold whitespace-nowrap">From:</span>
                    <DatePicker
                      selected={analyticsFrom}
                      onChange={date => setAnalyticsFrom(date)}
                      selectsStart
                      startDate={analyticsFrom}
                      endDate={analyticsTo}
                      maxDate={analyticsTo || new Date()}
                      className="border rounded px-2 py-1 text-xs md:text-sm w-full"
                      dateFormat="yyyy-MM-dd"
                      isClearable
                      placeholderText="Start date"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs md:text-sm font-semibold whitespace-nowrap">To:</span>
                    <DatePicker
                      selected={analyticsTo}
                      onChange={date => setAnalyticsTo(date)}
                      selectsEnd
                      startDate={analyticsFrom}
                      endDate={analyticsTo}
                      minDate={analyticsFrom}
                      maxDate={new Date()}
                      className="border rounded px-2 py-1 text-xs md:text-sm w-full"
                      dateFormat="yyyy-MM-dd"
                      isClearable
                      placeholderText="End date"
                    />
                  </div>
                </div>
                {currentView === 'analytics' && (
                  <div className="mb-4">
                    {(() => {
                      const [start, end] = [analyticsFrom, analyticsTo];
                      const now = new Date();
                      if ((start && start > now) || (end && end > now) || (start && end && start > end)) {
                        return (
                          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
                            Invalid or future date range selected. Please select a valid date range.
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
                {analyticsLoading ? (
                  <div className="flex items-center justify-center py-8 md:py-12">
                    <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-sm md:text-base">Loading analytics...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Ticket Status Pie Chart - Mobile Responsive */}
                    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
                      <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-800">
                        {user.role === 'admin' || user.role === 'superadmin' ? 'Ticket Status (All)' : 'My Ticket Status'}
                      </h3>
                      <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
                        <PieChart>
                          <Pie
                            data={Array.isArray(analyticsData.ticketStatus?.labels) && Array.isArray(analyticsData.ticketStatus?.values)
                              ? analyticsData.ticketStatus.labels
                                  .map((label, i) => ({ name: label, value: analyticsData.ticketStatus.values[i] }))
                                  .filter(d => d.name === 'open' || d.name === 'closed')
                              : []}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={isMobile ? 70 : 90}
                            fill="#8884d8"
                            stroke="#fff"
                            strokeWidth={2}
                            label={!isMobile}
                          >
                            {(analyticsData.ticketStatus?.labels || []).filter(l => l === 'open' || l === 'closed').map((label, i) => (
                              <Cell key={i} fill={label === 'closed' ? '#ff7f7f' : '#8884d8'} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: isMobile ? '11px' : '14px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Ticket Trends Line Chart - Mobile Responsive */}
                    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
                      <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-800">
                        {user.role === 'admin' || user.role === 'superadmin' ? 'Ticket Trends (Organization)' : 'My Ticket Trends'}
                      </h3>
                      <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
                        <LineChart data={Array.isArray(analyticsData.ticketTrends?.labels) ? analyticsData.ticketTrends.labels.map((label, i) => ({
                          date: label,
                          created: analyticsData.ticketTrends.created[i],
                          resolved: analyticsData.ticketTrends.resolved[i]
                        })) : []}>
                          <XAxis dataKey="date" tick={{ fontSize: isMobile ? 10 : 12 }} />
                          <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: isMobile ? '11px' : '14px' }} />
                          <Line
                            type="monotone"
                            dataKey="created"
                            stroke="#8884d8"
                            strokeWidth={isMobile ? 2 : 3}
                            dot={{ r: isMobile ? 3 : 4, fill: '#8884d8' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="resolved"
                            stroke="#82ca9d"
                            strokeWidth={isMobile ? 2 : 3}
                            dot={{ r: isMobile ? 3 : 4, fill: '#82ca9d' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Agent Performance Bar Chart - Admin Only - Mobile Responsive */}
                    {(user.role === 'admin' || user.role === 'superadmin') && (
                      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
                        <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-800">Agent Performance</h3>
                        <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
                          <BarChart data={Array.isArray(analyticsData.agentPerf?.labels)
                            ? analyticsData.agentPerf.labels.map((label, i) => ({
                                name: label,
                                resolved: analyticsData.agentPerf.resolved[i],
                                assigned: analyticsData.agentPerf.assigned[i]
                              }))
                            : []}>
                            <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 12 }} />
                            <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: isMobile ? '11px' : '14px' }} />
                            <Bar dataKey="resolved" fill="#8884d8" name="resolved" />
                            <Bar dataKey="assigned" fill="#ffc658" name="assigned" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {/* Ticket Volume by Priority Bar Chart - Role-based - Mobile Responsive */}
                    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
                      <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-800">
                        {user.role === 'admin' || user.role === 'superadmin' 
                          ? 'Ticket Volume by Priority (All)' 
                          : 'My Tickets by Priority'}
                      </h3>
                      <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
                        <BarChart data={Array.isArray(priorityVolume) ? priorityVolume : []}>
                          <XAxis dataKey="date" tick={{ fontSize: isMobile ? 10 : 12 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: isMobile ? 10 : 12 }} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: isMobile ? '11px' : '14px' }} />
                          <Bar dataKey="high" stackId="a" fill="#e53e3e" name="High" />
                          <Bar dataKey="medium" stackId="a" fill="#ecc94b" name="Medium" />
                          <Bar dataKey="low" stackId="a" fill="#38a169" name="Low" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* IT Infrastructure Health View */}
            {currentView === 'infrastructure' && (
              <ITInfrastructureHealthAdvanced token={token} user={user} />
            )}

            {/* Reports View - Mobile Responsive */}
            {currentView === 'reports' && (
              <div className="space-y-4 md:space-y-8">
                {/* Date Range Selector and Controls - Mobile Responsive */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 bg-white p-3 md:p-4 rounded-lg shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs md:text-sm font-semibold whitespace-nowrap">From:</span>
                      <DatePicker
                        selected={reportsFrom}
                        onChange={date => setReportsFrom(date)}
                        selectsStart
                        startDate={reportsFrom}
                        endDate={reportsTo}
                        maxDate={reportsTo || new Date()}
                        className="border rounded px-2 py-1 text-xs md:text-sm w-full"
                        dateFormat="yyyy-MM-dd"
                        isClearable
                        placeholderText="Start date"
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs md:text-sm font-semibold whitespace-nowrap">To:</span>
                      <DatePicker
                        selected={reportsTo}
                        onChange={date => setReportsTo(date)}
                        selectsEnd
                        startDate={reportsFrom}
                        endDate={reportsTo}
                        minDate={reportsFrom}
                        maxDate={new Date()}
                        className="border rounded px-2 py-1 text-xs md:text-sm w-full"
                        dateFormat="yyyy-MM-dd"
                        isClearable
                        placeholderText="End date"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => fetchReportsData(
                        reportsFrom instanceof Date ? reportsFrom.toISOString().slice(0, 10) : undefined,
                        reportsTo instanceof Date ? reportsTo.toISOString().slice(0, 10) : undefined
                      )}
                      className="px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs md:text-sm font-medium"
                    >
                      Refresh
                    </button>
                    <label className="flex items-center gap-2 text-xs md:text-sm">
                      <input
                        type="checkbox"
                        checked={autoRefresh}
                        onChange={(e) => setAutoRefresh(e.target.checked)}
                        className="rounded"
                      />
                      <span className="whitespace-nowrap">Auto-refresh (30s)</span>
                    </label>
                  </div>
                </div>

                {/* Report Type Selector - Mobile Responsive */}
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const adminReports = [
                      { id: 'overview', name: 'Overview', icon: 'chart' },
                      { id: 'daily', name: 'Daily Reports', icon: 'calendar' },
                      { id: 'assets', name: 'Asset Reports', icon: 'laptop' },
                      { id: 'performance', name: 'Agent Performance', icon: 'users' }
                    ];
                    
                    const userReports = [
                      { id: 'daily', name: 'Daily Reports', icon: 'calendar' }
                    ];
                    
                    const reports = user.role === 'admin' || user.role === 'superadmin' ? adminReports : userReports;
                    
                    return reports.map(report => (
                      <button
                        key={report.id}
                        onClick={() => setSelectedReport(report.id)}
                        className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-lg transition-colors text-xs md:text-sm font-medium ${
                          selectedReport === report.id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <IconComponent icon={report.icon} className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="whitespace-nowrap">{report.name}</span>
                      </button>
                    ));
                  })()}
                </div>

                {reportsLoading ? (
                  <div className="flex items-center justify-center py-8 md:py-12">
                    <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-green-600"></div>
                    <span className="ml-3 text-sm md:text-lg">Loading reports...</span>
                  </div>
                ) : (
                  <div>
                    {/* Summary Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-gray-50 rounded-xl p-6 mb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Reports Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="font-medium text-gray-700">Date Range</div>
                          <div className="text-gray-500">
                            {reportsFrom ? reportsFrom.toLocaleDateString() : 'All time'} - {reportsTo ? reportsTo.toLocaleDateString() : 'Today'}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="font-medium text-gray-700">Total Tickets</div>
                          <div className="text-gray-500">
                            {(reportsData.ticketStatus?.values?.reduce((a, b) => a + b, 0) || 0).toLocaleString()}
                          </div>
                        </div>
                        {user.role === 'admin' || user.role === 'superadmin' ? (
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="font-medium text-gray-700">Active Agents</div>
                            <div className="text-gray-500">
                              {reportsData.agentPerformance?.labels?.length || 0}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="font-medium text-gray-700">My Tickets</div>
                            <div className="text-gray-500">
                              {tickets.filter(t => t.created_by === user.id).length}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Overview Report */}
                    {selectedReport === 'overview' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Key Metrics Cards */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-100">Total Tickets</p>
                              <p className="text-3xl font-bold">
                                {(reportsData.ticketStatus?.values?.reduce((a, b) => a + b, 0) || 0).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-4xl">📋</div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-orange-100">Active Agents</p>
                              <p className="text-3xl font-bold">
                                {reportsData.agentPerformance?.labels?.length || 0}
                              </p>
                            </div>
                            <div className="text-4xl">👤</div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-red-100">High Priority</p>
                              <p className="text-3xl font-bold">
                                {reportsData.ticketStatus?.values?.[reportsData.ticketStatus?.labels?.indexOf('high')] || 0}
                              </p>
                            </div>
                            <div className="text-4xl">⚠</div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-indigo-100">Total Assets</p>
                              <p className="text-3xl font-bold">
                                {reportsData.assetDistribution?.by_type?.values?.reduce((a, b) => a + b, 0) || 0}
                              </p>
                            </div>
                            <div className="text-4xl">💻</div>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* Daily Reports - Mobile Responsive */}
                    {selectedReport === 'daily' && (
                      <div className="space-y-4 md:space-y-8">
                        {/* Role-based Header - Mobile Responsive */}
                        <div className={`rounded-lg md:rounded-xl p-4 md:p-6 ${
                          user.role === 'admin' || user.role === 'superadmin'
                            ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200'
                            : 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200'
                        }`}>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <h2 className="text-lg md:text-2xl font-bold text-gray-800">
                                {user.role === 'admin' || user.role === 'superadmin' 
                                  ? 'Organization Daily Reports' 
                                  : 'My Daily Reports'}
                              </h2>
                              <p className="text-xs md:text-sm text-gray-600 mt-1">
                                {user.role === 'admin' || user.role === 'superadmin'
                                  ? 'Complete daily activity overview for all team members'
                                  : 'Your personal daily work summary and progress'}
                              </p>
                            </div>
                            <div className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium self-start sm:self-auto ${
                              user.role === 'admin' || user.role === 'superadmin'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role === 'admin' || user.role === 'superadmin' ? 'Admin View' : 'Personal View'}
                            </div>
                          </div>
                        </div>

                        {/* Key Metrics Cards - Mobile Responsive */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                          <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6 border-l-4 border-blue-500">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs md:text-sm font-medium text-gray-600 truncate">
                                  {user.role === 'admin' || user.role === 'superadmin' ? 'Total Created' : 'My Created'}
                                </p>
                                <p className="text-2xl md:text-3xl font-bold text-blue-600">
                                  {Array.isArray(reportsData.ticketTrends) 
                                    ? reportsData.ticketTrends.reduce((sum, day) => sum + (day.open || 0) + (day.in_progress || 0) + (day.closed || 0), 0)
                                    : 0}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Tickets created</p>
                              </div>
                              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 md:w-8 md:h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/></svg>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6 border-l-4 border-green-500">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs md:text-sm font-medium text-gray-600 truncate">
                                  {user.role === 'admin' || user.role === 'superadmin' ? 'Total Resolved' : 'My Resolved'}
                                </p>
                                <p className="text-2xl md:text-3xl font-bold text-green-600">
                                  {Array.isArray(reportsData.ticketTrends) 
                                    ? reportsData.ticketTrends.reduce((sum, day) => sum + (day.closed || 0), 0)
                                    : 0}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Tickets resolved</p>
                              </div>
                              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 md:w-8 md:h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6 border-l-4 border-orange-500">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs md:text-sm font-medium text-gray-600 truncate">
                                  {user.role === 'admin' || user.role === 'superadmin' ? 'Total Open' : 'My Open'}
                                </p>
                                <p className="text-2xl md:text-3xl font-bold text-orange-600">
                                  {Array.isArray(reportsData.ticketTrends) 
                                    ? reportsData.ticketTrends.reduce((sum, day) => sum + (day.open || 0), 0)
                                    : 0}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Tickets pending</p>
                              </div>
                              <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-xl md:text-2xl">⏳</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6 border-l-4 border-purple-500">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs md:text-sm font-medium text-gray-600 truncate">Resolution Rate</p>
                                <p className="text-2xl md:text-3xl font-bold text-purple-600">
                                  {(() => {
                                    const total = Array.isArray(reportsData.ticketTrends) 
                                      ? reportsData.ticketTrends.reduce((sum, day) => sum + (day.open || 0) + (day.in_progress || 0) + (day.closed || 0), 0)
                                      : 0;
                                    const resolved = Array.isArray(reportsData.ticketTrends) 
                                      ? reportsData.ticketTrends.reduce((sum, day) => sum + (day.closed || 0), 0)
                                      : 0;
                                    return total > 0 ? Math.round((resolved / total) * 100) : 0;
                                  })()}%
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Success rate</p>
                              </div>
                              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 md:w-8 md:h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24"><path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/></svg>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Daily Trends Chart - Mobile Responsive */}
                        <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
                            <h3 className="text-base md:text-xl font-semibold text-gray-800">
                              {user.role === 'admin' || user.role === 'superadmin' 
                                ? 'Organization Daily Activity Trends' 
                                : 'My Daily Activity Trends'}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 md:w-3 md:h-3 bg-blue-500 rounded-full"></span>
                                <span>Created</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full"></span>
                                <span>Resolved</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 md:w-3 md:h-3 bg-orange-500 rounded-full"></span>
                                <span>Open</span>
                              </div>
                            </div>
                          </div>
                          <ResponsiveContainer width="100%" height={isMobile ? 250 : 400}>
                            <LineChart data={Array.isArray(reportsData.ticketTrends) ? reportsData.ticketTrends : []}>
                              <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: isMobile ? 10 : 12 }}
                                tickFormatter={(value) => new Date(value).toLocaleDateString()}
                              />
                              <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                              <Tooltip 
                                labelFormatter={(value) => `Date: ${new Date(value).toLocaleDateString()}`}
                                formatter={(value, name) => [value, name]}
                              />
                              <Legend wrapperStyle={{ fontSize: isMobile ? '11px' : '14px' }} />
                              <Line 
                                type="monotone" 
                                dataKey="open" 
                                stroke="#f97316" 
                                strokeWidth={isMobile ? 2 : 3}
                                name="Open Tickets"
                                dot={{ fill: '#f97316', strokeWidth: 2, r: isMobile ? 3 : 4 }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="closed" 
                                stroke="#10b981" 
                                strokeWidth={isMobile ? 2 : 3}
                                name="Resolved Tickets"
                                dot={{ fill: '#10b981', strokeWidth: 2, r: isMobile ? 3 : 4 }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="in_progress" 
                                stroke="#3b82f6" 
                                strokeWidth={isMobile ? 2 : 3}
                                name="In Progress"
                                dot={{ fill: '#3b82f6', strokeWidth: 2, r: isMobile ? 3 : 4 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Daily Activity Table - Mobile Responsive */}
                        <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6">
                          <h3 className="text-base md:text-xl font-semibold text-gray-800 mb-4 md:mb-6">
                            {user.role === 'admin' || user.role === 'superadmin' 
                              ? 'Daily Activity Breakdown (All Users)' 
                              : 'My Daily Activity Breakdown'}
                          </h3>
                          
                          {/* Mobile Card View */}
                          <div className="block md:hidden space-y-3">
                            {Array.isArray(reportsData.ticketTrends) && reportsData.ticketTrends.map((day, index) => {
                              const total = (day.open || 0) + (day.in_progress || 0) + (day.closed || 0);
                              const resolutionRate = total > 0 ? Math.round(((day.closed || 0) / total) * 100) : 0;
                              
                              return (
                                <div key={index} className="border rounded-lg p-3 bg-gray-50">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-semibold text-gray-900">
                                      {new Date(day.date).toLocaleDateString()}
                                    </span>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      resolutionRate >= 80 ? 'bg-green-100 text-green-800' :
                                      resolutionRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {resolutionRate}%
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Open:</span>
                                      <span className="text-orange-600 font-semibold">{day.open || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">In Progress:</span>
                                      <span className="text-blue-600 font-semibold">{day.in_progress || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Resolved:</span>
                                      <span className="text-green-600 font-semibold">{day.closed || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Total:</span>
                                      <span className="text-gray-900 font-semibold">{total}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Desktop Table View */}
                          <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Open</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">In Progress</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resolved</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Activity</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resolution %</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {Array.isArray(reportsData.ticketTrends) && reportsData.ticketTrends.map((day, index) => {
                                  const total = (day.open || 0) + (day.in_progress || 0) + (day.closed || 0);
                                  const resolutionRate = total > 0 ? Math.round(((day.closed || 0) / total) * 100) : 0;
                                  
                                  return (
                                    <tr key={index} className="hover:bg-gray-50">
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {new Date(day.date).toLocaleDateString()}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-semibold">
                                        {day.open || 0}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                                        {day.in_progress || 0}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                                        {day.closed || 0}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                        {total}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                          resolutionRate >= 80 ? 'bg-green-100 text-green-800' :
                                          resolutionRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-red-100 text-red-800'
                                        }`}>
                                          {resolutionRate}%
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Export and Actions - Mobile Responsive */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                          {/* Export Section */}
                          <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6">
                            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">📥 Export Daily Reports</h3>
                            <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                              {user.role === 'admin' || user.role === 'superadmin'
                                ? 'Export comprehensive daily reports for all team members'
                                : 'Export your personal daily activity reports'}
                            </p>
                            <div className="grid grid-cols-2 gap-2 md:gap-3">
                              {['csv', 'excel', 'pdf', 'json'].map(format => (
                                <button
                                  key={format}
                                  onClick={() => {
                                    const params = new URLSearchParams();
                                    if (reportsFrom) params.append('start', reportsFrom.toISOString().slice(0, 10));
                                    if (reportsTo) params.append('end', reportsTo.toISOString().slice(0, 10));
                                    downloadFile(`${API_URL}/api/export/daily-reports?format=${format}&${params}`, `daily_report_${format}`);
                                  }}
                                  className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                  <span className="mr-2">
                                    {format === 'csv' ? '[CSV]' : format === 'excel' ? '[XLS]' : format === 'pdf' ? '[PDF]' : '[*]'}
                                  </span>
                                  {format.toUpperCase()}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">⚡ Quick Actions</h3>
                            <div className="space-y-3">
                              <button
                                onClick={() => fetchReportsData(
                                  reportsFrom instanceof Date ? reportsFrom.toISOString().slice(0, 10) : undefined,
                                  reportsTo instanceof Date ? reportsTo.toISOString().slice(0, 10) : undefined
                                )}
                                className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                              >
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M1 4v6h6M23 20v-6h-6M20.3 5.7A9 9 0 0 0 5.1 19.3M3.7 18.3A9 9 0 0 1 18.9 4.7"/></svg>
                                Refresh Data
                              </button>
                              
                              {user.role === 'admin' || user.role === 'superadmin' ? (
                                <button
                                  onClick={() => setSelectedReport('performance')}
                                  className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm8 0c1.66 0 2.99-1.34 2.99-3S25.66 5 24 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.89 1.97 1.74 1.97 2.95V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                                  View Agent Performance
                                </button>
                              ) : (
                                <button
                                  onClick={() => setCurrentView('tickets')}
                                  className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-2.16-2.66c-.44-.53-1.25-.58-1.78-.15-.53.44-.58 1.25-.15 1.78l3 3.67c.25.31.61.5 1.02.5.4 0 .77-.19 1.02-.5l4-5.15c.44-.53.39-1.34-.15-1.78-.53-.44-1.34-.39-1.78.15z"/></svg>
                                  View My Tickets
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Agent Performance Report */}
                    {selectedReport === 'performance' && (
                      <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-lg p-6">
                          <h3 className="text-xl font-semibold mb-4">Agent Performance Metrics</h3>
                          <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={Array.isArray(reportsData.agentPerformance?.labels)
                              ? reportsData.agentPerformance.labels.map((label, i) => ({
                                  name: label,
                                  resolved: reportsData.agentPerformance.resolved[i],
                                  assigned: reportsData.agentPerformance.assigned[i]
                                }))
                              : []}>
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="resolved" fill="#10b981" name="Resolved" />
                              <Bar dataKey="assigned" fill="#3b82f6" name="Assigned" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Asset Reports */}
                    {selectedReport === 'assets' && (
                      <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-lg p-6">
                          <h3 className="text-xl font-semibold mb-4">Asset Distribution by Type</h3>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Pie Chart */}
                            <div>
                              <ResponsiveContainer width="100%" height={400}>
                                <PieChart>
                                  <Pie
                                    data={Array.isArray(reportsData.assetDistribution?.by_type?.labels) ? 
                                      reportsData.assetDistribution.by_type.labels.map((label, i) => ({
                                        name: label,
                                        value: reportsData.assetDistribution.by_type.values[i]
                                      })) : []}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={120}
                                    fill="#8884d8"
                                    label
                                  >
                                    {Array.isArray(reportsData.assetDistribution?.by_type?.labels) ? 
                                      reportsData.assetDistribution.by_type.labels.map((_, i) => (
                                        <Cell key={i} fill={['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000', '#8b5cf6', '#06b6d4'][i % 7]} />
                                      )) : []}
                                  </Pie>
                                  <Tooltip />
                                  <Legend />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            
                            {/* Information Box */}
                            <div className="bg-gray-50 rounded-lg p-6">
                              <h4 className="text-lg font-semibold text-gray-800 mb-4">Asset Distribution Details</h4>
                              <div className="space-y-3">
                                {Array.isArray(reportsData.assetDistribution?.by_type?.labels) ? 
                                  reportsData.assetDistribution.by_type.labels.map((label, i) => {
                                    const value = reportsData.assetDistribution.by_type.values[i];
                                    const total = reportsData.assetDistribution.by_type.values.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return (
                                      <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                                        <div className="flex items-center space-x-3">
                                          <div 
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000', '#8b5cf6', '#06b6d4'][i % 7] }}
                                          ></div>
                                          <span className="font-medium text-gray-700 capitalize">{label}</span>
                                        </div>
                                        <div className="text-right">
                                          <div className="font-bold text-gray-900">{value}</div>
                                          <div className="text-sm text-gray-500">{percentage}%</div>
                                        </div>
                                      </div>
                                    );
                                  }) : (
                                    <div className="text-center text-gray-500 py-8">
                                      No asset data available
                                    </div>
                                  )}
                              </div>
                              
                              {/* Summary */}
                              {Array.isArray(reportsData.assetDistribution?.by_type?.labels) && reportsData.assetDistribution.by_type.labels.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-gray-200">
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-800">Total Assets:</span>
                                    <span className="font-bold text-blue-600 text-lg">
                                      {reportsData.assetDistribution.by_type.values.reduce((a, b) => a + b, 0)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center mt-2">
                                    <span className="font-semibold text-gray-800">Asset Types:</span>
                                    <span className="font-bold text-green-600 text-lg">
                                      {reportsData.assetDistribution.by_type.labels.length}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Removed duplicate Export Section */}
                  </div>
                )}
              </div>
            )}

            {/* Manage Groups View (Admin only) */}
            {currentView === 'manage-groups' && (user.role === 'admin' || user.role === 'superadmin') && (
              <div className="w-full max-w-full overflow-x-hidden">
                <div className="space-y-4 md:space-y-6">
                  <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center">
                    <svg className="w-5 h-5 md:w-6 md:h-6 mr-2 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="truncate">Manage All Groups</span>
                  </h2>
                  <div className="bg-white rounded-lg shadow p-4 md:p-6 w-full max-w-full overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                      <h3 className="text-base md:text-lg font-semibold">All Teams</h3>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="bg-green-600 text-white px-3 md:px-4 py-2 rounded hover:bg-green-700 text-sm md:text-base"
                          onClick={() => setCurrentView('teams')}
                        >
                          Create Team
                        </button>
                        <button
                          className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded hover:bg-blue-700 text-sm md:text-base"
                          onClick={() => setCurrentView('teams')}
                        >
                          Back to Teams
                        </button>
                      </div>
                    </div>
                    
                    {/* Mobile Card View */}
                    <div className="block md:hidden space-y-3 w-full">
                      {teams.length > 0 ? (
                        teams.map(team => (
                          <div key={team.id} className="border rounded-lg p-3 bg-gray-50">
                            <div className="mb-2">
                              <p className="font-semibold text-gray-900">{team.name}</p>
                              <p className="text-xs text-gray-600 mt-1">{team.description}</p>
                            </div>
                            <div className="space-y-2 text-xs mb-3">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Manager:</span>
                                <span className="font-medium text-gray-900">{team.manager_username}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Members:</span>
                                {team.members && team.members.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {team.members.map(m => (
                                      <span key={m.id} className="bg-gray-200 px-2 py-0.5 rounded text-xs">{m.username || m.id}</span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-400 text-xs mt-1">No members</p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button 
                                className="text-blue-600 hover:underline text-xs" 
                                onClick={() => { 
                                  setEditingTeam(team); 
                                  setEditTeamForm({ 
                                    name: team.name, 
                                    description: team.description, 
                                    manager_id: (user.role === 'admin' || user.role === 'superadmin') ? team.manager_id : '' 
                                  }); 
                                }}
                              >
                                Edit
                              </button>
                              <button 
                                className="text-red-600 hover:underline text-xs" 
                                onClick={() => handleDeleteTeam(team.id)}
                              >
                                🗑️ Delete
                              </button>
                              <button 
                                className="text-green-600 hover:underline text-xs" 
                                onClick={() => { setTeamToAddMember(team); setShowAddMemberModal(true); }}
                              >
                                Add Member
                              </button>
                              {team.members && team.members.length > 0 && (
                                <button 
                                  className="text-yellow-600 hover:underline text-xs" 
                                  onClick={() => { setSelectedTeam(team); }}
                                >
                                  ➖ Remove Member
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center py-8 text-center text-gray-500">
                          <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <p className="text-base font-medium">No teams found</p>
                          <p className="text-sm">Create your first team to get started</p>
                          <button
                            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                            onClick={() => setCurrentView('teams')}
                          >
                            Create Team
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block w-full overflow-x-auto">
                      <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Team Name</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Manager</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teams.length > 0 ? (
                              teams.map(team => (
                                <tr key={team.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 font-semibold">{team.name}</td>
                                  <td className="px-4 py-2">{team.description}</td>
                                  <td className="px-4 py-2">{team.manager_username}</td>
                                  <td className="px-4 py-2">
                                    {team.members && team.members.length > 0 ? (
                                      <div className="flex flex-wrap gap-2">
                                        {team.members.map(m => (
                                          <span key={m.id} className="bg-gray-200 px-2 py-1 rounded text-xs">{m.username || m.id}</span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 text-xs">No members</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 space-x-2">
                                    <button className="text-blue-600 hover:underline" onClick={() => { 
                                    setEditingTeam(team); 
                                    setEditTeamForm({ 
                                      name: team.name, 
                                      description: team.description, 
                                      manager_id: (user.role === 'admin' || user.role === 'superadmin') ? team.manager_id : '' 
                                    }); 
                                  }}>
                                      Edit
                                    </button>
                                    <button className="text-red-600 hover:underline" onClick={() => handleDeleteTeam(team.id)}>
                                      Delete
                                    </button>
                                    <button className="text-green-600 hover:underline" onClick={() => { setTeamToAddMember(team); setShowAddMemberModal(true); }}>
                                      Add Member
                                    </button>
                                    {team.members && team.members.length > 0 && (
                                      <button className="text-yellow-600 hover:underline" onClick={() => { setSelectedTeam(team); }}>
                                        Remove Member
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                  <div className="flex flex-col items-center">
                                    <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <p className="text-lg font-medium">No teams found</p>
                                    <p className="text-sm">Create your first team to get started</p>
                                    <button
                                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                      onClick={() => setCurrentView('teams')}
                                    >
                                      Create Team
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Ticket Edit Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Ticket</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={selectedTicket.status}
                    onChange={(e) => setSelectedTicket({ ...selectedTicket, status: e.target.value })}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={selectedTicket.priority}
                    onChange={(e) => setSelectedTicket({ ...selectedTicket, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign to</label>
                  <select
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={selectedTicket.assigned_to || ''}
                    onChange={(e) => setSelectedTicket({ ...selectedTicket, assigned_to: e.target.value || null })}
                  >
                    <option value="">Unassigned</option>
                    {assignableUsers.map(user => (
                      <option key={user.id} value={user.id}>{user.username}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateTicket(selectedTicket.id, {
                      status: selectedTicket.status,
                      priority: selectedTicket.priority,
                      assigned_to: selectedTicket.assigned_to
                    })}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Ticket Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Close Ticket</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to close this ticket: <span className="font-medium">{ticketToClose?.title}</span>?
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Close Comment</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Please provide a reason for closing this ticket..."
                    value={closeComment}
                    onChange={(e) => setCloseComment(e.target.value)}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowCloseModal(false);
                      setCloseComment('');
                      setTicketToClose(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCloseTicket}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Closing...' : 'Close Ticket'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordResetModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reset Password</h3>
              <p className="text-sm text-gray-600 mb-4">
                Reset password for user: <span className="font-medium">{userToReset?.username}</span>
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <PasswordInput
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password..."
                    required={true}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowPasswordResetModal(false);
                      setNewPassword('');
                      setUserToReset(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordReset}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Edit Team Modal */}
      {editingTeam && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Team</h3>
              <form onSubmit={handleEditTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={editTeamForm.name}
                    onChange={(e) => setEditTeamForm({ ...editTeamForm, name: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    required
                    rows={3}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={editTeamForm.description}
                    onChange={(e) => setEditTeamForm({ ...editTeamForm, description: e.target.value })}
                  />
                </div>
                
                {/* Only show manager field for admins */}
                {(user.role === 'admin' || user.role === 'superadmin') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Team Manager</label>
                    <select
                      required
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={editTeamForm.manager_id}
                      onChange={(e) => setEditTeamForm({ ...editTeamForm, manager_id: e.target.value })}
                    >
                      <option value="">Select Manager</option>
                      {assignableUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.username}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTeam(null);
                      setEditTeamForm({ name: '', description: '', manager_id: '' });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Updating...' : 'Update Team'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Team Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Team Member</h3>
              <p className="text-sm text-gray-600 mb-4">
                Add a member to: <span className="font-medium">{teamToAddMember?.name}</span>
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
                  <select
                    required
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={memberToAdd}
                    onChange={(e) => setMemberToAdd(e.target.value)}
                  >
                    <option value="">Select User</option>
                    {assignableUsers
                      .filter(u => !teamToAddMember?.members?.includes(u.id))
                      .map(u => (
                        <option key={u.id} value={u.id}>{u.username}</option>
                      ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowAddMemberModal(false);
                      setMemberToAdd('');
                      setTeamToAddMember(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTeamMember}
                    disabled={isLoading || !memberToAdd}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {editingAsset && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Asset</h3>
              <form onSubmit={handleEditAsset} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name</label>
                    <input
                      type="text"
                      required
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={editAssetForm.name}
                      onChange={(e) => setEditAssetForm({ ...editAssetForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
                    <select
                      required
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={editAssetForm.asset_type}
                      onChange={(e) => setEditAssetForm({ ...editAssetForm, asset_type: e.target.value })}
                    >
                      <option value="">Select Type</option>
                      <option value="laptop">Laptop</option>
                      <option value="desktop">Desktop</option>
                      <option value="mobile">Mobile</option>
                      <option value="monitor">Monitor</option>
                      <option value="printer">Printer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    required
                    rows={3}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={editAssetForm.description}
                    onChange={(e) => setEditAssetForm({ ...editAssetForm, description: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Value (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={editAssetForm.value}
                      onChange={(e) => setEditAssetForm({ ...editAssetForm, value: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={editAssetForm.serial_number}
                      onChange={(e) => setEditAssetForm({ ...editAssetForm, serial_number: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign to User</label>
                  <select
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={editAssetForm.assigned_to}
                    onChange={(e) => setEditAssetForm({ ...editAssetForm, assigned_to: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {assignableUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.username}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Update Photo (Optional)</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="px-3 py-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {selectedFile && (
                    <p className="text-sm text-gray-500 mt-1">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                  {isUploading && (
                    <p className="text-sm text-blue-600 mt-1">Uploading...</p>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAsset(null);
                      setEditAssetForm({
                        name: '',
                        description: '',
                        asset_type: '',
                        value: 0,
                        serial_number: '',
                        assigned_to: ''
                      });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Updating...' : 'Update Asset'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {showTicketDetailModal && selectedTicketDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl"
              onClick={() => setShowTicketDetailModal(false)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-2">Ticket Details</h2>
            <div className="space-y-2">
              <div><span className="font-semibold">Title:</span> {selectedTicketDetail.title}</div>
              <div><span className="font-semibold">Description:</span> {selectedTicketDetail.description}</div>
              <div><span className="font-semibold">Status:</span> {selectedTicketDetail.status}</div>
              <div><span className="font-semibold">Priority:</span> {selectedTicketDetail.priority}</div>
              <div><span className="font-semibold">Created by:</span> {selectedTicketDetail.created_by_username}</div>
              {selectedTicketDetail.assigned_to_username && (
                <div><span className="font-semibold">Assigned to:</span> {selectedTicketDetail.assigned_to_username}</div>
              )}
              <div><span className="font-semibold">Created at:</span> {new Date(selectedTicketDetail.created_at).toLocaleString()}</div>
              {selectedTicketDetail.closed_by_username && (
                <div><span className="font-semibold">Closed by:</span> {selectedTicketDetail.closed_by_username}</div>
              )}
              {selectedTicketDetail.closed_at && (
                <div><span className="font-semibold">Closed at:</span> {new Date(selectedTicketDetail.closed_at).toLocaleString()}</div>
              )}
              {selectedTicketDetail.close_comment && (
                <div><span className="font-semibold">Close Comment:</span> {selectedTicketDetail.close_comment}</div>
              )}
              {selectedTicketDetail.media_url && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="font-semibold text-gray-700 mb-3">Attached Media:</div>
                  <img
                    src={`${API_URL}${selectedTicketDetail.media_url}`}
                    alt="Ticket media"
                    className="max-w-full h-auto rounded-lg mb-3 shadow-sm"
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={() => window.open(`${API_URL}${selectedTicketDetail.media_url}`, '_blank')}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                    >
                      View Full Size
                    </button>
                    <button
                      onClick={() => downloadMedia(selectedTicketDetail.media_url, `ticket-${selectedTicketDetail.id}-media`)}
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
                    >
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Asset Detail Modal */}
      {showAssetDetailModal && selectedAssetDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl"
              onClick={() => setShowAssetDetailModal(false)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-2">Asset Details</h2>
            <div className="space-y-2">
              <div><span className="font-semibold">Name:</span> {selectedAssetDetail.name}</div>
              <div><span className="font-semibold">Description:</span> {selectedAssetDetail.description}</div>
              <div><span className="font-semibold">Type:</span> {selectedAssetDetail.asset_type}</div>
              <div><span className="font-semibold">Value:</span> ₹{selectedAssetDetail.value}</div>
              {selectedAssetDetail.serial_number && (
                <div><span className="font-semibold">Serial Number:</span> {selectedAssetDetail.serial_number}</div>
              )}
              <div><span className="font-semibold">Created by:</span> {selectedAssetDetail.created_by_username}</div>
              <div><span className="font-semibold">Created at:</span> {new Date(selectedAssetDetail.created_at).toLocaleString()}</div>
              {selectedAssetDetail.assigned_to_username && (
                <div><span className="font-semibold">Assigned to:</span> {selectedAssetDetail.assigned_to_username}</div>
              )}
              {selectedAssetDetail.media_url && (
                <div className="mt-2">
                  <img
                    src={`${API_URL}${selectedAssetDetail.media_url}`}
                    alt="Asset media"
                    className="max-w-xs h-auto rounded-lg mb-2"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => window.open(`${API_URL}${selectedAssetDetail.media_url}`, '_blank')}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => downloadMedia(selectedAssetDetail.media_url, `asset-${selectedAssetDetail.id}-media`)}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;