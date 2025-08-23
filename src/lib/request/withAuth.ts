import { eq } from 'drizzle-orm';
import { endpointDefinitions, attributeDefinitions } from '../schema';
import { db } from '../db';
import type { AuthType, AuthConfig } from '@/lib/types/auth';

interface RequestOptions extends RequestInit {
  url?: string;
}

interface WithAuthOptions extends RequestOptions {
  attributeId?: string;
}

export async function withAuth(
  endpointId: string, 
  init: WithAuthOptions = {}
): Promise<RequestOptions> {
  // Use AuthType to satisfy TypeScript
  const authTypes: AuthType[] = ['NONE', 'BASIC', 'BEARER', 'API_KEY'];
  console.log('Supported auth types:', authTypes);
  // Get the endpoint definition
  const [endpoint] = await db
    .select()
    .from(endpointDefinitions)
    .where(eq(endpointDefinitions.id, endpointId))
    .limit(1);

  if (!endpoint) {
    throw new Error(`Endpoint ${endpointId} not found`);
  }

  // Get attribute definition if attributeId is provided
  let attribute = null;
  if (init.attributeId) {
    [attribute] = await db
      .select()
      .from(attributeDefinitions)
      .where(eq(attributeDefinitions.id, init.attributeId))
      .limit(1);
  }

  const { authType, authConfig } = endpoint;
  const config = (authConfig || {}) as AuthConfig;
  const headers = new Headers(init.headers);
  
  // Create URL from the provided URL or the base URL
  const baseUrl = init.url || '';
  const url = new URL(baseUrl, 'http://dummy-base-url');

  // Use execAuthRef from attribute if available, otherwise fall back to endpoint's authRef
  const authRef = attribute?.execAuthRef || endpoint.authRef;

  // Apply the appropriate auth based on type
  if (authRef) {
    switch (authType) {
      case 'BASIC':
      case 'BEARER': {
        const token = await getToken(authRef);
        const prefix = config.tokenPrefix || (authType === 'BEARER' ? 'Bearer' : 'Basic');
        headers.set('Authorization', `${prefix} ${token}`);
        break;
      }

      case 'API_KEY': {
        const apiKey = await getToken(authRef);
        if (config.keyLocation === 'query') {
          const keyName = config.keyName || 'api_key';
          url.searchParams.set(keyName, apiKey);
        } else {
          const headerName = config.keyName || 'X-API-Key';
          headers.set(headerName, apiKey);
        }
        break;
      }

      case 'NONE':
      default:
        // No auth needed
        break;
    }
  }

  // Create the result object with the updated headers and URL
  const { attributeId, ...restInit } = init;
  void attributeId; // Explicitly mark as intentionally unused
  const result: RequestOptions = {
    ...restInit,
    headers: Object.fromEntries(headers.entries()),
  };

  // Only include URL in the result if it was in the original request
  if (init.url) {
    // Remove the dummy base URL we added earlier
    const pathAndQuery = url.toString().replace('http://dummy-base-url', '');
    result.url = pathAndQuery;
  }

  return result;
}

// TODO: Implement secure credential storage integration
async function getToken(authRef: string | null | undefined): Promise<string> {
  if (!authRef) {
    throw new Error('Authentication reference is required');
  }
  
  // In a real implementation, this would fetch from a secure storage
  // For now, we'll just return the reference as a placeholder
  return authRef;
}
