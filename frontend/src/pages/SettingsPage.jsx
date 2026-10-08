import React from 'react';
import { HiOutlineCog, HiOutlineUser, HiOutlineCurrencyDollar } from 'react-icons/hi';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <HiOutlineCog className="text-indigo-500" />
          Platform Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage user profile, default currencies, AI preferences, and security settings
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-fintech-dark-card border border-slate-200 dark:border-fintech-dark-border shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <HiOutlineUser className="text-indigo-500" />
          User Profile
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">Full Name</label>
            <input
              type="text"
              defaultValue="Alex Reynolds"
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
            />
          </div>
          <div>
            <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">Email Address</label>
            <input
              type="email"
              defaultValue="alex.reynolds@example.com"
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
