import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminSidebar from "../components/AdminSidebar";
import UserButtonClient from "./UserButtonClient";

export const metadata = {
  title: "Admin — Bord Cadre Films",
  robots: "noindex, nofollow",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Double-check auth at layout level (middleware is the primary guard)
  const { userId } = await auth();
  if (!userId) redirect("/admin/sign-in");

  return (
    // Isolated layout — overrides the public site shell (Header/Footer not rendered)
    <div className="fixed inset-0 flex overflow-hidden bg-zinc-50 font-sans z-40">
      <AdminSidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 shrink-0 border-b border-zinc-200 bg-white flex items-center justify-between px-6">
          <span className="text-sm text-zinc-400 font-medium tracking-wide">
            CMS
          </span>
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              View site ↗
            </a>
            <UserButtonClient />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
