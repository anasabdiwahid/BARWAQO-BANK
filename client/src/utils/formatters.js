export const formatMoney = (minorUnits, currency = 'SOS') => {
  if (minorUnits === null || minorUnits === undefined) return `0.00 ${currency}`;
  const amount = Number(minorUnits) / 100;
  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const maskAccountNumber = (accNumber) => {
  if (!accNumber || accNumber.length < 4) return '****';
  return `${accNumber.slice(0, 2)}****${accNumber.slice(-2)}`;
};

export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'ACTIVE':
    case 'POSTED':
    case 'VERIFIED':
    case 'APPROVED':
    case 'RESOLVED':
    case 'EXECUTED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';

    case 'PENDING':
    case 'UNDER_REVIEW':
    case 'AWAITING_CUSTOMER':
      return 'bg-amber-50 text-amber-700 border-amber-200';

    case 'FROZEN':
    case 'SUSPENDED':
    case 'FAILED':
    case 'REJECTED':
    case 'CANCELLED':
    case 'DEACTIVATED':
      return 'bg-red-50 text-red-700 border-red-200';

    case 'REVERSED':
      return 'bg-purple-50 text-purple-700 border-purple-200';

    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export const getRoleBadgeClass = (role) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'bg-red-900 text-white font-semibold';
    case 'ADMIN':
      return 'bg-red-700 text-white';
    case 'MANAGER':
      return 'bg-gray-900 text-white';
    case 'EMPLOYEE':
      return 'bg-blue-700 text-white';
    case 'CUSTOMER':
      return 'bg-emerald-700 text-white';
    default:
      return 'bg-gray-600 text-white';
  }
};

