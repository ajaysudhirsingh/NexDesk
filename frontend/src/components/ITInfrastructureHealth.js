import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const ITInfrastructureHealth = ({ token, user }) => {
  const [healthData, setHealthData] = useState({
    outageImpact: [],
    preventiveVsReactive: [],
    changeManagement: [],
    vendorPerformance: [],
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
    }
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10)
  });
  const [selectedMetric, setSelectedMetric] = useState('outage');

  const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    fetchHealthData();
  }, [dateRange, token]);

  const fetchHealthData = async () => {
    setLoading(true);
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
        setHealthData({
          outageImpact: data.outageImpact || [],
          preventiveVsReactive: data.preventiveVsReactive || [],
          changeManagement: data.changeManagement || [],
          vendorPerformance: data.vendorPerformance || [],
          summary: {
            totalTickets: data.summary?.totalTickets || 0,
            totalOutages: data.summary?.totalOutages || 0,
            outageTickets: data.summary?.outageTickets || 0,
            preventiveTickets: data.summary?.preventiveTickets || 0,
            changeTickets: data.summary?.changeTickets || 0,
            vendorTickets: data.summary?.vendorTickets || 0,
            normalTickets: data.summary?.normalTickets || 0,
            outageHours: data.summary?.outageHours || 0,
            preventivePercentage: data.summary?.preventivePercentage || 0,
            changeSuccessRate: data.summary?.changeSuccessRate || 0,
            avgVendorResolution: data.summary?.avgVendorResolution || 0
          }
        });
      } else {
        // Set empty data on error
        setHealthData({
          outageImpact: [],
          preventiveVsReactive: [],
          changeManagement: [],
          vendorPerformance: [],
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
          }
        });
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const exportData = async (format) => {
    try {
      const params = new URLSearchParams({
        from: dateRange.from,
        to: dateRange.to,
        format
      });

      const response = await fetch(`${API_URL}/api/infrastructure/export?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `infrastructure-health-${dateRange.from}-to-${dateRange.to}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
    }
  };

  const COLORS = {
    outage: '#ef4444',
    normal: '#10b981',
    preventive: '#3b82f6',
    reactive: '#f59e0b',
    change: '#8b5cf6',
    vendor: '#06b6d4'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Safety check to ensure we have valid data structure
  if (!healthData || !healthData.summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-500 mb-2">⚠️ No infrastructure data available</div>
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
              onClick={() => exportData('csv')}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              📊 Export CSV
            </button>
            <button
              onClick={() => exportData('pdf')}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              📄 Export PDF
            </button>
            <button
              onClick={fetchHealthData}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              🔄 Refresh
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
              <p className="text-2xl font-bold text-gray-900">{healthData.summary.totalOutages}</p>
              <p className="text-xs text-red-600 mt-1">
                {healthData.summary.outageHours} hours downtime
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Preventive Actions</p>
              <p className="text-2xl font-bold text-gray-900">{healthData.summary.preventiveTickets}</p>
              <p className="text-xs text-blue-600 mt-1">
                {healthData.summary.preventivePercentage}% of total
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">🔧</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Change Requests</p>
              <p className="text-2xl font-bold text-gray-900">{healthData.summary.changeTickets}</p>
              <p className="text-xs text-purple-600 mt-1">
                {healthData.summary.changeSuccessRate}% success rate
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-2xl">🔄</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-cyan-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vendor Issues</p>
              <p className="text-2xl font-bold text-gray-900">{healthData.summary.vendorTickets}</p>
              <p className="text-xs text-cyan-600 mt-1">
                {healthData.summary.avgVendorResolution}h avg resolution
              </p>
            </div>
            <div className="p-3 bg-cyan-100 rounded-full">
              <span className="text-2xl">🏢</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Selector */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'outage', label: '⚠️ System Outage Impact', color: 'red' },
            { key: 'preventive', label: '🔧 Preventive vs Reactive', color: 'blue' },
            { key: 'change', label: '🔄 Change Management', color: 'purple' },
            { key: 'vendor', label: '🏢 Vendor Performance', color: 'cyan' }
          ].map(metric => (
            <button
              key={metric.key}
              onClick={() => setSelectedMetric(metric.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedMetric === metric.key
                  ? `bg-${metric.color}-600 text-white`
                  : `bg-${metric.color}-100 text-${metric.color}-700 hover:bg-${metric.color}-200`
              }`}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedMetric === 'outage' && '⚠️ System Outage Impact Analysis'}
            {selectedMetric === 'preventive' && '🔧 Preventive vs Reactive Tickets'}
            {selectedMetric === 'change' && '🔄 Change Management Impact'}
            {selectedMetric === 'vendor' && '🏢 Vendor Performance Metrics'}
          </h3>
          
          <ResponsiveContainer width="100%" height={300}>
            {selectedMetric === 'outage' && (
              <LineChart data={healthData.outageImpact || []}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="outages" stroke={COLORS.outage} strokeWidth={2} name="Outages" />
                <Line type="monotone" dataKey="tickets" stroke={COLORS.normal} strokeWidth={2} name="Related Tickets" />
              </LineChart>
            )}
            
            {selectedMetric === 'preventive' && (
              <BarChart data={healthData.preventiveVsReactive || []}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="preventive" fill={COLORS.preventive} name="Preventive" />
                <Bar dataKey="reactive" fill={COLORS.reactive} name="Reactive" />
              </BarChart>
            )}
            
            {selectedMetric === 'change' && (
              <BarChart data={healthData.changeManagement || []}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="successful" fill={COLORS.normal} name="Successful Changes" />
                <Bar dataKey="failed" fill={COLORS.outage} name="Failed Changes" />
                <Bar dataKey="tickets" fill={COLORS.change} name="Related Tickets" />
              </BarChart>
            )}
            
            {selectedMetric === 'vendor' && (
              <BarChart data={healthData.vendorPerformance || []}>
                <XAxis dataKey="vendor" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="tickets" fill={COLORS.vendor} name="Tickets" />
                <Bar dataKey="avgResolution" fill={COLORS.normal} name="Avg Resolution (hrs)" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Summary Pie Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Infrastructure Health Overview</h3>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={(() => {
                  const pieData = [
                    { name: 'Normal Operations', value: healthData.summary.normalTickets, fill: COLORS.normal },
                    { name: 'Outage Related', value: healthData.summary.outageTickets, fill: COLORS.outage },
                    { name: 'Preventive Maintenance', value: healthData.summary.preventiveTickets, fill: COLORS.preventive },
                    { name: 'Change Related', value: healthData.summary.changeTickets, fill: COLORS.change },
                    { name: 'Vendor Issues', value: healthData.summary.vendorTickets, fill: COLORS.vendor }
                  ].filter(item => item.value > 0);
                  
                  // If no data, show a placeholder
                  if (pieData.length === 0) {
                    return [{ name: 'No Data', value: 1, fill: '#e5e7eb' }];
                  }
                  
                  return pieData;
                })()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(() => {
                  const colors = [COLORS.normal, COLORS.outage, COLORS.preventive, COLORS.change, COLORS.vendor];
                  return colors.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ));
                })()}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Outages */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Recent System Outages</h3>
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
                {healthData.outageImpact.slice(0, 5).map((outage, index) => (
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
                {healthData.outageImpact.length === 0 && (
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏢 Vendor Performance Summary</h3>
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
                {healthData.vendorPerformance.slice(0, 5).map((vendor, index) => (
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
                {healthData.vendorPerformance.length === 0 && (
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

export default ITInfrastructureHealth;