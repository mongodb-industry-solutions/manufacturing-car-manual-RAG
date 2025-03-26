import { GeistSans } from 'geist/font/sans';

export const metadata = {
  title: 'Car Manual Search',
  description: 'Search your vehicle manual using Vector search',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body>{children}</body>
    </html>
  );
}
