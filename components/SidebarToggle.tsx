"use client";

type Props = {
  /** true when the sidebar is hidden, so the tab offers to show it. */
  collapsed: boolean;
  onClick: () => void;
};

/**
 * A small tab on the sidebar's outer edge, level with the toolbar. It is positioned against the
 * left edge of the main area, so it stays on the sidebar's edge when open and at the left edge of
 * the screen when the sidebar is hidden. Desktop only; phones use the "Notes" button instead.
 */
export default function SidebarToggle({ collapsed, onClick }: Props) {
  const label = collapsed ? "Show sidebar" : "Hide sidebar";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={!collapsed}
      aria-controls="sidebar"
      title={label}
      className="absolute left-0 top-2 z-10 hidden h-8 w-6 items-center justify-center rounded-r-lg border border-l-0 border-stone-300 bg-stone-100 text-stone-500 shadow-sm transition-colors hover:text-stone-900 md:flex dark:border-warmblack-edge dark:bg-warmblack dark:text-stone-400 dark:hover:text-stone-100"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        // Points left to hide the sidebar, right to bring it back.
        className={collapsed ? "" : "rotate-180"}
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  );
}
