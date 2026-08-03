import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const ogImage = `${protocol}://${host}/og.png`;

  return {
    title: "Presta+ | Tus préstamos, bajo control",
    description: "Gestiona préstamos, cobros, clientes y cuotas desde una sola app.",
    openGraph: {
      title: "Presta+ | Tus préstamos, bajo control",
      description: "Gestiona préstamos, cobros, clientes y cuotas desde una sola app.",
      type: "website",
      locale: "es_GT",
      images: [{ url: ogImage, width: 1536, height: 1024, alt: "Presta+ — Tus préstamos, bajo control" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Presta+ | Tus préstamos, bajo control",
      description: "Gestiona préstamos, cobros, clientes y cuotas desde una sola app.",
      images: [ogImage],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={geist.variable}>{children}</body>
    </html>
  );
}
