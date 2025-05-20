'use client';

/**
 * Configuration context provider for the application
 * Provides configuration values to all components
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppConfig, fetchConfig } from '@/lib/configLoader';

// Default configuration for client-side initial state
const defaultConfig: AppConfig = {
  application: {
    name: "Technical Manual Explorer",
    industry: "generic",
    description: "Technical documentation explorer powered by MongoDB"
  },
  branding: {
    title: "Technical Manual Explorer",
    subtitle: "Powered by MongoDB Atlas",
    primaryColor: "#00ED64",
    secondaryColor: "#13AA52",
    accentColor: "#3D89F5",
    logoPath: "/mongo.png"
  },
  document: {
    types: ["manual"],
    defaultType: "manual",
    path: "/documents",
    defaultDocument: "document.pdf"
  },
  industry: {
    name: "Generic",
    icon: "Document",
    terminology: {
      manual: "Manual",
      chunk: "Section",
      document: "Document",
      search: "Search",
      browse: "Browse"
    },
    metadata: {
      contentTypes: ["generic"],
      systems: ["general"]
    }
  },
  features: {
    search: {
      methods: ["vector", "text", "hybrid"],
      defaultMethod: "hybrid"
    },
    chunks: {
      displayLimit: 20,
      infiniteScroll: true
    },
    pdfViewer: {
      enabled: true,
      defaultScale: 1.2
    }
  },
  database: {
    collections: {
      chunks: "documents"
    },
    indices: {
      vector: "vector_index",
      text: "text_search_index"
    }
  }
};

// Create a context with default values
const ConfigContext = createContext<{
  config: AppConfig;
  isLoading: boolean;
  error: string | null;
}>({
  config: defaultConfig,
  isLoading: true,
  error: null,
});

// Provider component
export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        const loadedConfig = await fetchConfig();
        setConfig(loadedConfig);
        setError(null);
      } catch (err) {
        setError('Failed to load configuration. Using default values.');
        console.error('Configuration loading error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  return (
    <ConfigContext.Provider value={{ config, isLoading, error }}>
      {children}
    </ConfigContext.Provider>
  );
};

// Custom hook for using the config context
export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

// Convenience hooks for accessing specific sections
export const useAppConfig = () => {
  const { config } = useConfig();
  return config.application;
};

export const useBrandingConfig = () => {
  const { config } = useConfig();
  return config.branding;
};

export const useDocumentConfig = () => {
  const { config } = useConfig();
  return config.document;
};

export const useIndustryConfig = () => {
  const { config } = useConfig();
  return config.industry;
};

export const useTerminology = () => {
  const { config } = useConfig();
  return config.industry.terminology;
};

export const useFeaturesConfig = () => {
  const { config } = useConfig();
  return config.features;
};

export const useDatabaseConfig = () => {
  const { config } = useConfig();
  return config.database;
};