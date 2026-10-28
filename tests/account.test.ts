import { describe, expect, it } from "vitest";
import { displayName, friendlyAuthError, validateAccountForm } from "@/lib/account";

const good = { username: "jayson_b", email: "jayson@example.com", password: "correct horse" };

describe("validateAccountForm (sign up)", () => {
  it("accepts a valid form", () => {
    expect(validateAccountForm("signup", good)).toBeNull();
  });

  it.each(["", "ab", "a".repeat(21), "has space", "emoji😀", "semi;colon", "<script>"])(
    "rejects the username %j",
    (username) => {
      expect(validateAccountForm("signup", { ...good, username })).toMatch(/username/i);
    },
  );

  it.each(["abc", "a-b_c", "User_123", "a".repeat(20)])("accepts the username %j", (username) => {
    expect(validateAccountForm("signup", { ...good, username })).toBeNull();
  });

  it("trims the username before checking it", () => {
    expect(validateAccountForm("signup", { ...good, username: "  jayson  " })).toBeNull();
  });

  it.each(["", "plain", "a@b", "a b@c.com", "@c.com"])("rejects the email %j", (email) => {
    expect(validateAccountForm("signup", { ...good, email })).toMatch(/email/i);
  });

  it("requires a password of at least 8 characters", () => {
    expect(validateAccountForm("signup", { ...good, password: "short12" })).toMatch(/at least 8/);
    expect(validateAccountForm("signup", { ...good, password: "exactly8" })).toBeNull();
  });
});

describe("validateAccountForm (log in)", () => {
  it("does not ask for a username", () => {
    expect(validateAccountForm("login", { ...good, username: "" })).toBeNull();
  });

  it("does not enforce the sign-up password length on an existing account", () => {
    expect(validateAccountForm("login", { ...good, password: "x" })).toBeNull();
  });

  it("needs an email and a password", () => {
    expect(validateAccountForm("login", { ...good, email: "nope" })).toMatch(/email/i);
    expect(validateAccountForm("login", { ...good, password: "" })).toMatch(/password/i);
  });
});

describe("displayName", () => {
  it("shows the username", () => {
    expect(displayName({ email: "a@b.com", user_metadata: { username: "jayson_b" } })).toBe("jayson_b");
  });

  it("trims the username", () => {
    expect(displayName({ email: "a@b.com", user_metadata: { username: "  jb  " } })).toBe("jb");
  });

  it("falls back to the start of the email when there is no username", () => {
    expect(displayName({ email: "jayson@example.com", user_metadata: {} })).toBe("jayson");
  });

  it("ignores a username that is not text", () => {
    expect(displayName({ email: "x@y.com", user_metadata: { username: 42 } })).toBe("x");
  });

  it("falls back to a generic label when nothing is known", () => {
    expect(displayName({ email: undefined, user_metadata: {} })).toBe("Account");
  });
});

describe("friendlyAuthError", () => {
  it.each([
    ["Invalid login credentials", "Incorrect email or password."],
    ["User already registered", "An account with this email already exists. Try logging in."],
    ["Email not confirmed", "Confirm your email first. Check your inbox for the link."],
    ["email rate limit exceeded", "Too many attempts. Wait a minute and try again."],
    ["Failed to fetch", "Couldn't reach the server. Check your connection and try again."],
  ])("explains %j", (raw, friendly) => {
    expect(friendlyAuthError(raw)).toBe(friendly);
  });

  it("passes unknown messages through unchanged", () => {
    expect(friendlyAuthError("Something odd happened")).toBe("Something odd happened");
  });
});
