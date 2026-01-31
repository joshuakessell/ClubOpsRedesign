import './globals.css';
import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });

export const metadata = {
  title: 'ClubOps Office Dashboard',
  description: 'Operations dashboard for ClubOps managers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body className="min-h-screen font-[var(--font-space)]">
        {children}
      </body>
    </html>
  );
}
