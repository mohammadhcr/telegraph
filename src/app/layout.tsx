import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ClerkProvider, ClerkLoading } from "@clerk/nextjs";
import Loading from "./loading";

const myFont = localFont({
  src: [
    {
      path: "../../public/Vazirmatn-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/Vazirmatn-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/Vazirmatn-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/Vazirmatn-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/Vazirmatn-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/Vazirmatn-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/Vazirmatn-Black.ttf",
      weight: "900",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  title: "Telegraph",
  description: "Telegraph Messenger",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="fa">
        <head>
          <link rel="manifest" href="/manifest.json" />
        </head>
        <body className={`${myFont.className}`}>
          <ClerkLoading>
            <Loading />
          </ClerkLoading>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
