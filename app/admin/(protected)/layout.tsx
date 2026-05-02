import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminShell from "../components/AdminShell";

export const metadata = {
  title: "Admin — Bord Cadre Films",
  robots: "noindex, nofollow",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/admin/sign-in");

  return <AdminShell>{children}</AdminShell>;
}
