import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./[locale]/globals.css";
import { QueryProvider } from "./components/providers/QueryProvider";
import { WalletProvider } from "./components/providers/WalletProvider";
import { DashboardShell } from "./components/global_ui/DashboardShell";
import { Toaster } from "./components/ui/Toaster";
import { LevelUpModal } from "./components/gamification/LevelUpModal";
import { GlobalXPGain } from "./components/global_ui/GlobalXPGain";
import { ErrorBoundary } from "./components/global_ui/ErrorBoundary";
import NetworkBanner from "./components/wallet/NetworkBanner";
import WalletConnectionModal from "./components/wallet/WalletConnectionModal";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { THEME_STORAGE_KEY } from "./lib/theme";
import { getSiteUrl } from "./lib/metadata";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: "ZizaLend - Borderless P2P Lending & Remittance",
  description:
    "Global peer-to-peer lending and instant remittances powered by blockchain technology. Send money and grow your wealth across borders.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var root=document.documentElement;var stored=localStorage.getItem("${THEME_STORAGE_KEY}");if(stored==="system"){var resolved=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";root.dataset.theme="system";root.classList.toggle("dark",resolved==="dark");}else if(stored==="dark"||stored==="light"){root.dataset.theme=stored;root.classList.toggle("dark",stored==="dark");}else{var theme=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";root.dataset.theme=theme;root.classList.toggle("dark",theme==="dark");}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <QueryProvider>
            <WalletProvider>
              <NetworkBanner />
              <DashboardShell>
                <ErrorBoundary scope="active page" variant="section">
                  {children}
                </ErrorBoundary>
              </DashboardShell>
              <WalletConnectionModal />
            </WalletProvider>
            <Toaster />
            <LevelUpModal />
            <GlobalXPGain />
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
