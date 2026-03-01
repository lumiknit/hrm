import { type Sheet } from "./cell";

const DB_NAME = "hrm-db";
const STORE_NAME = "sheets";

export interface SheetDBItem {
	id: string;
	title: string;
	description: string;
	updatedAt: Date;
	data: Sheet;
}

export type SheetSummary = Omit<SheetDBItem, "data">;

export class SheetDB {
	openDB(): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, 1);
			request.onupgradeneeded = () => {
				const db = request.result;
				if (!db.objectStoreNames.contains(STORE_NAME)) {
					db.createObjectStore(STORE_NAME, { keyPath: "id" });
				}
			};
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}

	async wrapRequest<T>(
		handle: (store: IDBObjectStore) => IDBRequest<T>,
	): Promise<T> {
		const db = await this.openDB();
		return await new Promise((resolve, reject) => {
			const transaction = db.transaction(STORE_NAME, "readwrite");
			const store = transaction.objectStore(STORE_NAME);
			const request = handle(store);
			request.onsuccess = () => resolve(request.result as T);
			request.onerror = () => reject(request.error);
		});
	}

	async get(id: string): Promise<Sheet | undefined> {
		console.log(`Getting sheet with ID: ${id}`);
		const item = await this.wrapRequest<SheetDBItem | undefined>(store =>
			store.get(id),
		);
		console.log(item);
		return item?.data;
	}

	async set(id: string, sheet: Sheet): Promise<void> {
		const item: SheetDBItem = {
			id,
			title: sheet.title,
			description: sheet.description,
			updatedAt: sheet.updatedAt,
			data: sheet,
		};
		await this.wrapRequest(store => store.put(item));
	}

	async list(): Promise<SheetSummary[]> {
		const results = await this.wrapRequest<SheetDBItem[]>(store =>
			store.getAll(),
		);
		return results.map(r => ({
			id: r.id,
			title: r.title,
			description: r.description,
			updatedAt: r.updatedAt,
		}));
	}

	async delete(id: string): Promise<void> {
		await this.wrapRequest(store => store.delete(id));
	}
}
