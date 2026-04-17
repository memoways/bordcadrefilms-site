import { SignIn } from "@clerk/nextjs";

export default function AdminSignInPage() {
  return (
    <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center px-4 z-50">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs tracking-[0.2em] uppercase text-zinc-500 mb-1">
            Bord Cadre Films
          </p>
          <h1 className="text-xl font-semibold text-white">Admin</h1>
        </div>
        <SignIn
          routing="path"
          path="/admin/sign-in"
          forceRedirectUrl="/admin"
          appearance={{
            variables: {
              colorPrimary: "#ffffff",
              colorBackground: "#18181b",
              colorText: "#f4f4f5",
              colorTextOnPrimaryBackground: "#18181b",
              colorInputBackground: "#27272a",
              colorInputText: "#f4f4f5",
              borderRadius: "8px",
            },
            elements: {
              card: {
                boxShadow: "none",
                border: "1px solid #3f3f46",
                "--clerk-color-muted-foreground": "#71717a",
                "--clerk-color-foreground": "#f4f4f5",
              } as React.CSSProperties,
              headerTitle: { display: "none" },
              headerSubtitle: { display: "none" },
              socialButtonsBlockButton: {
                borderColor: "#3f3f46",
                color: "#d4d4d8",
              },
              dividerLine: { background: "#3f3f46" },
              dividerText: { color: "#71717a" },
              formFieldLabel: {
                color: "#a1a1aa",
              },
              formFieldInput: {
                background: "#27272a",
                color: "#f4f4f5",
                borderColor: "#3f3f46",
              },
              formButtonPrimary: {
                color: "#18181b",
              },
              footerAction: "hidden",
            },
          }}
        />
      </div>
    </div>
  );
}
