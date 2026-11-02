/**
 * Phone Verification Service for «قطرة دم تنقذ حياة»
 * Generates and validates secure 6-digit verification codes for initial phone registration.
 */

interface PendingVerification {
  phone: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

const pendingVerifications = new Map<string, PendingVerification>();

// Clean phone digits
export function sanitizePhone(phone: string): string {
  const digits = phone.trim().replace(/\D/g, '');
  // If starts with 967 and length > 9, remove 967 prefix for consistent local representation
  if (digits.startsWith('967') && digits.length > 9) {
    return digits.slice(3);
  }
  // If starts with leading 0, remove it
  if (digits.startsWith('0') && digits.length === 10) {
    return digits.slice(1);
  }
  return digits;
}

/**
 * Generate a 6-digit verification code and register pending session
 */
export function sendVerificationCode(phone: string): {
  success: boolean;
  code: string;
  phone: string;
  message: string;
} {
  const clean = sanitizePhone(phone);
  if (clean.length < 7 || clean.length > 15) {
    throw new Error('يرجى إدخال رقم هاتف صحيح يتكون من 7 إلى 12 رقماً');
  }

  // Generate 6-digit numeric OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Store with 10-minute validity
  pendingVerifications.set(clean, {
    phone: clean,
    code,
    expiresAt: Date.now() + 10 * 60 * 1000,
    attempts: 0,
  });

  return {
    success: true,
    code,
    phone: clean,
    message: `تم إنشاء رمز التحقق لرقم ${clean}. أدخل الرمز لتأكيد ملكية الرقم.`,
  };
}

/**
 * Verify the 6-digit code for the specified phone number
 */
export function verifyCode(phone: string, inputCode: string): boolean {
  const clean = sanitizePhone(phone);
  const pending = pendingVerifications.get(clean);

  if (!pending) {
    throw new Error('لم يتم طلب رمز تحقق لهذا الرقم أو انتهت صلاحيته. يرجى طلب رمز جديد.');
  }

  if (Date.now() > pending.expiresAt) {
    pendingVerifications.delete(clean);
    throw new Error('انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.');
  }

  if (pending.attempts >= 5) {
    pendingVerifications.delete(clean);
    throw new Error('تجاوزت عدد المحاولات المسموح بها. يرجى طلب رمز جديد.');
  }

  pending.attempts += 1;

  if (pending.code !== inputCode.trim()) {
    throw new Error('رمز التحقق غير صحيح، يرجى التأكد وإعادة المحاولة.');
  }

  // Code is verified, delete pending session
  pendingVerifications.delete(clean);
  return true;
}
