import { appStore } from "@/store";
import type { Segment } from "@/types/Segment";
import localforage from "localforage";
import { fileToBase64, svgToBase64 } from "./image-helper";

// Configure localforage to use IndexedDB
localforage.config({
	driver: localforage.INDEXEDDB,
	name: "sam-image-generator",
	version: 1.0,
	description: "Image generator cache using IndexedDB",
});

class ImageGenerator {
	private cache: Map<string, Promise<string>> = new Map();
	private readonly CACHE_KEY = "image-generator-cache";

	private get contextImage(): File | undefined {
		return appStore.getState().image;
	}

	constructor() {
		this.cache = new Map();
		this.loadCacheFromStorage();
	}

	private async loadCacheFromStorage() {
		try {
			const cachedData = await localforage.getItem<Record<string, string>>(
				this.CACHE_KEY,
			);
			if (cachedData) {
				for (const [key, value] of Object.entries(cachedData)) {
					this.cache.set(key, Promise.resolve(value));
				}
			}
		} catch (error) {
			console.warn("Failed to load image cache from localForage:", error);
		}
	}

	private async saveCacheToStorage() {
		try {
			const cacheData: Record<string, string> = {};
			for (const [key, promise] of this.cache.entries()) {
				try {
					const resolvedValue = await promise;
					cacheData[key] = resolvedValue;
				} catch (error) {
					// Skip failed promises
					console.warn(`Skipping failed cache entry for key ${key}:`, error);
				}
			}
			await localforage.setItem(this.CACHE_KEY, cacheData);
		} catch (error) {
			console.warn("Failed to save image cache to localForage:", error);
		}
	}

	addImageGeneration(segment: Segment) {
		const cacheKey = segment.id;
		if (this.cache.has(cacheKey)) {
			return;
		}
		const imageGenerationPromise = this.generateImage(segment);
		this.cache.set(cacheKey, imageGenerationPromise);

		// Save to localForage after the promise resolves
		imageGenerationPromise.then(() => this.saveCacheToStorage());
	}

	getImageGeneration(segment: Segment): Promise<string> {
		const cacheKey = segment.id;
		if (this.cache.has(cacheKey)) {
			return this.cache.get(cacheKey)!;
		}
		const imageGenerationPromise = this.generateImage(segment);
		this.cache.set(cacheKey, imageGenerationPromise);

		// Save to localForage after the promise resolves
		imageGenerationPromise.then(() => this.saveCacheToStorage());
		return imageGenerationPromise;
	}

	regenerateImage(segment: Segment): Promise<string> {
		const cacheKey = segment.id;
		if (this.cache.has(cacheKey)) {
			this.cache.delete(cacheKey);
		}
		return this.generateImage(segment).then((image) => {
			this.cache.set(cacheKey, Promise.resolve(image));
			this.saveCacheToStorage();
			return image;
		});
	}

	async generateImage(segment: Segment): Promise<string> {
		const formData = new FormData();
		formData.append("contextImage", await fileToBase64(this.contextImage!));
		formData.append("croppedObject", svgToBase64(segment.sticker));

		const imageGenerationPromise = fetch("/api/generate-image", {
			method: "POST",
			body: formData,
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error(`HTTP error! Status: ${response.status}`);
				}
				return response.json();
			})
			.then(({ result }) => result);

		return imageGenerationPromise as Promise<string>;
	}

	// Method to clear cache if needed
	async clearCache() {
		this.cache.clear();
		await localforage.removeItem(this.CACHE_KEY);
	}
}

export const imageGenerator = new ImageGenerator();
