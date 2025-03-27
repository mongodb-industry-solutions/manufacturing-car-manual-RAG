import { GeistSans } from 'geist/font/sans';

export const metadata = {
  title: 'Technical Car Manual Explorer | MongoDB Demo',
  description: 'Explore technical car manuals with MongoDB vector search and RAG capabilities',
  keywords: 'MongoDB, Vector Search, RAG, Technical Documentation, Car Manuals',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={GeistSans.className}>
      <head>
        <link 
          rel="stylesheet" 
          href="https://d2va9gm4j17fy9.cloudfront.net/fonts/euclid-circular/euclid-circular.css" 
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
