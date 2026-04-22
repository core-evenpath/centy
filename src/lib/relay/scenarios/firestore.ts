import { getAdminDb } from '@/lib/firebase-admin';
import type { Scenario, ScenarioInput } from './types';

const collectionPath = (partnerId: string) => `partners/${partnerId}/scenarios`;

export async function listScenarios(partnerId: string): Promise<Scenario[]> {
  const db = getAdminDb();
  const snap = await db
    .collection(collectionPath(partnerId))
    .orderBy('updatedAt', 'desc')
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Scenario, 'id'>) }));
}

export async function getScenario(
  partnerId: string,
  scenarioId: string,
): Promise<Scenario | null> {
  const db = getAdminDb();
  const doc = await db.collection(collectionPath(partnerId)).doc(scenarioId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as Omit<Scenario, 'id'>) };
}

export async function createScenario(
  partnerId: string,
  input: ScenarioInput,
): Promise<Scenario> {
  const db = getAdminDb();
  const now = Date.now();
  const ref = db.collection(collectionPath(partnerId)).doc();
  const scenario: Scenario = {
    ...input,
    id: ref.id,
    partnerId,
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(scenario);
  return scenario;
}

export async function updateScenario(
  partnerId: string,
  scenarioId: string,
  patch: Partial<ScenarioInput>,
): Promise<void> {
  const db = getAdminDb();
  await db
    .collection(collectionPath(partnerId))
    .doc(scenarioId)
    .set({ ...patch, updatedAt: Date.now() }, { merge: true });
}

export async function deleteScenario(
  partnerId: string,
  scenarioId: string,
): Promise<void> {
  const db = getAdminDb();
  await db.collection(collectionPath(partnerId)).doc(scenarioId).delete();
}
