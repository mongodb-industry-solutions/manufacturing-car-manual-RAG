import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    // Paths to look for configuration files
    const configDirs = [
      path.resolve(process.cwd(), '../config'),
      path.resolve(process.cwd(), 'config'),
      path.resolve(process.cwd(), '../examples'),
      path.resolve(process.cwd(), 'examples'),
    ];
    
    // Get the current active configuration file path
    const mainConfigPath = path.resolve(process.cwd(), '../config/app.config.json');
    const altMainConfigPath = path.resolve(process.cwd(), 'config/app.config.json');
    
    let currentConfig = '';
    if (fs.existsSync(mainConfigPath)) {
      currentConfig = mainConfigPath;
    } else if (fs.existsSync(altMainConfigPath)) {
      currentConfig = altMainConfigPath;
    }
    
    // Find all JSON configuration files in the specified directories
    const configurations = [];
    const processedConfigs = new Set(); // To track configurations and avoid duplicates
    
    for (const dir of configDirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          if (file.endsWith('.json') && file.includes('config')) {
            const configPath = path.join(dir, file);
            
            // Skip if we've already processed this exact file path
            if (processedConfigs.has(configPath)) {
              continue;
            }
            
            try {
              const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
              
              if (configData.application && configData.industry) {
                // Create a unique identifier for this config based on industry and name
                const configId = `${configData.industry.name || configData.application.industry}-${configData.application.name}`.toLowerCase();
                
                // Skip if we've already processed a config with the same name/industry
                if (processedConfigs.has(configId)) {
                  continue;
                }
                
                processedConfigs.add(configId); // Mark this configuration as processed
                processedConfigs.add(configPath); // Also mark this file path as processed
                
                configurations.push({
                  name: configData.application.name || file,
                  path: configPath,
                  industry: configData.industry.name || configData.application.industry || 'Unknown',
                  description: configData.application.description || '',
                });
              }
            } catch (error) {
              console.error(`Error parsing ${configPath}:`, error);
              // Skip invalid config files
            }
          }
        }
      }
    }
    
    // Make sure Car Manual config is included if it exists
    const carManualConfigPath = path.resolve(process.cwd(), 'config/car-manual-config.json');
    const altCarManualConfigPath = path.resolve(process.cwd(), '../config/car-manual-config.json');
    
    let carManualConfig = null;
    if (fs.existsSync(carManualConfigPath) && !processedConfigs.has(carManualConfigPath)) {
      carManualConfig = carManualConfigPath;
    } else if (fs.existsSync(altCarManualConfigPath) && !processedConfigs.has(altCarManualConfigPath)) {
      carManualConfig = altCarManualConfigPath;
    }
    
    if (carManualConfig) {
      try {
        const configData = JSON.parse(fs.readFileSync(carManualConfig, 'utf8'));
        configurations.push({
          name: configData.application.name || 'Car Manual Explorer',
          path: carManualConfig,
          industry: configData.industry.name || configData.application.industry || 'Automotive',
          description: configData.application.description || 'Explore automotive maintenance manuals',
        });
      } catch (error) {
        console.error(`Error parsing car manual config:`, error);
      }
    }
    
    return NextResponse.json({
      configurations,
      currentConfig,
    });
  } catch (error) {
    console.error('Error getting configurations:', error);
    
    return new NextResponse(
      JSON.stringify({ error: 'Failed to get configurations' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}