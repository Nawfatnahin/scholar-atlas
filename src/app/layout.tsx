import type { Metadata } from "next";
import { Inter, Lora, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { SubscriptionProvider } from "@/components/SubscriptionProvider";
import { KeepAlive } from "@/components/KeepAlive";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scholar Atlas — Your Academic Command Center",
  description: "All in one platform designed to help you balance your procrastination and progress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${lora.variable} ${spaceGrotesk.variable} h-full antialiased overflow-x-hidden`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var stored = localStorage.getItem('backlogger-theme');
              var prefersDark = window.matchMedia(
                '(prefers-color-scheme: dark)').matches;
              if (stored === 'dark' || (!stored && prefersDark)) {
                document.documentElement.classList.add('dark');
              }
              document.documentElement.classList.add('no-transition');
              window.addEventListener('load', function() {
                document.documentElement.classList.remove('no-transition');
              });
            } catch(e) {}
          })();
        `}} />
      </head>
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <SubscriptionProvider>
          <KeepAlive />
          {children}
        </SubscriptionProvider>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
