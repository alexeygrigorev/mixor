export type StoredObservationPhoto = { name: string; type: string; blob: Blob };
export type StoredObservation = {
  id: string;
  title: string;
  note: string;
  locationLabel: string;
  observedAt: string;
  createdAt: string;
  status: "local_only";
  photos: StoredObservationPhoto[];
};
const DB_NAME = "mixor-local-demo";
const STORE_NAME = "observations";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window))
      return reject(
        new Error(
          "Браузер не разрешает локальное хранилище. Запись не сохранена.",
        ),
      );
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME))
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          "Не удалось открыть локальное хранилище. Запись не сохранена.",
        ),
      );
    request.onblocked = () =>
      reject(
        new Error("Хранилище занято другой вкладкой. Закройте её и повторите."),
      );
  });
}
export async function listObservations(): Promise<StoredObservation[]> {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).getAll();
      tx.oncomplete = () =>
        resolve(
          (req.result as StoredObservation[]).sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt),
          ),
        );
      tx.onerror = tx.onabort = () =>
        reject(new Error("Не удалось прочитать журнал."));
    });
  } finally {
    db.close();
  }
}
export async function saveObservation(
  record: StoredObservation,
): Promise<void> {
  if (
    !record.id ||
    !record.title.trim() ||
    record.photos.some((photo) => !(photo.blob instanceof Blob))
  )
    throw new Error("Проверьте название и файлы записи.");
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = tx.onabort = () =>
        reject(
          new Error(
            tx.error?.name === "QuotaExceededError"
              ? "Не хватило места. Запись не сохранена; освободите место и повторите."
              : "Запись не сохранена. Проверьте разрешение браузера на хранение и повторите.",
          ),
        );
    });
  } finally {
    db.close();
  }
}
export async function deleteObservation(id: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
