export function getRelayCORSHeaders(origin?: string, embedDomain?: string): Record<string, string> {
  const allowedOrigin =
    embedDomain && origin && (origin.includes(embedDomain) || origin === embedDomain)
      ? origin
      : '*';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function relayOptionsResponse(origin?: string, embedDomain?: string): Response {
  return new Response(null, {
    status: 204,
    headers: getRelayCORSHeaders(origin, embedDomain),
  });
}
