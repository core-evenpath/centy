import path from "path";
import PDFParser from "pdf2json";

import { googleAI } from "@genkit-ai/google-genai";
import { FieldValue } from "firebase-admin/firestore";
import { defineFirestoreRetriever } from "@genkit-ai/firebase";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import { ai } from "./genkit";
import { db } from "@/lib/firebase-admin";

export const RAGINDEX_COLLECTION_NAME = "centy_documents";

const embedder = googleAI.embedder("gemini-embedding-001", {
  outputDimensionality: 768,
});
// ---------------------------------------------------------------------------
export const firestoreRetriever = (collectionName: string) =>
  defineFirestoreRetriever(ai, {
    name: "exampleRetriever",
    firestore: db,
    collection: collectionName,
    contentField: "text", // Field containing document content
    vectorField: "embedding", // Field containing vector embeddings
    embedder,
    distanceMeasure: "COSINE", // Default is 'COSINE'; other options: 'EUCLIDEAN', 'DOT_PRODUCT'
  });

// -- TO CREATE firestore index --
// gcloud firestore indexes composite create
// --project=flow-factory-tmsfh
// --collection-group=centy_documents
// --query-scope=COLLECTION
// --field-config=vector-config='{"dimension":"768","flat": "{}"}',field-path=embedding

// -- function to get text from web urls
// export async function fetchTextFromWeb(url: string) {
//   const html = await fetch(url).then((res) => res.text());
//   const doc = new JSDOM(html, { url });
//   const reader = new Readability(doc.window.document);
//   const article = reader.parse();
//   return article?.textContent || "";
// }

export async function indexPdfFile(
  collectionName: string,
  partnerId: string,
  fileId: string,
  filePath: string
) {
  filePath = path.resolve(filePath);

  // Read the PDF.
  const pdfTxt = await extractPageTextFromPdf(filePath);

  // Divide the PDF text into segments.
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1024 * 2,
    chunkOverlap: 128,
  });
  const cleanedPdfText = pdfTxt.text
    .replace(/^\s+$/g, "")
    .replace(/\s{10,}/g, " ");
  const chunks = await splitter.splitText(
    // remove empty lines and too many spaces
    cleanedPdfText
  );

  // TODO
  // fileId should be unique per partner per file
  // Add chunks to the index.
  await indexToFirestore(collectionName, partnerId, fileId, chunks);
}

export async function indexToFirestore(
  collectionName: string,
  partnerId: string,
  fileId: string,
  data: string[]
) {
  // Change these values to match your Firestore config/schema
  const indexConfig = {
    collection: collectionName,
    contentField: "text",
    vectorField: "embedding",
    embedder,
  };

  console.log(`--- indexing chunks = ${data.length}`);
  for (const text of data) {
    console.log(`--- indexing text.length = ${text.length}`);
    const embedding = (
      await ai.embed({
        embedder: indexConfig.embedder,
        content: text,
      })
    )[0].embedding;
    await db.collection(indexConfig.collection).add({
      fileId,
      partnerId,
      [indexConfig.vectorField]: FieldValue.vector(embedding),
      [indexConfig.contentField]: text,
    });
  }
}

export async function deleteAllRagIndexDocs(collectionName: string) {
  const indexConfig = {
    collection: collectionName,
    contentField: "text",
    vectorField: "embedding",
    embedder,
  };

  const query = db.collection(indexConfig.collection);
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    // When there are no documents left, we are done
    return;
  }

  // Delete documents in a batch
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Recurse on the next process tick, to avoid
  // exploding the stack.
  process.nextTick(() => {
    deleteAllRagIndexDocs(collectionName);
  });
}

export async function deleteRagIndexDocs(
  collectionName: string,
  fileId: string
) {
  const indexConfig = {
    collection: collectionName,
    contentField: "text",
    vectorField: "embedding",
    embedder,
  };

  const query = db
    .collection(indexConfig.collection)
    .where("fileId", "==", fileId);
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    // When there are no documents left, we are done
    return;
  }

  // Delete documents in a batch
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Recurse on the next process tick, to avoid
  // exploding the stack.
  process.nextTick(() => {
    deleteRagIndexDocs(collectionName, fileId);
  });
}

export async function extractPageTextFromPdf(filePath: string) {
  const pdfParser = new PDFParser(null, true, "");

  const texts: Promise<{ success: boolean; text: string }> = new Promise(
    (resolve, reject) => {
      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        const text = pdfParser.getRawTextContent();
        resolve({ success: true, text });
      });
      pdfParser.on("pdfParser_dataError", (errData) => {
        reject({ success: false, text: `${errData}` });
      });
      pdfParser.loadPDF(filePath);
    }
  );
  return texts;
}
