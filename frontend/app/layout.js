import { GeistSans } from 'geist/font/sans';
import { ConfigProvider } from '@/contexts/ConfigContext';

// Metadata will be dynamic, but we need to provide defaults for build time
export const metadata = {
  title: 'Technical Manual Explorer | MongoDB Demo',
  description: 'Explore technical documentation with MongoDB vector search and RAG capabilities',
  keywords: 'MongoDB, Vector Search, RAG, Technical Documentation',
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
        <ConfigProvider>
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
