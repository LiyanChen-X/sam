import type { ModelScale } from "@/types/Scale";
import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import { Tensor, type TypedTensor } from "onnxruntime-web";

// Database configuration
const DB_NAME = "sam-tensor-cache";
const DB_VERSION = 1;
const STORE_NAME = "tensors";
const CACHE_EXPIRY_HOURS = 24;

interface CachedTensorData {
	id: string; // imageHash as primary key
	scale: ModelScale;
	tensorData: {
		data: Float32Array; // Store as typed array directly
		dims: number[];
		type: string;
	};
	timestamp: number;
	imageHash: string;
}

interface TensorCacheDB extends DBSchema {
	[STORE_NAME]: {
		key: string;
		value: CachedTensorData;
	};
}

let dbPromise: Promise<IDBPDatabase<TensorCacheDB>> | null = null;

const getDB = (): Promise<IDBPDatabase<TensorCacheDB>> => {
	if (!dbPromise) {
		dbPromise = openDB<TensorCacheDB>(DB_NAME, DB_VERSION, {
			upgrade(db) {
				// Create object store
				if (!db.objectStoreNames.contains(STORE_NAME)) {
					const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
					// @ts-expect-error
					store.createIndex("timestamp", "timestamp");
				}
			},
		});
	}
	return dbPromise;
};

const generateImageHash = async (file: File): Promise<string> => {
	const buffer = await file.arrayBuffer();
	const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const fullHash = hashArray
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	// Truncate to reduce size - taking first 16 characters (8 bytes)
	return fullHash.substring(0, 16);
};

export const getCachedTensorData = async (
	file: File,
): Promise<{ scale: ModelScale; tensor: TypedTensor<"float32"> } | null> => {
	try {
		const db = await getDB();
		const imageHash = await generateImageHash(file);

		const cachedData = await db.get(STORE_NAME, imageHash);

		if (!cachedData) return null;

		// Check if cache is expired
		const now = Date.now();
		const expiryTime =
			cachedData.timestamp + CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

		if (now > expiryTime) {
			// Remove expired cache
			await db.delete(STORE_NAME, imageHash);
			return null;
		}

		// Restore tensor from cached data
		const restoredTensor = new Tensor(
			cachedData.tensorData.type as any,
			cachedData.tensorData.data, // Already a Float32Array
			cachedData.tensorData.dims,
		);

		return {
			scale: cachedData.scale,
			tensor: restoredTensor,
		};
	} catch (error) {
		console.error("Error reading from IndexedDB cache:", error);
		return null;
	}
};

export const setCachedTensorData = async (
	file: File,
	scale: ModelScale,
	tensor: TypedTensor<"float32">,
): Promise<void> => {
	try {
		const db = await getDB();
		const imageHash = await generateImageHash(file);

		const cacheData: CachedTensorData = {
			id: imageHash,
			scale,
			tensorData: {
				data: new Float32Array(tensor.data as Float32Array), // Store as Float32Array
				dims: tensor.dims as number[],
				type: tensor.type,
			},
			timestamp: Date.now(),
			imageHash,
		};

		await db.put(STORE_NAME, cacheData);

		// Optional: Clean up old entries periodically
		await cleanupExpiredEntries(db);
	} catch (error) {
		console.error("Error writing to IndexedDB cache:", error);
	}
};

// Helper function to clean up expired entries
const cleanupExpiredEntries = async (
	db: IDBPDatabase<TensorCacheDB>,
): Promise<void> => {
	try {
		const now = Date.now();
		const expiryThreshold = now - CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

		const tx = db.transaction(STORE_NAME, "readwrite");
		// @ts-expect-error
		const index = tx.store.index("timestamp");

		// Get all entries older than expiry threshold
		const expiredEntries = await index.getAll(
			IDBKeyRange.upperBound(expiryThreshold),
		);

		// Delete expired entries
		for (const entry of expiredEntries) {
			await tx.store.delete(entry.id);
		}

		await tx.done;
	} catch (error) {
		console.error("Error cleaning up expired cache entries:", error);
	}
};

// Optional: Function to clear all cache
export const clearTensorCache = async (): Promise<void> => {
	try {
		const db = await getDB();
		await db.clear(STORE_NAME);
	} catch (error) {
		console.error("Error clearing cache:", error);
	}
};

// Optional: Function to get cache size/stats
export const getCacheStats = async (): Promise<{
	count: number;
	totalSize: number;
}> => {
	try {
		const db = await getDB();
		const allEntries = await db.getAll(STORE_NAME);

		const count = allEntries.length;
		const totalSize = allEntries.reduce((size, entry) => {
			return size + entry.tensorData.data.byteLength;
		}, 0);

		return { count, totalSize };
	} catch (error) {
		console.error("Error getting cache stats:", error);
		return { count: 0, totalSize: 0 };
	}
};
