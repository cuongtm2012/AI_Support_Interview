export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

export function validateSignUpPassword(password: string): string | null {
  if (password.length < 8) {
    return "Mật khẩu phải có ít nhất 8 ký tự.";
  }
  return null;
}

export type PasswordStrength = "weak" | "fair" | "good";

export function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) return "weak";

  let score = 0;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;

  if (score >= 3) return "good";
  if (score >= 2) return "fair";
  return "weak";
}

export const PASSWORD_STRENGTH_LABELS: Record<PasswordStrength, string> = {
  weak: "Yếu",
  fair: "Trung bình",
  good: "Mạnh",
};
