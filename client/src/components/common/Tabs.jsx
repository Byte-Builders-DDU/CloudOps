import React from 'react';

export function Tabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={`border-b border-white/[0.06] ${className}`}>
      <nav className="-mb-px flex space-x-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`py-2.5 px-4 border-b-2 font-semibold text-xs flex items-center gap-2 transition-all duration-200 rounded-t-lg ${
                isActive
                  ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
              }`}
            >
              {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} style={isActive ? { filter: 'drop-shadow(0 0 4px rgba(96,165,250,0.6))' } : {}} />}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono ${
                  isActive ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/[0.06] text-slate-500 border border-white/[0.08]'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
