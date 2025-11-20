import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxy(request, params.path);
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxy(request, params.path);
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxy(request, params.path);
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxy(request, params.path);
}

async function handleProxy(request: NextRequest, pathSegments: string[]) {
  try {
    // Reconstruct the path
    const path = pathSegments.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    
    // Get backend URL from environment (server-side only)
    // Default to localhost for local dev if not set
    const backendBaseUrl = process.env.INTERNAL_API_URL || 'http://localhost:8000';
    
    // Construct target URL
    const targetUrl = `${backendBaseUrl}/api/v1/${path}${searchParams ? `?${searchParams}` : ''}`;
    
    console.log(`🔀 Proxying ${request.method} request to: ${targetUrl}`);
    
    // Prepare fetch options
    const headers = new Headers(request.headers);
    
    // Remove host header to avoid confusion
    headers.delete('host');
    headers.delete('connection');
    
    const fetchOptions: RequestInit = {
      method: request.method,
      headers: headers,
    };

    // Add body for non-GET/HEAD requests
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        fetchOptions.body = JSON.stringify(await request.json());
      } else if (contentType?.includes('multipart/form-data')) {
        fetchOptions.body = await request.formData();
      } else {
        fetchOptions.body = await request.text();
      }
    }

    // Forward request to backend
    const response = await fetch(targetUrl, fetchOptions);

    // Handle binary responses (images, pdfs)
    const responseContentType = response.headers.get('content-type');
    if (responseContentType && (
        responseContentType.startsWith('image/') || 
        responseContentType.startsWith('application/pdf') ||
        responseContentType.startsWith('application/octet-stream')
    )) {
      const blob = await response.blob();
      const newHeaders = new Headers(response.headers);
      return new NextResponse(blob, {
        status: response.status,
        headers: newHeaders
      });
    }

    // Handle JSON/Text responses
    const data = await response.text();
    
    // Create new response
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': responseContentType || 'application/json',
      }
    });

  } catch (error: any) {
    console.error('❌ Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request', details: error.message },
      { status: 500 }
    );
  }
}

