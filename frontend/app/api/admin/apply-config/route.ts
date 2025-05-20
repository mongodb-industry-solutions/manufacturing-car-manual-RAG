import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { configPath } = body;
    
    if (!configPath) {
      return new NextResponse(
        JSON.stringify({ error: 'Configuration path is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Make sure the config file exists
    if (!fs.existsSync(configPath)) {
      return new NextResponse(
        JSON.stringify({ error: 'Configuration file not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Read the selected configuration file
    const configContent = fs.readFileSync(configPath, 'utf8');
    let configData;
    
    try {
      configData = JSON.parse(configContent);
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid configuration file format' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Paths to save the main configuration file
    const mainConfigPath = path.resolve(process.cwd(), '../config/app.config.json');
    const altMainConfigPath = path.resolve(process.cwd(), 'config/app.config.json');
    
    // Determine which path to use
    let targetConfigPath;
    if (fs.existsSync(mainConfigPath) || fs.existsSync(path.dirname(mainConfigPath))) {
      targetConfigPath = mainConfigPath;
    } else {
      // Ensure the directory exists
      const configDir = path.dirname(altMainConfigPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      targetConfigPath = altMainConfigPath;
    }
    
    // Write the selected configuration to the main config file
    fs.writeFileSync(targetConfigPath, JSON.stringify(configData, null, 2), 'utf8');
    
    return NextResponse.json({
      success: true,
      message: 'Configuration applied successfully',
      appliedConfig: configPath,
    });
  } catch (error) {
    console.error('Error applying configuration:', error);
    
    return new NextResponse(
      JSON.stringify({ error: 'Failed to apply configuration' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}