"use client";

import { useEffect, useRef, useState } from "react";
import AccountDialog from "./AccountDialog";
import { displayName } from "@/lib/account";
import { getSupabase } from "@/lib/supabase";
import { useAuthUser } from "@/lib/useAuthUser";

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="flex-none">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

/**
 * Sits to the right of the light/dark button. Signed out, it opens the sign-up dialog.
 * Signed in, it shows the username and a menu with Log out.
 */
export default function AccountButton() {
  const { user, ready } = useAuthUser();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu on an outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  async function logOut() {
    setMenuOpen(false);
    await getSupabase()?.auth.signOut();
  }

  if (!ready) {
    // Reserve the space so the toolbar doesn't shift once the session is known.
    return <span className="inline-block h-8 w-28" aria-hidden />;
  }

  if (!user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          aria-haspopup="dialog"
          className="emboss flex h-8 items-center gap-1.5 px-3 text-sm"
        >
          <UserIcon />
          <span>Sign up</span>
        </button>
        <AccountDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      </>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        title={user.email ?? undefined}
        className="emboss flex h-8 max-w-[11rem] items-center gap-1.5 px-3 text-sm"
      >
        <UserIcon />
        <span className="truncate">{displayName(user)}</span>
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1.5 w-56 rounded-lg border border-stone-300 bg-stone-50 p-1 shadow-lg dark:border-warmblack-edge dark:bg-warmblack"
        >
          <p className="truncate px-3 py-2 text-xs text-stone-500">{user.email}</p>
          <button
            type="button"
            role="menuitem"
            onClick={logOut}
            className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-stone-200 dark:hover:bg-warmblack-hover"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
