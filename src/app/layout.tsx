import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { GitHubCorner } from '@/components/github-corner';
import { Coffee, Heart } from '@phosphor-icons/react/dist/ssr';
import pkg from '../../package.json';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Car Tales',
  description: "Generate personalized stories about your car's history",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <GitHubCorner />
        <main className="min-h-screen bg-background">{children}</main>
        <footer className="mb-6 text-center text-sm text-muted-foreground px-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-1 flex-wrap">
            <div className="flex items-center gap-1">
              <span>An AI experiment built with</span>
              <Heart weight="fill" className="h-4 w-4" />
              <span>+</span>
              <Coffee weight="fill" className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1 flex-wrap justify-center">
              <span>in Seattle, WA by</span>
              <a
                href="https://github.com/gearsandcode"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Jesse C (gearsandcode)
              </a>
            </div>
            <div>using Claude API, Next.js, Tailwind, React, and Coolify.</div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-1 flex-wrap">
            <div className="flex items-center gap-1 text-center sm:text-left">
              <span className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                © {new Date().getFullYear()} Couple of Blocks, LLC. All rights
                reserved.
              </span>
              <span className="text-center text-xs text-muted-foreground">
                Version {pkg.version}
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-1 flex-wrap">
            <div className="flex items-center gap-1 text-center sm:text-left">
              <span>
                Issues or feature requests? Add them on
                <a
                  href="https://github.com/gearsandcode/cartales-ai/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center"
                >
                  GitHub
                </a>
                .
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
