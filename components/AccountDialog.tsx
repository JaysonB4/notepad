"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  MIN_PASSWORD_LENGTH,
  USERNAME_HINT,
  friendlyAuthError,
  validateAccountForm,
  type AccountForm,
  type AccountMode,
} from "@/lib/account";
import { accountsConfigured, getSupabase } from "@/lib/supabase";

const inputClass =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 dark:border-warmblack-edge dark:bg-warmblack-deep";

const emptyForm: AccountForm = { username: "", email: "", password: "" };

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AccountDialog({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<AccountMode>("signup");
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Keep the native dialog in step with the `open` prop.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const update = (field: keyof AccountForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const switchMode = (next: AccountMode) => {
    setMode(next);
    setError(null);
    setInfo(null);
  };

  const handleClose = () => {
    // Never keep a typed password around once the dialog is closed.
    setForm((f) => ({ ...f, password: "" }));
    setError(null);
    setInfo(null);
    onClose();
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;

    const problem = validateAccountForm(mode, form);
    if (problem) {
      setError(problem);
      setInfo(null);
      return;
    }

    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const email = form.email.trim();

      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password: form.password,
          options: {
            data: { username: form.username.trim() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (signUpError) throw signUpError;

        // With email confirmation on, Supabase answers an already-used email with a user that has no identities.
        if (data.user && data.user.identities?.length === 0) {
          setError("An account with this email already exists. Try logging in.");
          return;
        }
        if (data.session) {
          handleClose();
          return;
        }
        setMode("login");
        setForm((f) => ({ ...f, password: "" }));
        setInfo("Account created. Check your email to confirm it, then log in.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: form.password,
        });
        if (signInError) throw signInError;
        handleClose();
      }
    } catch (err) {
      setError(friendlyAuthError(err instanceof Error ? err.message : "Something went wrong. Try again."));
    } finally {
      setBusy(false);
    }
  }

  const tab = (value: AccountMode, label: string) => (
    <button
      type="button"
      onClick={() => switchMode(value)}
      aria-pressed={mode === value}
      className={[
        "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        mode === value
          ? "bg-white shadow-sm dark:bg-warmblack-hover"
          : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-100",
      ].join(" ")}
    >
      {label}
    </button>
  );

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      // A click on the backdrop lands on the dialog element itself.
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      aria-labelledby="account-title"
      className="m-auto w-[min(92vw,24rem)] rounded-xl border border-stone-300 bg-stone-50 p-0 text-stone-900 shadow-2xl backdrop:bg-black/40 dark:border-warmblack-edge dark:bg-warmblack dark:text-stone-100"
    >
      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="account-title" className="text-lg font-semibold">
            {mode === "signup" ? "Create an account" : "Log in"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="-mr-1 -mt-1 rounded-md px-2 py-1 text-stone-500 hover:bg-stone-200 dark:hover:bg-warmblack-hover"
          >
            ✕
          </button>
        </div>

        {!accountsConfigured ? (
          <div className="space-y-3 text-sm">
            <p>Accounts aren&rsquo;t set up yet.</p>
            <p className="text-stone-600 dark:text-stone-400">
              Add your Supabase project&rsquo;s URL and public key to a <code>.env.local</code> file, then restart the
              app. The README has the steps.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex gap-1 rounded-lg bg-stone-200 p-1 dark:bg-warmblack-deep">
              {tab("signup", "Sign up")}
              {tab("login", "Log in")}
            </div>

            <form onSubmit={submit} className="space-y-3" noValidate>
              {mode === "signup" && (
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Username</span>
                  <input
                    type="text"
                    value={form.username}
                    onChange={update("username")}
                    autoComplete="username"
                    maxLength={20}
                    placeholder="e.g. jayson"
                    className={inputClass}
                  />
                  <span className="mt-1 block text-xs text-stone-500">{USERNAME_HINT}</span>
                </label>
              )}

              <label className="block text-sm">
                <span className="mb-1 block font-medium">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  autoComplete="email"
                  className={inputClass}
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium">Password</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={update("password")}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className={inputClass}
                />
                {mode === "signup" && (
                  <span className="mt-1 block text-xs text-stone-500">At least {MIN_PASSWORD_LENGTH} characters.</span>
                )}
              </label>

              {error && (
                <p role="alert" className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-950/60 dark:text-red-200">
                  {error}
                </p>
              )}
              {info && (
                <p role="status" className="rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
                  {info}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-md bg-amber-400 px-3 py-2 text-sm font-semibold text-stone-900 hover:bg-amber-300 disabled:opacity-60"
              >
                {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
              </button>
            </form>
          </>
        )}
      </div>
    </dialog>
  );
}
