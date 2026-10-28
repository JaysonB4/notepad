import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Notepad",
  description: "A simple notepad with lists and checkboxes. Saved in your browser.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Runs before first paint so the saved theme (or the system preference) applies without a flash.
const themeScript = `(function(){try{var t=localStorage.getItem('notepad:theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-stone-100 text-stone-900 antialiased dark:bg-warmblack dark:text-stone-100">
        {children}
      </body>
    </html>
  );
}
