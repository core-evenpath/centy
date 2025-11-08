export function normalizePhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  let cleaned = phoneNumber;
  
  if (cleaned.startsWith('whatsapp:')) {
    cleaned = cleaned.replace('whatsapp:', '');
  }
  
  cleaned = cleaned.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  if (phoneNumber.startsWith('+')) {
    const digitsOnly = phoneNumber.replace('whatsapp:', '').replace(/[^\d+]/g, '');
    if (digitsOnly.startsWith('+')) {
      return digitsOnly;
    }
  }

  return `+${cleaned}`;
}

export function isValidPhoneNumber(phoneNumber: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

export function displayPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  const digits = phoneNumber.replace(/\D/g, '');
  
  if (digits.length === 11 && digits.startsWith('1')) {
    const areaCode = digits.slice(1, 4);
    const exchange = digits.slice(4, 7);
    const number = digits.slice(7);
    return `+1 (${areaCode}) ${exchange}-${number}`;
  }
  
  if (digits.length > 10) {
    const countryCode = digits.slice(0, -10);
    const remaining = digits.slice(-10);
    const areaCode = remaining.slice(0, 3);
    const exchange = remaining.slice(3, 6);
    const number = remaining.slice(6);
    return `+${countryCode} ${areaCode} ${exchange} ${number}`;
  }
  
  return phoneNumber;
}

export function maskPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  const formatted = displayPhoneNumber(phoneNumber);
  
  return formatted.replace(/(\d{3})-(\d{4})$/, '$1-****');
}

export function getCountryCode(phoneNumber: string): string {
  if (!phoneNumber.startsWith('+')) return '';
  
  const digits = phoneNumber.slice(1);
  
  if (digits.startsWith('1')) return '1';
  if (digits.startsWith('44')) return '44';
  if (digits.startsWith('49')) return '49';
  if (digits.startsWith('33')) return '33';
  if (digits.startsWith('81')) return '81';
  if (digits.startsWith('86')) return '86';
  if (digits.startsWith('91')) return '91';
  
  for (let i = 1; i <= 3; i++) {
    const code = digits.slice(0, i);
    if (isValidCountryCode(code)) {
      return code;
    }
  }
  
  return '';
}

function isValidCountryCode(code: string): boolean {
  const validCodes = [
    '1', '7', '20', '27', '30', '31', '32', '33', '34', '36', '39', '40', '41', 
    '43', '44', '45', '46', '47', '48', '49', '51', '52', '53', '54', '55', '56', 
    '57', '58', '60', '61', '62', '63', '64', '65', '66', '81', '82', '84', '86', 
    '90', '91', '92', '93', '94', '95', '98'
  ];
  
  return validCodes.includes(code);
}

export function getPhonePlaceholder(countryCode?: string): string {
  switch (countryCode) {
    case '1':
      return '+1 (555) 123-4567';
    case '44':
      return '+44 20 7123 4567';
    case '49':
      return '+49 30 12345678';
    case '33':
      return '+33 1 23 45 67 89';
    case '81':
      return '+81 3 1234 5678';
    case '86':
      return '+86 138 0013 8000';
    case '91':
      return '+91 98765 43210';
    default:
      return '+1 (555) 123-4567';
  }
}

export function extractDigits(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

export function isSamePhoneNumber(phone1: string, phone2: string): boolean {
  const normalized1 = normalizePhoneNumber(phone1);
  const normalized2 = normalizePhoneNumber(phone2);
  return normalized1 === normalized2;
}
