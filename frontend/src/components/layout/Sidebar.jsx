import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  HiOutlineViewGrid,
  HiOutlineSwitchHorizontal,
  HiOutlineChartBar,
  HiOutlineSparkles,
  HiOutlineTrendingUp,
  HiOutlineExclamationCircle,
  HiOutlineDocumentText,
  HiOutlineScale,
  HiOutlineClipboardList,
  HiOutlineCog,
  HiOutlineChevronLeft,
  HiOutlineChevronRight
} from 'react-icons/hi';
import { RiRobot2Line } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: HiOutlineViewGrid },
  { name: 'Transactions', path: '/transactions', icon: HiOutlineSwitchHorizontal },
  { name: 'Analytics', path: '/analytics', icon: HiOutlineChartBar },
  { name: 'AI Assistant', path: '/ai-assistant', icon: RiRobot2Line, badge: 'GenAI' },
  { name: 'Expense Predictions', path: '/predictions', icon: HiOutlineTrendingUp, badge: 'ML' },
  { name: 'Anomaly Detection', path: '/anomalies', icon: HiOutlineExclamationCircle },
  { name: 'Receipt Scanner', path: '/receipt-scanner', icon: HiOutlineDocumentText, badge: 'OCR' },
  { name: 'Budgets & Goals', path: '/budgets-goals', icon: HiOutlineScale },
  { name: 'Reports', path: '/reports', icon: HiOutlineClipboardList },
  { name: 'Settings', path: '/settings', icon: HiOutlineCog }
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <aside
      className={`relative flex flex-col border-r transition-all duration-300 z-20 
        ${collapsed ? 'w-20' : 'w-64'} 
        bg-white dark:bg-fintech-dark-card border-slate-200 dark:border-fintech-dark-border`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-fintech-dark-border">
        {!collapsed && (
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center text-white font-bold text-lg shadow-glow-indigo">
              FS
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                FinSight <span className="text-indigo-500">AI</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">
                Intelligence
              </span>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="mx-auto w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center text-white font-bold text-lg shadow-glow-indigo">
            FS
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-fintech-dark-hover transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <HiOutlineChevronRight size={18} /> : <HiOutlineChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-xl font-medium text-sm transition-all group relative
              ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-fintech-dark-hover hover:text-slate-900 dark:hover:text-slate-100'
              }
              ${collapsed ? 'justify-center' : ''}
              `
            }
          >
            <item.icon className="text-xl flex-shrink-0" />
            
            {!collapsed && (
              <span className="ml-3 truncate">{item.name}</span>
            )}

            {!collapsed && item.badge && (
              <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                {item.badge}
              </span>
            )}

            {collapsed && (
              <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                {item.name}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Info / Status footer */}
      <div className="p-3 border-t border-slate-200 dark:border-fintech-dark-border">
        {!collapsed ? (
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
              {getInitials(user?.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {user?.full_name || 'Guest User'}
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                {isAuthenticated ? `${user?.role === 'admin' ? 'Pro Plan' : 'Active Plan'}` : 'Not Signed In'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
              {getInitials(user?.full_name)}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
