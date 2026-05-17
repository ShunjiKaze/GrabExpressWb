// Philippine mobile: 09XXXXXXXXX (11 digits, starts with 09)
export const isValidPhone = (v) => /^09\d{9}$/.test(v.trim());

// Name: letters, spaces, hyphens, apostrophes. Min 2 chars.
export const isValidName = (v) => v.trim().length >= 2 && /^[a-zA-ZÀ-ÿ\s'\-]+$/.test(v.trim());

// Weight: positive number up to 20
export const isValidWeight = (v) => {
  const n = parseFloat(v);
  return !isNaN(n) && n > 0 && n <= 20;
};

// Non-empty string
export const isRequired = (v) => v.trim().length > 0;

// Strip all non-digit characters from a string
export const digitsOnly = (v) => v.replace(/\D/g, '');

// Strip digits and special chars from a name field (keep letters/spaces/hyphens/apostrophes)
export const sanitizeName = (v) => v.replace(/[^a-zA-ZÀ-ÿ\s'\-]/g, '');

export const PHONE_HINT = '11-digit PH number starting with 09 (e.g. 09123456789)';
export const NAME_HINT  = 'Letters only — no numbers or special characters';
