import type { User } from "@supabase/supabase-js";

export type AccountMode = "signup" | "login";

export type AccountForm = {
  username: string;
  email: string;
  password: string;
};

export const USERNAME_HINT = "3–20 characters: letters, numbers, _ or -";
export const MIN_PASSWORD_LENGTH = 8;

const USERNAME_RE = /^[A-Za-z0-9_-]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The first problem with the form, or null when it is fine to submit. */
export function validateAccountForm(mode: AccountMode, form: AccountForm): string | null {
  if (mode === "signup" && !USERNAME_RE.test(form.username.trim())) {
    return `Choose a username with ${USERNAME_HINT}.`;
  }
  if (!EMAIL_RE.test(form.email.trim())) {
    return "Enter a valid email address.";
  }
  if (mode === "signup" && form.password.length < MIN_PASSWORD_LENGTH) {
    return `Use a password with at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (mode === "login" && form.password.length === 0) {
    return "Enter your password.";
  }
  return null;
}

/** What to show in the account button: the username, falling back to the start of the email. */
export function displayName(user: Pick<User, "email" | "user_metadata">): string {
  const username = user.user_metadata?.username;
  if (typeof username === "string" && username.trim()) return username.trim();
  const local = user.email?.split("@")[0];
  return local || "Account";
}

/** Turns Supabase's error text into something a person can act on. */
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Incorrect email or password.";
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "An account with this email already exists. Try logging in.";
  }
  if (m.includes("email not confirmed")) return "Confirm your email first. Check your inbox for the link.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Wait a minute and try again.";
  if (m.includes("password") && m.includes("least")) return `Use a password with at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (m.includes("failed to fetch") || m.includes("network")) return "Couldn't reach the server. Check your connection and try again.";
  return message;
}
