import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter_Tight } from 'next/font/google';
import './globals.css';

/* Allya speaks in Fraunces; the interface speaks in Inter Tight. Both are
   loaded as variable fonts — the design leans on fractional weights
   (420, 460, 480) that a static cut can't hit. */
const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['opsz'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-serif',
});

const interTight = Inter_Tight({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Ask Allya — ZeroTo10',
  description:
    'A live preview of Allya, the AI execution engine behind ZeroTo10. Ask her about the product, the market, the model and the plan.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${interTight.variable}`}>
      <body>{children}</body>
    </html>
  );
}
