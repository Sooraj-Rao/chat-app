/* eslint-disable @typescript-eslint/no-explicit-any */
export interface DBSchema {
  conversations: {
    key: string;
    value: any;
    indexes: { "by-last-message": string };
  };
  messages: {
    key: string;
    value: any;
    indexes: { "by-conversation": string; "by-date": string };
  };
  users: {
    key: string;
    value: any;
    indexes: { "by-username": string };
  };
}

export class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private dbName = "chatAppDB";
  private version = 1;

  async connect(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(new Error("Failed to open database"));

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains("conversations")) {
          const conversationsStore = db.createObjectStore("conversations", {
            keyPath: "id",
          });
          conversationsStore.createIndex("by-last-message", "last_message_at", {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains("messages")) {
          const messagesStore = db.createObjectStore("messages", {
            keyPath: "id",
          });
          messagesStore.createIndex("by-conversation", "conversation_id", {
            unique: false,
          });
          messagesStore.createIndex("by-date", "created_at", { unique: false });
        }

        if (!db.objectStoreNames.contains("users")) {
          const usersStore = db.createObjectStore("users", { keyPath: "id" });
          usersStore.createIndex("by-username", "username", { unique: true });
        }
      };
    });
  }

  async getAll<T extends keyof DBSchema>(
    storeName: T
  ): Promise<DBSchema[T]["value"][]> {
    const db = await this.connect();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(new Error(`Failed to get all from ${String(storeName)}`));
    });
  }

  async getById<T extends keyof DBSchema>(
    storeName: T,
    id: string
  ): Promise<DBSchema[T]["value"] | undefined> {
    const db = await this.connect();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || undefined);
      request.onerror = () =>
        reject(new Error(`Failed to get item from ${String(storeName)}`));
    });
  }

  async getByIndex<T extends keyof DBSchema>(
    storeName: T,
    indexName: string,
    value: any
  ): Promise<DBSchema[T]["value"][]> {
    const db = await this.connect();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(new Error(`Failed to get by index from ${String(storeName)}`));
    });
  }

  async add<T extends keyof DBSchema>(
    storeName: T,
    item: DBSchema[T]["value"]
  ): Promise<string> {
    const db = await this.connect();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => resolve(request.result as string);
      request.onerror = () =>
        reject(new Error(`Failed to add to ${String(storeName)}`));
    });
  }

  async put<T extends keyof DBSchema>(
    storeName: T,
    item: DBSchema[T]["value"]
  ): Promise<void> {
    const db = await this.connect();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error(`Failed to update in ${String(storeName)}`));
    });
  }

  async delete<T extends keyof DBSchema>(
    storeName: T,
    id: string
  ): Promise<void> {
    const db = await this.connect();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error(`Failed to delete from ${String(storeName)}`));
    });
  }

  async bulkPut<T extends keyof DBSchema>(
    storeName: T,
    items: DBSchema[T]["value"][]
  ): Promise<void> {
    const db = await this.connect();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);

      let completed = 0;
      let hasError = false;

      items.forEach((item) => {
        const request = store.put(item);

        request.onsuccess = () => {
          completed++;
          if (completed === items.length && !hasError) {
            resolve();
          }
        };

        request.onerror = () => {
          if (!hasError) {
            hasError = true;
            reject(new Error(`Failed to bulk update in ${String(storeName)}`));
          }
        };
      });

      if (items.length === 0) {
        resolve();
      }
    });
  }

  async clear<T extends keyof DBSchema>(storeName: T): Promise<void> {
    const db = await this.connect();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error(`Failed to clear ${String(storeName)}`));
    });
  }
}

export const dbManager = new IndexedDBManager();
