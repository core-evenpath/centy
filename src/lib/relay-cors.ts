// Relay CORS helpers for cross-origin widget embedding

export function getRelayCORSHeaders(embedDomain?: string): HeadersInit {
  const origin = embedDomain ? `https://${embedDomain}` : '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Relay-Widget-Id',
    'Access-Control-Max-Age': '86400',
  };
}

export function relayOptionsResponse(embedDomain?: string): Response {
  return new Response(null, {
    status: 204,
    headers: getRelayCORSHeaders(embedDomain),
  });
}
