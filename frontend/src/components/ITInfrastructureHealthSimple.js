import React, { useState, useEffect } from 'react';

const ITInfrastructureHealthSimple = ({ token, user }) => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10)
  });

  const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    fetchHealthData();
  }, [dateRange, token]);

  const fetchHealthData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        from: dateRange.from,
        to: dateRange.to
      });

      const response = await fetch(`${API_URL}/api/infrastructure/health?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setHealthData(data);
      } else {
        setError('Failed to fetch infrastructure health data');
      }
    } catch (err) {
      setError('Error fetching infrastructure health data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-2">{error}</div>
          <button 
            onClick={fetchHealthData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-500 mb-2">No infrastructure data available</div>
          <button 
            onClick={fetchHealthData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Load Data
          </button>
        </div>
      </div>
    );
  }

  const summary = healthData.summary || {};
  const outageImpact = healthData.outageImpact || [];
  const vendorPerformance = healthData.vendorPerformance || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              IT Infrastructure Health Dashboard
            </h1>
            <p className="text-purple-100 mt-1 flex items-center gap-2">
              <span className="flex items-center gap-1 bg-green-500/20 text-green-100 px-2 py-1 rounded-full text-xs font-medium">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Realtime Data
              </span>
              <span>Monitor system outages, preventive maintenance, changes, and vendor performance</span>
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <button
              onClick={fetchHealthData}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M1 4v6h6M23 20v-6h-6M20.3 5.7A9 9 0 0 0 5.1 19.3M3.7 18.3A9 9 0 0 1 18.9 4.7"/></svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => handleDateChange('from', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => handleDateChange('to', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchHealthData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Outages</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalOutages || 0}</p>
              <p className="text-xs text-red-600 mt-1">
                {summary.outageHours || 0} hours downtime
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Preventive Actions</p>
              <p className="text-2xl font-bold text-gray-900">{summary.preventiveTickets || 0}</p>
              <p className="text-xs text-blue-600 mt-1">
                {summary.preventivePercentage || 0}% of total
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M22.7 19l-9.1-9.1c.9-1.3 1.4-2.9 1.4-4.6 0-4.4-3.6-8-8-8S1 .9 1 5.3s3.6 8 8 8c1.7 0 3.2-.5 4.6-1.4l9.1 9.1c.4.4 1 .4 1.4 0l2.6-2.6c.4-.4.4-1 0-1.4zM5 8.5c-1.9 0-3.5-1.6-3.5-3.5S3.1 1.5 5 1.5 8.5 3.1 8.5 5 6.9 8.5 5 8.5z"/></svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Change Requests</p>
              <p className="text-2xl font-bold text-gray-900">{summary.changeTickets || 0}</p>
              <p className="text-xs text-purple-600 mt-1">
                {summary.changeSuccessRate || 0}% success rate
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-5C5.9 5 5 5.9 5 7s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6-7c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0-5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-cyan-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vendor Issues</p>
              <p className="text-2xl font-bold text-gray-900">{summary.vendorTickets || 0}</p>
              <p className="text-xs text-cyan-600 mt-1">
                {summary.avgVendorResolution || 0}h avg resolution
              </p>
            </div>
            <div className="p-3 bg-cyan-100 rounded-full">
              <svg className="w-6 h-6 text-cyan-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Data Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Infrastructure Health Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{summary.totalTickets || 0}</div>
            <div className="text-sm text-gray-600">Total Tickets</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{summary.normalTickets || 0}</div>
            <div className="text-sm text-gray-600">Normal Operations</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{summary.outageTickets || 0}</div>
            <div className="text-sm text-gray-600">Outage Related</div>
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Outages */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent System Outages</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">System</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tickets</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {outageImpact.slice(0, 5).map((outage, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{outage.date || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{outage.system || 'System'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{outage.duration || 0}h</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {outage.tickets || 0} tickets
                      </span>
                    </td>
                  </tr>
                ))}
                {outageImpact.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                      No outage data available for the selected period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Vendors by Issues */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Performance Summary</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issues</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Resolution</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendorPerformance.slice(0, 5).map((vendor, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{vendor.vendor || 'Unknown'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{vendor.tickets || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{vendor.avgResolution || 0}h</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (vendor.avgResolution || 0) < 24 
                          ? 'bg-green-100 text-green-800' 
                          : (vendor.avgResolution || 0) < 48 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {(vendor.avgResolution || 0) < 24 ? '🟢 Good' : (vendor.avgResolution || 0) < 48 ? '🟡 Fair' : '🔴 Poor'}
                      </span>
                    </td>
                  </tr>
                ))}
                {vendorPerformance.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                      No vendor performance data available for the selected period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ITInfrastructureHealthSimple;