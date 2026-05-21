import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Operative',
  description: 'Multi-agent AI task runner',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body style={{ backgroundColor: '#1F2B2D' }}>{children}</body>
    </html>
  );
}
