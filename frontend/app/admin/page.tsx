'use client';

import React, { useState, useEffect } from 'react';
import { useConfig } from '@/contexts/ConfigContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { palette } from '@leafygreen-ui/palette';

interface ConfigOption {
  name: string;
  path: string;
  industry: string;
  description: string;
}

const AdminPage = () => {
  const { config } = useConfig();
  const router = useRouter();
  const [availableConfigs, setAvailableConfigs] = useState<ConfigOption[]>([]);
  const [currentConfig, setCurrentConfig] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch the list of available configuration files
    const fetchConfigs = async () => {
      try {
        const response = await fetch('/api/admin/configurations');
        if (response.ok) {
          const data = await response.json();
          setAvailableConfigs(data.configurations);
          setCurrentConfig(data.currentConfig);
        } else {
          setMessage('Failed to load configurations');
        }
      } catch (error) {
        console.error('Error fetching configurations:', error);
        setMessage('Error loading configurations');
      } finally {
        setLoading(false);
      }
    };

    fetchConfigs();
  }, []);

  const applyConfiguration = async (configPath: string) => {
    try {
      setLoading(true);
      setMessage('Applying configuration...');
      
      const response = await fetch('/api/admin/apply-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configPath }),
      });

      if (response.ok) {
        setMessage('Configuration applied successfully. Reloading...');
        // After applying the configuration, reload the page to reflect changes
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        const error = await response.json();
        setMessage(`Failed to apply configuration: ${error.message}`);
      }
    } catch (error) {
      console.error('Error applying configuration:', error);
      setMessage('Error applying configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ color: palette.blue.dark1 }}>Configuration Manager</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{ 
          color: palette.blue.dark1, 
          textDecoration: 'none', 
          display: 'inline-block', 
          marginBottom: '1rem' 
        }}>
          ← Back to Home
        </Link>
        <p>
          Select a configuration to customize the application for a specific industry.
          This will update the UI, terminology, and database connections.
        </p>
      </div>

      {message && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: message.includes('Error') || message.includes('Failed') ? palette.red.light2 : palette.green.light2,
          borderRadius: '4px',
          marginBottom: '1rem' 
        }}>
          {message}
        </div>
      )}

      {loading ? (
        <div>Loading available configurations...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {availableConfigs.map((config) => (
            <div 
              key={config.path} 
              style={{ 
                border: `1px solid ${currentConfig === config.path ? palette.blue.base : palette.gray.light2}`,
                borderRadius: '8px',
                padding: '1.5rem',
                cursor: 'pointer',
                backgroundColor: currentConfig === config.path ? palette.blue.light2 : 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
              onClick={() => applyConfiguration(config.path)}
            >
              <h3 style={{ margin: '0 0 0.5rem 0', color: palette.gray.dark2 }}>{config.name}</h3>
              <div style={{ 
                display: 'inline-block', 
                padding: '0.25rem 0.5rem', 
                backgroundColor: palette.gray.light2, 
                borderRadius: '4px',
                fontSize: '0.8rem',
                marginBottom: '0.5rem'
              }}>
                {config.industry}
              </div>
              <p style={{ margin: '0.5rem 0', color: palette.gray.dark1 }}>{config.description}</p>
              {currentConfig === config.path && (
                <div style={{ 
                  display: 'inline-block', 
                  padding: '0.25rem 0.5rem',
                  backgroundColor: palette.blue.base,
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  marginTop: '0.5rem'
                }}>
                  Active
                </div>
              )}
              {currentConfig !== config.path && (
                <button 
                  style={{ 
                    marginTop: '0.5rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: palette.gray.light3,
                    border: `1px solid ${palette.gray.light1}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    color: palette.gray.dark1
                  }}
                >
                  Apply
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPage;