/**
 * Format currency amount with Indian Rupee (INR) default or custom currency
 */
export function formatCurrency(amount, currency = 'INR') {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format large numbers compactly (e.g. 2,840,000 -> 2.84M)
 */
export function formatCompactNumber(num) {
  if (num === undefined || num === null || isNaN(num)) return '0';
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Format storage size in GB/TB
 */
export function formatStorage(gb) {
  if (!gb) return '0 GB';
  if (gb >= 1024) {
    return `${(gb / 1024).toFixed(1)} TB`;
  }
  return `${gb} GB`;
}

/**
 * Format percentage with 1 decimal
 */
export function formatPercent(val) {
  if (val === undefined || val === null || isNaN(val)) return '0%';
  return `${Number(val).toFixed(1)}%`;
}

/**
 * Format date time string
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format date only
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format relative time (e.g. "5 mins ago", "2 hours ago")
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return '-';
  const diff = (new Date() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
