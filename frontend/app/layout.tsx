import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bingo Multiplayer',
  description: 'Real-time multiplayer bingo game',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-wood-light min-h-screen antialiased">{children}</body>
    </html>
  );
}