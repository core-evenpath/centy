import { RAGINDEX_COLLECTION_NAME } from "@/ai/fireRagSetup";
import { db } from "@/lib/firebase-admin";

async function addThesisDoc(
  fileId: string,
  partnerId: string,
  publicUrl: string,
  thesisInfo: any,
  metaData: any
) {
  const resp = await db.collection(`thesis-docs/${partnerId}/docs`).add({
    fileId,
    url: publicUrl,
    thesisInfo,
    metaData: metaData ?? {},
    status: "processing",
    createdAt: new Date().toISOString(),
  });
  return resp;
}

async function getFirstRagIndex(fileId: string) {
  const ragChunks = await db
    .collection(RAGINDEX_COLLECTION_NAME)
    .where("fileId", "==", fileId)
    .limit(1)
    .get();
  return ragChunks;
}

async function getPartnerThesisDocs(partnerId: string) {
  // Get partner docs
  const partnerDocsCollection = await db
    .collection(`thesis-docs/${partnerId}/docs`)
    .get();

  if (partnerDocsCollection.empty) {
    return [];
  }

  const partnerDocs = partnerDocsCollection.docs.map((snap) => snap.data());
  return partnerDocs;
}

async function getPartnerRagIndexDocs(partnerId: string) {
  const ragDocsForPartner = await db
    .collection(`thesis-docs/${partnerId}/docs`)
    .listDocuments();
  return ragDocsForPartner;
}

export {
  addThesisDoc,
  getFirstRagIndex,
  getPartnerThesisDocs,
  getPartnerRagIndexDocs,
};
