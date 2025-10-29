import { GeistSans } from 'geist/font/sans';

// Metadata hardcoded for Car Manual Explorer
export const metadata = {
  title: 'Car Manual Explorer | Document Intelligence Platform',
  description:
    'Intelligent search and retrieval for automotive technical documentation powered by MongoDB Atlas. Features smart chunking, full-text search, vector embeddings, knowledge graphs, multimodal search, and Voyage AI reranking.',
  keywords:
    'Car Manual, Automotive, MongoDB Atlas, Vector Search, RAG, GraphRAG, Multimodal Search, Knowledge Graph, Voyage AI, Document Intelligence, Technical Documentation, Smart Chunking',
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
