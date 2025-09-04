import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import NewRequest from './components/Requests/NewRequest';
import RequestsList from './components/Requests/RequestsList';
import ReportsPage from './components/Reports/ReportsPage';
import RequestDetails from './components/Requests/RequestDetails';
// Admin panel removed

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/" /> : <Register />} 
        />
        <Route 
          path="/forgot" 
          element={user ? <Navigate to="/" /> : <ForgotPassword />} 
        />
        <Route 
          path="/reset" 
          element={user ? <Navigate to="/" /> : <ResetPassword />} 
        />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/new-request" element={
          <ProtectedRoute>
            <Layout>
              <NewRequest />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/my-requests" element={
          <ProtectedRoute>
            <Layout>
              <RequestsList type="my-requests" />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/pending-approvals" element={
          <ProtectedRoute>
            <Layout>
              <RequestsList type="pending-approvals" />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/reports" element={
          <ProtectedRoute>
            <Layout>
              <ReportsPage />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Admin panel route removed */}
        
        <Route path="/requests/:id" element={
          <ProtectedRoute>
            <Layout>
              <RequestDetails />
            </Layout>
          </ProtectedRoute>
        } />
        {/* Route alias for explicit approve path */}
        <Route path="/requests/:id/approve" element={
          <ProtectedRoute>
            <Layout>
              <RequestDetails />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;