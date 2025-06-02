import { GeistSans } from 'geist/font/sans';

// Metadata hardcoded for Car Manual Explorer
export const metadata = {
  title: 'Car Manual Explorer | MongoDB Demo',
  description: 'AI-powered car manual search and exploration system with MongoDB vector search and RAG capabilities',
  keywords: 'Car Manual, Automotive, MongoDB, Vector Search, RAG, Technical Documentation',
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
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
