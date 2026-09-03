import './globals.css';

export const metadata = {
  title: 'HIMYANTRA — Antarctic Navigation Intelligence',
  description:
    'AI-powered Antarctic environmental intelligence for safer and more fuel-efficient research-vessel navigation.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-polar-bg text-[#dbe7ee] antialiased">{children}</body>
    </html>
  );
}
