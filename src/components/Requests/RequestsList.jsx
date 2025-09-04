import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, Calendar, DollarSign, User, Search, Filter } from 'lucide-react';
import { CATEGORY_LABELS } from '../../utils/constants';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RequestsList = ({ type = 'my-requests' }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, [type]);

  const fetchRequests = async () => {
    try {
      let url = 'http://localhost:5000/api/requests/';
      
      if (type === 'my-requests') {
        url += 'my-requests';
      } else if (type === 'pending-approvals') {
        url += 'pending-approvals';
      } else {
        url += 'all';
      }

      const response = await axios.get(url);
      
      if (type === 'pending-approvals') {
        setRequests(response.data.approvals.map(a => a.request));
      } else {
        setRequests(response.data.requests);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
    setLoading(false);
  };

  const filteredRequests = requests.filter(request => {
    if (filters.status && request.status !== filters.status) return false;
    if (filters.category && request.category !== filters.category) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        request.eventName.toLowerCase().includes(searchLower) ||
        request.subject.toLowerCase().includes(searchLower) ||
        request.department.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'reconciled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      workshop: 'bg-purple-100 text-purple-800',
      events: 'bg-blue-100 text-blue-800',
      seminar_halls: 'bg-green-100 text-green-800',
      lab_materials: 'bg-orange-100 text-orange-800',
      allowance: 'bg-pink-100 text-pink-800',
      guest_lecture: 'bg-indigo-100 text-indigo-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="section">
      {/* Header */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {type === 'my-requests' ? 'My Requests' : 
             type === 'pending-approvals' ? 'Pending Approvals' : 'All Requests'}
          </h1>
          <div className="text-sm text-slate-500">
            Total: {filteredRequests.length} requests
          </div>
          </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search requests..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="input pl-9 focus-ring"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="select focus-ring"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="reconciled">Reconciled</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
            className="select focus-ring"
          >
            <option value="">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <button
            onClick={fetchRequests}
            className="btn-primary flex items-center justify-center focus-ring"
          >
            <Filter className="mr-2" size={16} />
            Refresh
          </button>
        </div>
        </div>
      </div>

      {/* Requests Grid */}
      <div className="grid gap-6">
        {filteredRequests.length === 0 ? (
          <div className="card">
            <div className="card-body text-center p-12">
            <FileText className="mx-auto text-slate-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No requests found</h3>
            <p className="text-slate-600">
              {type === 'my-requests' 
                ? "You haven't submitted any requests yet." 
                : "No pending approvals at this time."}
            </p>
            </div>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request._id} className="card hover:shadow-xl transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{request.eventName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(request.category)}`}>
                        {CATEGORY_LABELS[request.category]}
                      </span>
                    </div>
                    <p className="text-slate-600 mb-2">{request.subject}</p>
                    <p className="text-sm text-slate-500 line-clamp-2">{request.details}</p>
                  </div>
                  
                  <div className="text-right ml-4">
                    <span className={`chip text-sm ${getStatusColor(request.status)}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="mr-2" size={16} />
                    <div>
                      <p className="font-medium text-slate-800">{request.coordinator?.name || user?.name}</p>
                      <p className="text-xs text-slate-500">{request.department}</p>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-slate-600">
                    <Calendar className="mr-2" size={16} />
                    <div>
                      <p className="font-medium">
                        {new Date(request.schedule?.startDate || request.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs">Start Date</p>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-slate-600">
                    <DollarSign className="mr-2" size={16} />
                    <div>
                      <p className="font-medium text-slate-800">₹{request.estimatedBudget?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Estimated Budget</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <button onClick={() => navigate(`/requests/${request._id}`)} className="px-4 py-2 text-blue-700 hover:bg-blue-50 rounded-md transition-colors text-sm font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RequestsList;