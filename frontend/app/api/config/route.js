/**
 * API route for fetching application configuration
 */
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    const configPath = path.resolve(process.cwd(), '../config/app.config.json');
    const altConfigPath = path.resolve(process.cwd(), 'config/app.config.json');
    
    let configData;
    
    if (fs.existsSync(configPath)) {
      const fileContents = fs.readFileSync(configPath, 'utf8');
      configData = JSON.parse(fileContents);
    } else if (fs.existsSync(altConfigPath)) {
      const fileContents = fs.readFileSync(altConfigPath, 'utf8');
      configData = JSON.parse(fileContents);
    } else {
      // If config file doesn't exist, return 404
      return new NextResponse(
        JSON.stringify({ error: 'Configuration file not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return NextResponse.json(configData);
  } catch (error) {
    console.error('Error loading configuration:', error);
    
    return new NextResponse(
      JSON.stringify({ error: 'Failed to load configuration' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}