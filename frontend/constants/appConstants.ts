// Application Constants - Hardcoded for Car Manual Explorer

// Application metadata
export const APP_NAME = "Car Manual Explorer";
export const APP_DESCRIPTION = "MongoDB-powered car manual search and exploration system";
export const APP_INDUSTRY = "automotive";

// Branding
export const BRANDING = {
  title: "Technical Car Manual Explorer",
  subtitle: "Powered by MongoDB Atlas",
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
  search: "Search Manuals",
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
  path: "/public",
  defaultDocument: "car-manual.pdf"
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
  },
  pdfViewer: {
    enabled: true,
    defaultScale: 1.2
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