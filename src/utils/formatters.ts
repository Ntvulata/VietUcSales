export function formatUSD(amount: number): string {
  if (isNaN(amount) || amount === undefined || amount === null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatVND(amount: number): string {
  if (isNaN(amount) || amount === undefined || amount === null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(val: number, decimals: number = 0): string {
  if (isNaN(val) || val === undefined || val === null) return '0';
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

export function formatDateVN(dateStr?: string): string {
  if (!dateStr) return '--';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function formatShortBankName(rawName?: string): string {
  if (!rawName) return '';
  const str = rawName.trim();
  const upper = str.toUpperCase();

  if (upper.includes('FOREIGN TRADE') || upper.includes('VIETCOMBANK') || upper.includes('BFTV')) {
    return 'Vietcombank';
  }
  if (upper.includes('MILITARY') || upper.includes('MBBANK') || upper.includes('MB BANK') || upper.includes('MSCB')) {
    return 'MB Bank';
  }
  if (upper.includes('INDUSTRY AND TRADE') || upper.includes('VIETINBANK') || upper.includes('ICBV') || upper.includes('VIETIN')) {
    return 'Vietinbank';
  }
  if (upper.includes('BIDV') || upper.includes('INVESTMENT AND DEVELOPMENT')) {
    return 'BIDV';
  }
  if (upper.includes('TECHCOMBANK') || upper.includes('TCB')) {
    return 'Techcombank';
  }
  if (upper.includes('AGRIBANK') || upper.includes('AGRICULTURE')) {
    return 'Agribank';
  }
  if (upper.includes('ACB') || upper.includes('ASIA COMMERCIAL')) {
    return 'ACB';
  }

  // If it has " - STK:" or "(STK:", extract the front part
  const dashIdx = str.indexOf(' - ');
  if (dashIdx !== -1) {
    return str.substring(0, dashIdx).trim();
  }
  const parenIdx = str.indexOf('(');
  if (parenIdx !== -1) {
    return str.substring(0, parenIdx).trim();
  }

  return str;
}

