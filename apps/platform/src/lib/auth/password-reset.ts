export function normalizePasswordResetEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getPasswordResetValidationError(
  password: string,
  confirmPassword: string,
) {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }

  return null;
}

export function getRecoveryRedirectPath(search: string, hash: string) {
  const searchParams = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const callbackType = searchParams.get("type") || hashParams.get("type");

  if (callbackType === "recovery") {
    return "/reset-password";
  }

  const nextPath = searchParams.get("next");
  if (nextPath?.startsWith("/")) {
    return nextPath;
  }

  return null;
}
