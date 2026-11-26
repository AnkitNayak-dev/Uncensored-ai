import "./globals.css";

export const metadata = {
  title: "Uncensored AI",
  description: "Free, uncensored AI with no login, no signup, and no logs. Powered by GPT-OSS 120B. Ask anything — we don't judge.",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
