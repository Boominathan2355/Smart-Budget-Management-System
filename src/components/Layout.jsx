import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Menu, 
  X, 
  Bell, 
  LogOut, 
  User, 
  FileText, 
  BarChart3,
  Settings,
  Home,
  CheckCircle
} from 'lucide-react';
import { ROLE_LABELS } from '../utils/constants';
import axios from 'axios';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    // Ask for browser notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
    // Real-time notifications via SSE
    const evt = new EventSource(`http://localhost:5000/api/notifications/stream`, { withCredentials: false });
    evt.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data?.type === 'notification') {
          setNotifications((prev) => [data.payload, ...prev].slice(0, 50));
          setUnreadCount((c) => c + 1);
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            const requestId = data?.payload?.request;
            const n = new Notification(data.payload.title || 'New Notification', {
              body: data.payload.message || '',
              tag: data.payload._id,
            });
            n.onclick = () => {
              try {
                window.focus();
                if (requestId) {
                  window.open(`/requests/${requestId}`, '_self');
                }
              } catch {}
            };
          }
        }
      } catch {}
    };
    evt.onerror = () => {
      evt.close();
    };
    return () => {
      evt.close();
    };
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount((data.notifications || []).filter(n => !n.isRead).length);
    } catch (e) {
      // silent fail
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/api/notifications/${id}/read`);
      fetchNotifications();
    } catch (e) {}
  };

  const markAllRead = async () => {
    try {
      await axios.patch('http://localhost:5000/api/notifications/read-all');
      fetchNotifications();
    } catch (e) {}
  };

  const navigationItems = [
    { icon: Home, label: 'Dashboard', href: '/', roles: 'all' },
    { icon: FileText, label: 'New Request', href: '/new-request', roles: ['coordinator'] },
    { icon: FileText, label: 'My Requests', href: '/my-requests', roles: ['coordinator'] },
    { icon: CheckCircle, label: 'Approve', href: '/pending-approvals', 
      roles: ['budget_coordinator', 'program_coordinator', 'hod', 'dean', 'vice_principal', 'principal', 'joint_secretary', 'secretary'] },
    { icon: BarChart3, label: 'Reports', href: '/reports', 
      roles: ['hod', 'dean', 'vice_principal', 'principal', 'joint_secretary', 'secretary'] }
  ];

  const filteredNavigation = navigationItems.filter(item => {
    const roleLower = (user?.role || '').toLowerCase();
    return item.roles === 'all' || item.roles.includes(roleLower);
  });

  const isActive = (href) => typeof window !== 'undefined' && window.location && window.location.pathname === href;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Top navigation bar */}
      <header className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="app-container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden focus-ring rounded-md"
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Budget Management</h1>
            <nav className="hidden lg:flex items-center gap-1 ml-4" aria-label="Main">
              {filteredNavigation.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors focus-ring ${
                    isActive(item.href) ? 'text-blue-700 bg-blue-50' : 'text-gray-700 hover:bg-blue-50/70 hover:text-blue-700'
                  }`}
                >
                  <item.icon className="mr-2" size={18} />
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600 hidden lg:block">
              {user?.department} • {user?.designation}
            </div>
            <div className="relative" ref={notifRef}>
              <button className="relative focus-ring rounded-md" aria-label="Notifications">
                <Bell className="text-gray-400 hover:text-gray-600 cursor-pointer" size={20} />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </button>
            </div>
            <button onClick={logout} className="hidden lg:inline-flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors focus-ring">
              <LogOut className="mr-2" size={16} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {sidebarOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white/95 backdrop-blur">
            <div className="app-container py-2 space-y-1">
              {filteredNavigation.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href) ? 'text-blue-700 bg-blue-50' : 'text-gray-700 hover:bg-blue-50/70 hover:text-blue-700'
                  }`}
                >
                  <item.icon className="mr-2" size={18} />
                  {item.label}
                </a>
              ))}
              <button onClick={logout} className="w-full inline-flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors">
                <LogOut className="mr-2" size={16} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="py-2 lg:py-4">
        <div className="app-container">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;