export const CLOUD_PROVIDERS = [
  { id: 'ALL', name: 'All Providers', icon: 'Layers' },
  { id: 'AWS', name: 'Amazon Web Services', icon: 'Cloud', color: '#FF9900' },
  { id: 'Azure', name: 'Microsoft Azure', icon: 'Cloud', color: '#0078D4' },
  { id: 'GCP', name: 'Google Cloud Platform', icon: 'Cloud', color: '#4285F4' },
];

export const REGIONS = [
  { id: 'ALL', name: 'All Regions' },
  { id: 'Mumbai', name: 'Mumbai (ap-south-1)' },
  { id: 'Singapore', name: 'Singapore (ap-southeast-1)' },
  { id: 'East US', name: 'East US (us-east-1)' },
  { id: 'Frankfurt', name: 'Frankfurt (eu-central-1)' },
];

export const ROLES = {
  ADMIN: {
    label: 'Admin',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Full access to manage infrastructure, apply scaling, and modify policies.',
  },
  OPERATOR: {
    label: 'Operator',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Can manage resources and scale workloads within configured governance policy limits.',
  },
  VIEWER: {
    label: 'Viewer',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    description: 'Read-only access to metrics, dashboards, and financial reports.',
  },
};

export const STATUS_CONFIG = {
  RUNNING: {
    label: 'Running',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  STOPPED: {
    label: 'Stopped',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    dotClass: 'bg-slate-400',
  },
  DEGRADED: {
    label: 'Degraded',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  SCALING: {
    label: 'Scaling',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500 animate-pulse',
  },
  ACTIVE: {
    label: 'Active',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
};
