import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/site";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/utils/locale";
import MessagesProvider from "@/components/i18n/MessagesProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "RoSe – RoomService",
  description: "Leichtgewichtiges Zimmerservice- und Reinigungs-Portal",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const { mail, admin } = getMessages(locale);
  return (
    <html
      lang={locale}
      data-theme="auto"
      data-density="standard"
      data-motion="auto"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MessagesProvider value={{ mail: { status: mail.status, line: mail.line }, unsaved: admin.overview.unsaved }}>{children}</MessagesProvider>
      </body>
    </html>
  );
}
