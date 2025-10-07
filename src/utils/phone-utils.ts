// src/utils/phone-utils.ts

/**
 * Format phone number to E.164 format.
 * If it doesn't start with +, assume it's a US number.
 */
export function normalizePhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // If it's a 10 digit US number, add +1
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }

    // If it's an 11 digit US number (e.g. 15551234567), add +
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return `+${cleaned}`;
    }
    
    // If it already starts with +, assume it's correct
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }

    // Fallback for numbers that might be missing the +
    return `+${cleaned}`;
  }
  
  /**
   * Validate E.164 phone number format
   */
  export function isValidPhoneNumber(phoneNumber: string): boolean {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }
  
  /**
   * Format phone number for display (with formatting)
   */
  export function displayPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return '';
    
    // Remove + and any non-digits
    const digits = phoneNumber.replace(/\D/g, '');
    
    // US phone number formatting
    if (digits.length === 11 && digits.startsWith('1')) {
      const areaCode = digits.slice(1, 4);
      const exchange = digits.slice(4, 7);
      const number = digits.slice(7);
      return `+1 (${areaCode}) ${exchange}-${number}`;
    }
    
    // International formatting (basic)
    if (digits.length > 10) {
      const countryCode = digits.slice(0, -10);
      const remaining = digits.slice(-10);
      const areaCode = remaining.slice(0, 3);
      const exchange = remaining.slice(3, 6);
      const number = remaining.slice(6);
      return `+${countryCode} ${areaCode} ${exchange} ${number}`;
    }
    
    // Fallback to original format
    return phoneNumber;
  }
  
  /**
   * Mask phone number for privacy
   */
  export function maskPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return '';
    
    const formatted = displayPhoneNumber(phoneNumber);
    
    // Mask middle digits: +1 (555) XXX-1234 becomes +1 (555) XXX-****
    return formatted.replace(/(\d{3})-(\d{4})$/, '$1-****');
  }
  
  /**
   * Get country code from phone number
   */
  export function getCountryCode(phoneNumber: string): string {
    if (!phoneNumber.startsWith('+')) return '';
    
    const digits = phoneNumber.slice(1);
    
    // Common country codes
    if (digits.startsWith('1')) return '1'; // US/Canada
    if (digits.startsWith('44')) return '44'; // UK
    if (digits.startsWith('49')) return '49'; // Germany
    if (digits.startsWith('33')) return '33'; // France
    if (digits.startsWith('81')) return '81'; // Japan
    if (digits.startsWith('86')) return '86'; // China
    if (digits.startsWith('91')) return '91'; // India
    
    // Extract first 1-3 digits as potential country code
    for (let i = 1; i <= 3; i++) {
      const code = digits.slice(0, i);
      if (isValidCountryCode(code)) {
        return code;
      }
    }
    
    return '';
  }
  
  /**
   * Check if a string is a valid country code
   */
  function isValidCountryCode(code: string): boolean {
    // This is a simplified list. In production, you'd use a comprehensive list
    const validCodes = [
      '1', '7', '20', '27', '30', '31', '32', '33', '34', '36', '39', '40', '41', 
      '43', '44', '45', '46', '47', '48', '49', '51', '52', '53', '54', '55', '56', 
      '57', '58', '60', '61', '62', '63', '64', '65', '66', '81', '82', '84', '86', 
      '90', '91', '92', '93', '94', '95', '98'
    ];
    
    return validCodes.includes(code);
  }
  
  /**
   * Generate phone number input placeholder based on country
   */
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
  
  
  /**
   * Extract digits only from phone number
   */
  export function extractDigits(phoneNumber: string): string {
    return phoneNumber.replace(/\D/g, '');
  }
  
  /**
   * Check if two phone numbers are the same
   */
  export function isSamePhoneNumber(phone1: string, phone2: string): boolean {
    const normalized1 = normalizePhoneNumber(phone1);
    const normalized2 = normalizePhoneNumber(phone2);
    return normalized1 === normalized2;
  }
