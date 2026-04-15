/**
 * 🐸 Planta y Raiz — Offline Persistence Layer
 * IndexedDB via localforage para resiliência offline
 * Estratégia: Stale-While-Revalidate para tabelas críticas
 */

import localforage from "localforage";

// Stores dedicados para cada entidade crítica
const prescriptionsStore = localforage.createInstance({
  name: "plantayraiz",
  storeName: "prescriptions",
  description: "Receitas médicas offline",
});

const appointmentsStore = localforage.createInstance({
  name: "plantayraiz",
  storeName: "appointments",
  description: "Agendamentos offline",
});

const clinicalNotesStore = localforage.createInstance({
  name: "plantayraiz",
  storeName: "clinical_notes",
  description: "Notas clínicas offline",
});

const metaStore = localforage.createInstance({
  name: "plantayraiz",
  storeName: "meta",
  description: "Metadata de sincronização",
});

export type OfflineStoreName = "prescriptions" | "appointments" | "clinical_notes";

const STORES: Record<OfflineStoreName, LocalForageDbMethodsCore> = {
  prescriptions: prescriptionsStore,
  appointments: appointmentsStore,
  clinical_notes: clinicalNotesStore,
};

/**
 * Salva dados no IndexedDB (cache local)
 */
export async function saveOffline<T>(
  store: OfflineStoreName,
  key: string,
  data: T
): Promise<void> {
  try {
    await STORES[store].setItem(key, data);
    await metaStore.setItem(`${store}:${key}:timestamp`, Date.now());
  } catch (err) {
    console.error(`[Offline] Erro ao salvar ${store}/${key}:`, err);
  }
}

/**
 * Recupera dados do IndexedDB
 */
export async function getOffline<T>(
  store: OfflineStoreName,
  key: string
): Promise<T | null> {
  try {
    return await STORES[store].getItem<T>(key);
  } catch (err) {
    console.error(`[Offline] Erro ao ler ${store}/${key}:`, err);
    return null;
  }
}

/**
 * Salva uma lista inteira no cache (ex: todas as prescriptions de um user)
 */
export async function saveOfflineList<T>(
  store: OfflineStoreName,
  userId: string,
  data: T[]
): Promise<void> {
  await saveOffline(store, `list:${userId}`, data);
}

/**
 * Recupera lista do cache
 */
export async function getOfflineList<T>(
  store: OfflineStoreName,
  userId: string
): Promise<T[]> {
  return (await getOffline<T[]>(store, `list:${userId}`)) ?? [];
}

/**
 * Verifica se o cache está fresco (< maxAge ms)
 */
export async function isCacheFresh(
  store: OfflineStoreName,
  key: string,
  maxAgeMs: number = 5 * 60 * 1000 // 5 min default
): Promise<boolean> {
  const ts = await metaStore.getItem<number>(`${store}:${key}:timestamp`);
  if (!ts) return false;
  return Date.now() - ts < maxAgeMs;
}

/**
 * Stale-While-Revalidate: retorna cache imediato, revalida em background
 */
export async function staleWhileRevalidate<T>(
  store: OfflineStoreName,
  key: string,
  fetchFn: () => Promise<T>,
  maxAgeMs?: number
): Promise<T> {
  const cached = await getOffline<T>(store, key);

  // Se temos cache, retorna imediatamente e revalida em background
  if (cached !== null) {
    const fresh = await isCacheFresh(store, key, maxAgeMs);
    if (!fresh) {
      // Revalidar em background (fire-and-forget)
      fetchFn()
        .then((data) => saveOffline(store, key, data))
        .catch(() => {}); // silencia erros de rede
    }
    return cached;
  }

  // Sem cache: buscar da rede
  try {
    const data = await fetchFn();
    await saveOffline(store, key, data);
    return data;
  } catch {
    // Sem rede e sem cache — retorna array vazio como fallback
    return [] as unknown as T;
  }
}

/**
 * Limpa todo o cache offline
 */
export async function clearOfflineStore(store: OfflineStoreName): Promise<void> {
  await STORES[store].clear();
}
