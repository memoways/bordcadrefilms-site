"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "./AdminSidebar";
import UserButtonClient from "../(protected)/UserButtonClient";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive check
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsOpen(false);
      else setIsOpen(true);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-zinc-50 font-sans z-40 text-zinc-900">
      {/* Sidebar Overlay (Mobile) */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-zinc-900/50 z-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 lg:w-0"
        }`}
      >
        <div className={`h-full ${!isOpen && "lg:hidden"}`}>
          <AdminSidebar onClose={() => isMobile && setIsOpen(false)} />
        </div>
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 shrink-0 border-b border-zinc-200 bg-white flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 -ml-2 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-500"
              aria-label="Toggle Sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M4 6h16M4 12h16M4 18h7" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
            <span className="text-sm text-zinc-400 font-medium tracking-wide">CMS</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:block text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              View site ↗
            </a>
            <UserButtonClient />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8">
          <div className="w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
