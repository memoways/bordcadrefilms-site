import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "./components/Header";
import NewsletterModule from "./components/NewsletterModule";
import Footer from "./components/Footer";

const suisseIntl = localFont({
  src: [
    {
      path: "../public/fonts/SuisseIntl-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/SuisseIntl-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/SuisseIntl-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/SuisseIntl-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bord Cadre Films",
  description: "Société de production cinématographique indépendante basée à Genève.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${suisseIntl.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-black">
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
        <NewsletterModule />
        <Footer />
      </body>
    </html>
  );
}
