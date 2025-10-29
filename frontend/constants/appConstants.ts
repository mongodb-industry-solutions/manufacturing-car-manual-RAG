// Application Constants - Hardcoded for Car Manual Explorer

// Application metadata
export const APP_NAME = "Car Manual Explorer";
export const APP_DESCRIPTION = "";
export const APP_DESCRIPTION_DETAILED = "MongoDB's Unified Data Platform enables flexible document storage with multiple retrieval pipelines working together: smart chunking, full-text search, vector embeddings, knowledge graphs, multimodal search, and Voyage AI reranking.";
export const APP_INDUSTRY = "automotive";

// Branding
export const BRANDING = {
  title: "Context-Aware Hybrid RAG for Car Manual",
  subtitle: "",
  tagline: "",
  primaryColor: "#3D89F5",
  secondaryColor: "#001E2B",
  accentColor: "#00ED64",
  logoPath: "/mongo.png"
};

// Terminology - Car manual specific
export const TERMINOLOGY = {
  manual: "Car Manual",
  chunk: "Section",
  document: "Manual",
  search: "Search",
  browse: "Browse Chunks"
};

// Industry metadata
export const INDUSTRY_METADATA = {
  name: "Automotive",
  contentTypes: [
    "procedure",
    "warning",
    "specification",
    "troubleshooting",
    "maintenance",
    "reference",
    "diagnostics"
  ],
  systems: [
    "engine",
    "transmission",
    "brakes",
    "electrical",
    "suspension",
    "steering",
    "fuel",
    "cooling",
    "interior",
    "safety"
  ]
};

// Document settings
export const DOCUMENT_CONFIG = {
  types: ["manual", "maintenance", "troubleshooting", "specifications"],
  defaultType: "manual",
  path: "/public"
};

// Features configuration
export const FEATURES = {
  search: {
    methods: ["vector", "text", "hybrid"],
    defaultMethod: "text"
  },
  chunks: {
    displayLimit: 20,
    infiniteScroll: true
  }
};

// Database configuration
export const DATABASE_CONFIG = {
  collections: {
    chunks: "manual_chunks"
  },
  indices: {
    vector: "manual_vector_search_index",
    text: "manual_text_search_index"
  }
};

// API configuration
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1"
};