import { ClerkProvider } from "@clerk/nextjs";

export default function AdminShellLayout({ children }: { children: React.ReactNode }) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
