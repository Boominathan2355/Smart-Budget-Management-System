import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  TrendingUp,
  Calendar,
  Users
} from 'lucide-react';
import axios from 'axios';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorState from './ui/ErrorState';
import EmptyState from './ui/EmptyState';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="card h-full">
    <div className="card-body h-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 mt-1">
              <TrendingUp className="inline mr-1" size={16} />
              {trend}
            </p>
          )}
        </div>
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}1A` }}>
          <Icon className="text-slate-400" size={24} />
        </div>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    myRequests: 0,
    pendingApprovals: 0,
    approvedRequests: 0,
    totalBudget: 0,
    recentRequests: []
  });

  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowWelcome(false), 5000);
    return () => clearTimeout(t);
  }, []);

  const fetchDashboardData = async () => {
    setError(null);
    setLoading(true);
    try {
      // Fetch different data based on user role
      if (user.role === 'coordinator') {
        const response = await axios.get('http://localhost:5000/api/requests/my-requests');
        const requests = response.data.requests;
        
        setDashboardData({
          myRequests: requests.length,
          pendingApprovals: requests.filter(r => r.status === 'pending').length,
          approvedRequests: requests.filter(r => r.status === 'approved' || r.status === 'reconciled').length,
          totalBudget: requests.reduce((sum, r) => sum + r.estimatedBudget, 0),
          recentRequests: requests.slice(0, 5)
        });
      } else {
        // For approvers, fetch pending approvals
        const response = await axios.get('http://localhost:5000/api/requests/pending-approvals');
        const approvals = response.data.approvals;
        
        setDashboardData(prev => ({
          ...prev,
          pendingApprovals: approvals.length,
          recentRequests: approvals.slice(0, 5)
        }));
      }
    } catch (error) {
      setError('Failed to load dashboard data');
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'reconciled': return 'text-blue-600 bg-blue-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const statusChartData = useMemo(() => {
    const items = dashboardData.recentRequests || [];
    const counts = items.reduce((acc, item) => {
      const req = item.request || item;
      const key = (req.status || 'pending');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([status, value]) => ({ status, value }));
  }, [dashboardData.recentRequests]);

  if (loading) {
    return <LoadingSpinner className="h-64" />;
  }

  if (error) {
    return <ErrorState title="Dashboard unavailable" message={error} onRetry={fetchDashboardData} />;
  }

  return (
    <div className="section">
      {/* Welcome Header */}
      {showWelcome && (
        <div className="rounded-2xl shadow-xl text-white p-4 lg:p-6 bg-gradient-to-r from-blue-600 to-indigo-700 transition-opacity duration-500">
          <h1 className="mb-1">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-white/80">
            {user?.designation} • {user?.department} Department
          </p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stat-grid">
        {user?.role === 'coordinator' && (
          <>
            <StatCard
              title="My Requests"
              value={dashboardData.myRequests}
              icon={FileText}
              color="#3B82F6"
            />
            <StatCard
              title="Pending"
              value={dashboardData.pendingApprovals}
              icon={Clock}
              color="#F59E0B"
            />
            <StatCard
              title="Approved"
              value={dashboardData.approvedRequests}
              icon={CheckCircle}
              color="#10B981"
            />
            <StatCard
              title="Total Budget"
              value={`₹${dashboardData.totalBudget.toLocaleString()}`}
              icon={DollarSign}
              color="#8B5CF6"
            />
          </>
        )}
        
        {user?.role !== 'coordinator' && (
          <>
            <StatCard
              title="Pending Approvals"
              value={dashboardData.pendingApprovals}
              icon={Clock}
              color="#F59E0B"
            />
            <StatCard
              title="This Month"
              value="12"
              icon={Calendar}
              color="#3B82F6"
            />
            <StatCard
              title="Total Processed"
              value="48"
              icon={CheckCircle}
              color="#10B981"
            />
            <StatCard
              title="Active Users"
              value="24"
              icon={Users}
              color="#8B5CF6"
            />
          </>
        )}
      </div>

      {/* Charts and Recent Activity */}
      <div className="dashboard-grid">
        <div className="lg:col-span-12 card">
          <div className="card-header">
            <h2>Overview</h2>
          </div>
          <div className="card-body">
            {statusChartData.length === 0 ? (
              <EmptyState title="No chart data" message="Charts will appear as activity accumulates." />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-12 card mt-6">
          <div className="card-header">
            <h2>Recent Activity</h2>
          </div>
          <div className="card-body">
          {dashboardData.recentRequests.length === 0 ? (
            <EmptyState title="No recent activity" message="Recent requests and approvals will appear here." />
          ) : (
            <div className="space-y-4">
              {dashboardData.recentRequests.map((item, index) => {
                const request = item.request || item;
                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-2 rounded-xl">
                        <FileText className="text-blue-700" size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">{request.eventName}</h3>
                        <p className="text-sm text-slate-600">
                          {request.department} • ₹{request.estimatedBudget?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(request.createdAt || item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;