import React, { useState, useEffect } from 'react';

const ITInfrastructureHealthAdvanced = ({ token, user }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [healthData, setHealthData] = useState(null);
  const [firewalls, setFirewalls] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [downtimes, setDowntimes] = useState([]);
  const [servers, setServers] = useState([]);
  const [procurements, setProcurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({});

  const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    fetchAllData();
  }, [token]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchHealthData(),
        fetchFirewalls(),
        fetchVendors(),
        fetchDowntimes(),
        fetchServers(),
        fetchProcurements()
      ]);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/infrastructure/health`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();

        setHealthData(data);
      } else {
        // Set empty data structure so dashboard still shows
        setHealthData({
          summary: {
            totalTickets: 0,
            totalOutages: 0,
            outageTickets: 0,
            preventiveTickets: 0,
            changeTickets: 0,
            vendorTickets: 0,
            normalTickets: 0,
            outageHours: 0,
            preventivePercentage: 0,
            changeSuccessRate: 0,
            avgVendorResolution: 0
          },
          outageImpact: [],
          preventiveVsReactive: [],
          changeManagement: [],
          vendorPerformance: []
        });
      }
    } catch (error) {
      // Set empty data structure so dashboard still shows
      setHealthData({
        summary: {
          totalTickets: 0,
          totalOutages: 0,
          outageTickets: 0,
          preventiveTickets: 0,
          changeTickets: 0,
          vendorTickets: 0,
          normalTickets: 0,
          outageHours: 0,
          preventivePercentage: 0,
          changeSuccessRate: 0,
          avgVendorResolution: 0
        },
        outageImpact: [],
        preventiveVsReactive: [],
        changeManagement: [],
        vendorPerformance: []
      });
    }
  };

  const fetchFirewalls = async () => {
    try {
      const response = await fetch(`${API_URL}/api/infrastructure/firewalls`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFirewalls(data);
      }
    } catch (error) {
      // Mock data for demonstration
      setFirewalls([
        { id: 1, name: 'Main Firewall', brand: 'Cisco ASA 5516', ip: '192.168.1.1', license_expiry: '2024-12-31', status: 'Active', last_updated: '2024-08-01' },
        { id: 2, name: 'DMZ Firewall', brand: 'Fortinet FortiGate 60F', ip: '192.168.2.1', license_expiry: '2024-09-15', status: 'Active', last_updated: '2024-07-28' },
        { id: 3, name: 'Branch Firewall', brand: 'SonicWall TZ370', ip: '192.168.3.1', license_expiry: '2024-08-20', status: 'Warning', last_updated: '2024-07-25' }
      ]);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch(`${API_URL}/api/infrastructure/vendors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      }
    } catch (error) {
      // Mock data for demonstration
      setVendors([
        { id: 1, name: 'Microsoft Corporation', contact_person: 'John Smith', email: 'john@microsoft.com', phone: '+1-800-642-7676', contract_expiry: '2024-12-31', services: 'Office 365, Azure', status: 'Active' },
        { id: 2, name: 'Cisco Systems', contact_person: 'Sarah Johnson', email: 'sarah@cisco.com', phone: '+1-408-526-4000', contract_expiry: '2024-10-15', services: 'Network Equipment, Support', status: 'Active' },
        { id: 3, name: 'Dell Technologies', contact_person: 'Mike Wilson', email: 'mike@dell.com', phone: '+1-800-289-3355', contract_expiry: '2024-11-30', services: 'Servers, Hardware Support', status: 'Active' }
      ]);
    }
  };

  const fetchDowntimes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/infrastructure/downtimes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDowntimes(data);
      }
    } catch (error) {
      // Mock data for demonstration
      setDowntimes([
        { id: 1, system: 'Email Server', start_time: '2024-08-01 14:30', end_time: '2024-08-01 18:45', duration: '4h 15m', reason: 'Hardware failure', impact: 'High', affected_users: 200 },
        { id: 2, system: 'Database Server', start_time: '2024-07-28 09:15', end_time: '2024-07-28 11:30', duration: '2h 15m', reason: 'Planned maintenance', impact: 'Medium', affected_users: 50 },
        { id: 3, system: 'Network Switch', start_time: '2024-07-25 16:00', end_time: '2024-07-25 18:30', duration: '2h 30m', reason: 'Power outage', impact: 'High', affected_users: 150 }
      ]);
    }
  };

  const fetchServers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/infrastructure/servers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setServers(data);
      }
    } catch (error) {
      // Mock data for demonstration
      setServers([
        { id: 1, name: 'Web Server 01', ip: '192.168.10.10', os: 'Ubuntu 20.04 LTS', cpu: 'Intel Xeon E5-2680 v4', ram: '32GB', storage: '1TB SSD', status: 'Running', uptime: '45 days', last_backup: '2024-08-03' },
        { id: 2, name: 'Database Server', ip: '192.168.10.20', os: 'Windows Server 2019', cpu: 'Intel Xeon Gold 6248', ram: '64GB', storage: '2TB SSD', status: 'Running', uptime: '30 days', last_backup: '2024-08-03' },
        { id: 3, name: 'File Server', ip: '192.168.10.30', os: 'CentOS 8', cpu: 'AMD EPYC 7302P', ram: '16GB', storage: '4TB HDD', status: 'Warning', uptime: '12 days', last_backup: '2024-08-02' }
      ]);
    }
  };

  const fetchProcurements = async () => {
    try {
      const response = await fetch(`${API_URL}/api/infrastructure/procurements`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProcurements(data);
      }
    } catch (error) {
      // Mock data for demonstration
      setProcurements([
        { id: 1, item: 'Dell PowerEdge R750 Server', category: 'Hardware', vendor: 'Dell Technologies', quantity: 2, unit_price: 5500, total_price: 11000, status: 'Approved', requested_by: 'IT Team', request_date: '2024-07-15', expected_delivery: '2024-08-15' },
        { id: 2, item: 'Cisco Catalyst 9300 Switch', category: 'Network', vendor: 'Cisco Systems', quantity: 1, unit_price: 3200, total_price: 3200, status: 'Pending', requested_by: 'Network Team', request_date: '2024-07-20', expected_delivery: '2024-08-25' },
        { id: 3, item: 'Microsoft Office 365 Licenses', category: 'Software', vendor: 'Microsoft Corporation', quantity: 50, unit_price: 12, total_price: 600, status: 'Ordered', requested_by: 'HR Department', request_date: '2024-07-25', expected_delivery: '2024-08-05' }
      ]);
    }
  };

  const openModal = (type, data = {}) => {
    setModalType(type);
    
    // Set default values based on modal type
    let defaultData = { ...data };
    if (!data.id) { // Only set defaults for new entries
      switch (type) {
        case 'firewall':
          defaultData = { ...defaultData, status: 'Active' };
          break;
        case 'vendor':
          defaultData = { ...defaultData, status: 'Active' };
          break;
        case 'downtime':
          defaultData = { ...defaultData, impact: 'Medium' };
          break;
        case 'server':
          defaultData = { ...defaultData, status: 'Running' };
          break;
        case 'procurement':
          defaultData = { 
            ...defaultData, 
            status: 'Pending', 
            category: 'Hardware',
            request_date: new Date().toISOString().slice(0, 10)
          };
          break;
      }
    }
    
    setFormData(defaultData);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setFormData({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const endpoint = `${API_URL}/api/infrastructure/${modalType}s`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();

        closeModal();
        // Refresh data after successful submission
        await fetchAllData();
      } else {
        const error = await response.json();
        alert('Error saving data: ' + error.error);
      }
    } catch (error) {
      alert('Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'running':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'warning':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
      case 'down':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'ordered':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getExpiryStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'Expired', color: 'bg-red-100 text-red-800' };
    if (daysUntilExpiry <= 30) return { status: `${daysUntilExpiry} days`, color: 'bg-yellow-100 text-yellow-800' };
    return { status: `${daysUntilExpiry} days`, color: 'bg-green-100 text-green-800' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center text-white">
              IT Infrastructure Management Center
            </h1>
            <p className="text-blue-100 mt-1 flex items-center gap-2">
              <span className="flex items-center gap-1 bg-green-500/20 text-green-100 px-2 py-1 rounded-full text-xs font-medium">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Realtime Data
              </span>
              <span>Comprehensive IT infrastructure monitoring, management, and procurement system</span>
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <button
              onClick={fetchAllData}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              🔄 Refresh All
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'dashboard', name: '📊 Dashboard', icon: '📊' },
              { id: 'firewalls', name: '🔥 Firewalls', icon: '🔥' },
              { id: 'vendors', name: '🏢 Vendors', icon: '🏢' },
              { id: 'downtimes', name: '⏰ Downtimes', icon: '⏰' },
              { id: 'servers', name: '🖥️ Servers', icon: '🖥️' },
              { id: 'procurement', name: '📦 Procurement', icon: '📦' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Outages</p>
                  <p className="text-2xl font-bold text-gray-900">{(healthData && healthData.summary) ? healthData.summary.totalOutages : 0}</p>
                  <p className="text-xs text-red-600 mt-1">{(healthData && healthData.summary) ? healthData.summary.outageHours : 0} hours downtime</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Servers</p>
                  <p className="text-2xl font-bold text-gray-900">{servers.filter(s => s.status === 'Running').length}</p>
                  <p className="text-xs text-blue-600 mt-1">{servers.length} total servers</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <span className="text-2xl">🖥️</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expiring Licenses</p>
                  <p className="text-2xl font-bold text-gray-900">{firewalls.filter(f => getExpiryStatus(f.license_expiry).color.includes('yellow')).length}</p>
                  <p className="text-xs text-yellow-600 mt-1">Within 30 days</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <span className="text-2xl">⏰</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Procurements</p>
                  <p className="text-2xl font-bold text-gray-900">{procurements.filter(p => p.status === 'Pending').length}</p>
                  <p className="text-xs text-green-600 mt-1">${procurements.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.total_price, 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <span className="text-2xl">📦</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🚨 Recent Downtimes</h3>
              <div className="space-y-3">
                {downtimes.slice(0, 3).map((downtime) => (
                  <div key={downtime.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{downtime.system}</p>
                      <p className="text-sm text-gray-600">{downtime.duration} - {downtime.reason}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      downtime.impact === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {downtime.impact}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔥 Firewall Status</h3>
              <div className="space-y-3">
                {firewalls.slice(0, 3).map((firewall) => {
                  const expiry = getExpiryStatus(firewall.license_expiry);
                  return (
                    <div key={firewall.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{firewall.name}</p>
                        <p className="text-sm text-gray-600">{firewall.brand} - {firewall.ip}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${expiry.color}`}>
                        {expiry.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Firewalls Tab */}
      {activeTab === 'firewalls' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">🔥 Firewall Management</h2>
            <button
              onClick={() => openModal('firewall')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              ➕ Add Firewall
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">License Expiry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {firewalls.map((firewall) => {
                  const expiry = getExpiryStatus(firewall.license_expiry);
                  return (
                    <tr key={firewall.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{firewall.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{firewall.brand}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{firewall.ip}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${expiry.color}`}>
                          {expiry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(firewall.status)}`}>
                          {firewall.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openModal('firewall', firewall)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          ✏️ Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vendors Tab */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">🏢 Vendor Management</h2>
            <button
              onClick={() => openModal('vendor')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              ➕ Add Vendor
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Person</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract Expiry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Services</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vendor.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vendor.contact_person}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vendor.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vendor.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vendor.contract_expiry}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{vendor.services}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openModal('vendor', vendor)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        ✏️ Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Downtimes Tab */}
      {activeTab === 'downtimes' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">⏰ Downtime Records</h2>
            <button
              onClick={() => openModal('downtime')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              ➕ Add Downtime Record
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">System</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Impact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Affected Users</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {downtimes.map((downtime) => (
                  <tr key={downtime.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{downtime.system}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{downtime.start_time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{downtime.end_time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{downtime.duration}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{downtime.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(downtime.impact)}`}>
                        {downtime.impact}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{downtime.affected_users}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openModal('downtime', downtime)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        ✏️ Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Servers Tab */}
      {activeTab === 'servers' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">🖥️ Server Management</h2>
            <button
              onClick={() => openModal('server')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              ➕ Add Server
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OS</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RAM</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Storage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uptime</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {servers.map((server) => (
                  <tr key={server.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{server.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{server.ip}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{server.os}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{server.cpu}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{server.ram}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{server.storage}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(server.status)}`}>
                        {server.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{server.uptime}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openModal('server', server)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        ✏️ Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Procurement Tab */}
      {activeTab === 'procurement' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">📦 Procurement Management</h2>
            <button
              onClick={() => openModal('procurement')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              ➕ Add Procurement Request
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {procurements.map((procurement) => (
                  <tr key={procurement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{procurement.item}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{procurement.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{procurement.vendor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{procurement.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${procurement.unit_price.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${procurement.total_price.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(procurement.status)}`}>
                        {procurement.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{procurement.requested_by}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openModal('procurement', procurement)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        ✏️ Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {modalType === 'firewall' && '🔥 Firewall Details'}
                {modalType === 'vendor' && '🏢 Vendor Details'}
                {modalType === 'downtime' && '⏰ Downtime Record'}
                {modalType === 'server' && '🖥️ Server Details'}
                {modalType === 'procurement' && '📦 Procurement Request'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {modalType === 'firewall' && (
                  <>
                    <input
                      type="text"
                      placeholder="Firewall Name"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Brand/Model"
                      value={formData.brand || ''}
                      onChange={(e) => setFormData({...formData, brand: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="IP Address"
                      value={formData.ip || ''}
                      onChange={(e) => setFormData({...formData, ip: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="date"
                      placeholder="License Expiry"
                      value={formData.license_expiry || ''}
                      onChange={(e) => setFormData({...formData, license_expiry: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <select
                      value={formData.status || 'Active'}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="Active">Active</option>
                      <option value="Warning">Warning</option>
                      <option value="Critical">Critical</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </>
                )}
                
                {modalType === 'vendor' && (
                  <>
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Contact Person"
                      value={formData.contact_person || ''}
                      onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="date"
                      placeholder="Contract Expiry"
                      value={formData.contract_expiry || ''}
                      onChange={(e) => setFormData({...formData, contract_expiry: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <textarea
                      placeholder="Services Provided"
                      value={formData.services || ''}
                      onChange={(e) => setFormData({...formData, services: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      required
                    />
                  </>
                )}

                {modalType === 'downtime' && (
                  <>
                    <input
                      type="text"
                      placeholder="System Name"
                      value={formData.system || ''}
                      onChange={(e) => setFormData({...formData, system: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="datetime-local"
                      placeholder="Start Time"
                      value={formData.start_time || ''}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="datetime-local"
                      placeholder="End Time"
                      value={formData.end_time || ''}
                      onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <textarea
                      placeholder="Reason for Downtime"
                      value={formData.reason || ''}
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="2"
                      required
                    />
                    <select
                      value={formData.impact || 'Medium'}
                      onChange={(e) => setFormData({...formData, impact: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="Low">Low Impact</option>
                      <option value="Medium">Medium Impact</option>
                      <option value="High">High Impact</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Affected Users"
                      value={formData.affected_users || ''}
                      onChange={(e) => setFormData({...formData, affected_users: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </>
                )}

                {modalType === 'server' && (
                  <>
                    <input
                      type="text"
                      placeholder="Server Name"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="IP Address"
                      value={formData.ip || ''}
                      onChange={(e) => setFormData({...formData, ip: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Operating System"
                      value={formData.os || ''}
                      onChange={(e) => setFormData({...formData, os: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="CPU Specifications"
                      value={formData.cpu || ''}
                      onChange={(e) => setFormData({...formData, cpu: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="RAM (e.g., 32GB DDR4)"
                      value={formData.ram || ''}
                      onChange={(e) => setFormData({...formData, ram: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Storage (e.g., 1TB SSD)"
                      value={formData.storage || ''}
                      onChange={(e) => setFormData({...formData, storage: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <select
                      value={formData.status || 'Running'}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="Running">Running</option>
                      <option value="Warning">Warning</option>
                      <option value="Critical">Critical</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </>
                )}

                {modalType === 'procurement' && (
                  <>
                    <input
                      type="text"
                      placeholder="Item Name"
                      value={formData.item || ''}
                      onChange={(e) => setFormData({...formData, item: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <select
                      value={formData.category || 'Hardware'}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="Hardware">Hardware</option>
                      <option value="Software">Software</option>
                      <option value="Network Equipment">Network Equipment</option>
                      <option value="Security Equipment">Security Equipment</option>
                      <option value="Services">Services</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Vendor Name"
                      value={formData.vendor || ''}
                      onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={formData.quantity || ''}
                      onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Unit Price"
                      value={formData.unit_price || ''}
                      onChange={(e) => setFormData({...formData, unit_price: parseFloat(e.target.value), total_price: parseFloat(e.target.value) * (formData.quantity || 1)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Requested By"
                      value={formData.requested_by || ''}
                      onChange={(e) => setFormData({...formData, requested_by: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <textarea
                      placeholder="Justification"
                      value={formData.justification || ''}
                      onChange={(e) => setFormData({...formData, justification: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="2"
                      required
                    />
                  </>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ITInfrastructureHealthAdvanced;