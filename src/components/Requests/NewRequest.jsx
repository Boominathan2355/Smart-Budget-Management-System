import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { EVENT_CATEGORIES, CATEGORY_LABELS, DEPARTMENTS, USER_ROLES, ROLE_LABELS } from '../../utils/constants';
import { Calendar, DollarSign, FileText, Users, Save } from 'lucide-react';
import axios from 'axios';

const NewRequest = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    eventName: '',
    category: '',
    schedule: {
      startDate: '',
      endDate: '',
      duration: ''
    },
    subject: '',
    details: '',
    estimatedBudget: '',
    approvalWorkflow: {
      type: 'strict',
      customApprovers: []
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/requests', formData);
      alert('Request submitted successfully!');
      setFormData({
        eventName: '',
        category: '',
        schedule: { startDate: '', endDate: '', duration: '' },
        subject: '',
        details: '',
        estimatedBudget: '',
        approvalWorkflow: { type: 'strict', customApprovers: [] }
      });
    } catch (error) {
      alert('Failed to submit request: ' + error.response?.data?.message);
    }
    
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('schedule.')) {
      const scheduleField = name.split('.')[1];
      setFormData({
        ...formData,
        schedule: {
          ...formData.schedule,
          [scheduleField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  return (
    <div className="app-container max-w-5xl">
      <div className="card rounded-2xl">
        <div className="card-header">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Create New Budget Request</h1>
          <p className="text-slate-600 mt-1">Fill in the details for your event budget request</p>
        </div>

        <form onSubmit={handleSubmit} className="card-body space-y-6">
          {/* Basic Information */}
          <div className="bg-slate-50 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center">
              <FileText className="mr-2" size={20} />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Event Name *
                </label>
                <input
                  type="text"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter event name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Coordinator
                </label>
                <input
                  type="text"
                  value={user?.name}
                  disabled
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={user?.department}
                  disabled
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Subject/Purpose *
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of the event purpose"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Detailed Description *
              </label>
              <textarea
                name="details"
                value={formData.details}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Provide detailed information about the event, objectives, expected outcomes, etc."
              />
            </div>
          </div>

          {/* Schedule Information */}
          <div className="bg-slate-50 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center">
              <Calendar className="mr-2" size={20} />
              Schedule Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="schedule.startDate"
                  value={formData.schedule.startDate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  name="schedule.endDate"
                  value={formData.schedule.endDate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Duration
                </label>
                <input
                  type="text"
                  name="schedule.duration"
                  value={formData.schedule.duration}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 2 days, 4 hours"
                />
              </div>
            </div>
          </div>

          {/* Budget Information */}
          <div className="bg-slate-50 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center">
              <DollarSign className="mr-2" size={20} />
              Budget Information
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Estimated Budget (₹) *
              </label>
              <input
                type="number"
                name="estimatedBudget"
                value={formData.estimatedBudget}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter estimated budget amount"
              />
            </div>
          </div>

          {/* Approval Workflow */}
          <div className="bg-slate-50 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Approval Workflow</h2>
            <div className="flex items-center space-x-6">
              <label className="inline-flex items-center space-x-2">
                <input
                  type="radio"
                  name="workflowType"
                  checked={formData.approvalWorkflow.type === 'strict'}
                  onChange={() => setFormData({ ...formData, approvalWorkflow: { type: 'strict', customApprovers: [] } })}
                />
                <span className="text-sm text-slate-700">Strict Chain</span>
              </label>
              <label className="inline-flex items-center space-x-2">
                <input
                  type="radio"
                  name="workflowType"
                  checked={formData.approvalWorkflow.type === 'custom'}
                  onChange={() => setFormData({ ...formData, approvalWorkflow: { ...formData.approvalWorkflow, type: 'custom' } })}
                />
                <span className="text-sm text-slate-700">Custom Chain</span>
              </label>
            </div>

            {formData.approvalWorkflow.type === 'custom' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-600">Select approvers and order. First approver will receive the request initially.</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.values(USER_ROLES)
                    .filter(r => r !== USER_ROLES.COORDINATOR)
                    .map(role => {
                      const index = formData.approvalWorkflow.customApprovers.findIndex(a => a.role === role);
                      const selected = index !== -1;
                      return (
                        <div key={role} className={`flex items-center justify-between p-3 border rounded-md ${selected ? 'border-blue-300 bg-white' : 'border-slate-200 bg-white'}`}>
                          <span className="text-sm text-slate-800">{ROLE_LABELS[role]}</span>
                          {selected ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min={1}
                                value={formData.approvalWorkflow.customApprovers[index].order}
                                onChange={(e) => {
                                  const order = parseInt(e.target.value) || 1;
                                  const updated = [...formData.approvalWorkflow.customApprovers];
                                  updated[index] = { ...updated[index], order };
                                  setFormData({ ...formData, approvalWorkflow: { ...formData.approvalWorkflow, customApprovers: updated } });
                                }}
                                className="w-16 px-2 py-1 border border-slate-300 rounded"
                              />
                              <button
                                type="button"
                                className="text-xs text-red-600 hover:underline"
                                onClick={() => {
                                  const updated = formData.approvalWorkflow.customApprovers.filter(a => a.role !== role);
                                  setFormData({ ...formData, approvalWorkflow: { ...formData.approvalWorkflow, customApprovers: updated } });
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="text-xs text-blue-700 hover:underline"
                              onClick={() => {
                                const updated = [...formData.approvalWorkflow.customApprovers, { role, order: (formData.approvalWorkflow.customApprovers.length + 1) }];
                                setFormData({ ...formData, approvalWorkflow: { ...formData.approvalWorkflow, customApprovers: updated } });
                              }}
                            >
                              Add
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="px-6 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Save Draft
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-6 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Save className="mr-2" size={16} />
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewRequest;