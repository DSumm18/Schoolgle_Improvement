import { describe, expect, it } from "vitest";
import {
  getPasswordResetValidationError,
  getRecoveryRedirectPath,
  normalizePasswordResetEmail,
} from "./password-reset";

describe("password reset helpers", () => {
  it("normalizes emails before requesting a reset link", () => {
    expect(normalizePasswordResetEmail("  Lynette@RawdonStPeters.co.uk  ")).toBe(
      "lynette@rawdonstpeters.co.uk",
    );
  });

  it("requires a usable new password and confirmation", () => {
    expect(getPasswordResetValidationError("short", "short")).toBe(
      "Password must be at least 8 characters.",
    );
    expect(getPasswordResetValidationError("new-password", "different")).toBe(
      "Passwords do not match.",
    );
    expect(getPasswordResetValidationError("new-password", "new-password")).toBeNull();
  });

  it("routes Supabase recovery callbacks to the reset password page", () => {
    expect(getRecoveryRedirectPath("?type=recovery", "")).toBe("/reset-password");
    expect(getRecoveryRedirectPath("", "#type=recovery&access_token=abc")).toBe(
      "/reset-password",
    );
    expect(getRecoveryRedirectPath("?next=/dashboard", "")).toBe("/dashboard");
  });
});
