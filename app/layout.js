import { Space_Grotesk, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });
const ibmPlexSans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata = {
  title: 'HIMYANTRA — Antarctic Navigation Intelligence',
  description:
    'AI-powered Antarctic environmental intelligence for safer and more fuel-efficient research-vessel navigation.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${ibmPlexSans.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans bg-polar-bg text-[#dbe7ee] antialiased">{children}</body>
    </html>
  );
}
