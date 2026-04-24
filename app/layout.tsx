import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Script from "next/script";
import Header from "./components/Header";
import NewsletterModule from "./components/NewsletterModule";
import Footer from "./components/Footer";
import { getNews } from "./lib/news";

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
  description: "Independent film production company based in Geneva, specialising in arthouse features and international co-productions.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const news = await getNews();
  const hasNews = news.length > 0;

  return (
    <html
      lang="fr"
      className={`${suisseIntl.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-black">
        <Header hasNews={hasNews} />
        <main className="flex-1 flex flex-col">
          {children}
          <div id="sc_a767ccc839044066" />
        </main>
        <NewsletterModule />
        <Footer />
        <Script
          src="https://simplecommenter.com/js/comments.min.js?id=sc_a767ccc839044066"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
