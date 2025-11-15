const RAG_STORE_CACHE = new Map<string, { name: string; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function getCachedRagStore(
  partnerId: string,
  db: any
): Promise<string> {
  const cached = RAG_STORE_CACHE.get(partnerId);
  
  if (cached && cached.expires > Date.now()) {
    console.log('✅ RAG store cache hit for partner:', partnerId);
    return cached.name;
  }
  
  console.log('🔍 RAG store cache miss, fetching from DB');
  
  const storesSnapshot = await db
    .collection(`partners/${partnerId}/fileSearchStores`)
    .where('state', '==', 'ACTIVE')
    .limit(1)
    .get();
  
  if (storesSnapshot.empty) {
    throw new Error('No active RAG store found');
  }
  
  const ragStoreName = storesSnapshot.docs[0].data().name;
  
  RAG_STORE_CACHE.set(partnerId, {
    name: ragStoreName,
    expires: Date.now() + CACHE_TTL
  });
  
  console.log('✅ RAG store cached:', ragStoreName);
  
  return ragStoreName;
}

export function clearRagStoreCache(partnerId?: string) {
  if (partnerId) {
    RAG_STORE_CACHE.delete(partnerId);
  } else {
    RAG_STORE_CACHE.clear();
  }
}