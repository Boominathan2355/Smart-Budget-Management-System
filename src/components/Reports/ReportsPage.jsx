import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BarChart3, Download, Calendar, FileText, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ReportsPage = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    period: 'monthly',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    department: user?.role === 'hod' ? user.department : 'all'
  });

  const exportPdf = async () => {
    try {
      const container = document.getElementById('reports-export');
      if (!container) return;
      const canvas = await html2canvas(container, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let y = 10;
      if (imgHeight <= pageHeight - 20) {
        pdf.addImage(imgData, 'PNG', 10, y, imgWidth, imgHeight);
      } else {
        let remainingHeight = imgHeight;
        let position = 10;
        const sliceHeight = pageHeight - 20;
        const canvasPage = document.createElement('canvas');
        const ctx = canvasPage.getContext('2d');
        canvasPage.width = canvas.width;
        canvasPage.height = (sliceHeight * canvas.width) / imgWidth;
        let sY = 0;
        while (remainingHeight > 0) {
          ctx.clearRect(0, 0, canvasPage.width, canvasPage.height);
          ctx.drawImage(canvas, 0, sY, canvas.width, canvasPage.height, 0, 0, canvasPage.width, canvasPage.height);
          const pageData = canvasPage.toDataURL('image/png');
          pdf.addImage(pageData, 'PNG', 10, 10, imgWidth, sliceHeight);
          remainingHeight -= sliceHeight;
          sY += canvasPage.height;
          if (remainingHeight > 0) pdf.addPage();
        }
      }
      pdf.save(`report_${filters.period}_${filters.year}_${filters.month || ''}.pdf`);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:5000/api/reports/';
      
      if (user.role === 'hod') {
        url += `department/${filters.department}?period=${filters.period}&year=${filters.year}&month=${filters.month}`;
      } else if (user.role === 'dean') {
        url += `cross-department?period=${filters.period}&year=${filters.year}&month=${filters.month}`;
      } else {
        url += `institution?period=${filters.period}&year=${filters.year}&month=${filters.month}`;
      }

      const response = await axios.get(url);
      setReportData(response.data);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    }
    setLoading(false);
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const chartData = reportData ? Object.entries(reportData.categoryBreakdown || reportData.departmentBreakdown || {}).map(([key, value]) => ({
    name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    estimated: value.estimated,
    approved: value.approved,
    spent: value.spent,
    count: value.count
  })) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="reports-export">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center">
            <BarChart3 className="mr-3" size={28} />
            Budget Reports & Analytics
          </h1>
          <button onClick={exportPdf} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md hover:from-blue-700 hover:to-indigo-700 transition-colors flex items-center">
            <Download className="mr-2" size={16} />
            Export PDF
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.period}
            onChange={(e) => setFilters({...filters, period: e.target.value})}
            className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="monthly">Monthly Report</option>
            <option value="annual">Annual Report</option>
          </select>

          <input
            type="number"
            value={filters.year}
            onChange={(e) => setFilters({...filters, year: parseInt(e.target.value)})}
            min="2020"
            max="2030"
            className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {filters.period === 'monthly' && (
            <input
              type="number"
              value={filters.month}
              onChange={(e) => setFilters({...filters, month: parseInt(e.target.value)})}
              min="1"
              max="12"
              className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          )}

          {user.role !== 'hod' && (
            <select
              value={filters.department}
              onChange={(e) => setFilters({...filters, department: e.target.value})}
              className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Departments</option>
              <option value="CSE (Computer Science and Engineering)">CSE (Computer Science and Engineering)</option>
              <option value="IT (Information Technology)">IT (Information Technology)</option>
              <option value="ECE (Electronics & Communication Engineering)">ECE (Electronics & Communication Engineering)</option>
              <option value="EEE (Electrical & Electronics Engineering)">EEE (Electrical & Electronics Engineering)</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Automobile Engineering">Automobile Engineering</option>
              <option value="AI & DS (Artificial Intelligence & Data Science)">AI & DS (Artificial Intelligence & Data Science)</option>
              <option value="Mechatronics Engineering">Mechatronics Engineering</option>
              <option value="Biomedical Engineering">Biomedical Engineering</option>
              <option value="MBA (Management Studies)">MBA (Management Studies)</option>
              <option value="MCA (Computer Applications)">MCA (Computer Applications)</option>
              <option value="Science & Humanities (Maths, Physics, Chemistry, English)">Science & Humanities (Maths, Physics, Chemistry, English)</option>
            </select>
          )}
        </div>
      </div>

      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-6 h-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Requests</p>
                  <p className="text-2xl font-extrabold text-blue-600">{reportData.summary?.totalRequests || 0}</p>
                </div>
                <FileText className="text-blue-400" size={24} />
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-6 h-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Approved</p>
                  <p className="text-2xl font-extrabold text-green-600">{reportData.summary?.approvedCount || 0}</p>
                </div>
                <Calendar className="text-green-400" size={24} />
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-6 h-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Budget Approved</p>
                  <p className="text-2xl font-extrabold text-purple-600">
                    ₹{(reportData.summary?.totalApproved || 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="text-purple-400" size={24} />
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-6 h-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Variance</p>
                  <p className={`text-2xl font-extrabold ${(reportData.summary?.variance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{Math.abs(reportData.summary?.variance || 0).toLocaleString()}
                  </p>
                </div>
                <BarChart3 className="text-gray-400" size={24} />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Budget Analysis</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="estimated" fill="#3B82F6" name="Estimated" />
                  <Bar dataKey="approved" fill="#10B981" name="Approved" />
                  <Bar dataKey="spent" fill="#F59E0B" name="Actual Spent" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Request Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Trends (for institution-wide reports) */}
          {reportData.monthlyTrends && (
            <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="estimated" fill="#3B82F6" name="Estimated" />
                  <Bar dataKey="approved" fill="#10B981" name="Approved" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsPage;