import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact — Bord Cadre Films",
  description: "Contact Bord Cadre Films for any collaboration, acquisition or press enquiry.",
};

export default function ContactPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-4 py-16">
      <div className="max-w-xl w-full flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold">Contact</h1>
          <p className="text-zinc-600 mt-2">
            For any enquiry, write to us at{" "}
            <a href="mailto:info@bordcadrefilms.com" className="underline text-zinc-900 hover:text-zinc-600">
              info@bordcadrefilms.com
            </a>{" "}
            or use the form below.
          </p>
        </div>
        <ContactForm />
      </div>
    </main>
  );
}
