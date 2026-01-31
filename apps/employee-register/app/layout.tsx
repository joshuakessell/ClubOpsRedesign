import './globals.css';
import { Space_Grotesk } from 'next/font/google';
import { AppProviders } from './components/app-providers';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });

export const metadata = {
  title: 'ClubOps Employee Register',
  description: 'Register interface for staff operations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body className="min-h-screen font-[var(--font-space)]">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
