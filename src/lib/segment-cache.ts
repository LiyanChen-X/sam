import type { Segment } from "@/types/Segment";

interface MaskRecord<T> {
	id: string;
	mask: Uint8Array;
	result: T; // Your complex calculation result
	hash: number[];
}

export function calculateIoU(mask1: Uint8Array, mask2: Uint8Array): number {
	if (mask1.length !== mask2.length) {
		throw new Error("Masks must have the same dimensions");
	}

	let intersection = 0;
	let union = 0;

	for (let i = 0; i < mask1.length; i++) {
		const pixel1 = mask1[i] > 0 ? 1 : 0;
		const pixel2 = mask2[i] > 0 ? 1 : 0;

		intersection += pixel1 * pixel2; // Both are 1
		union += Math.max(pixel1, pixel2); // At least one is 1
	}

	return union === 0 ? 0 : intersection / union;
}

class LSHMaskCache<T> {
	private buckets: Map<string, MaskRecord<T>[]> = new Map();
	private records: Map<string, MaskRecord<T>> = new Map();
	private numHashes: number;
	private hashSize: number;
	private idCounter = 0;

	constructor(numHashes = 16, hashSize = 64) {
		this.numHashes = numHashes;
		this.hashSize = hashSize;
	}

	// Generate LSH hash for a mask
	private generateLSHHash(mask: Uint8Array): number[] {
		const hashes: number[] = [];

		for (let h = 0; h < this.numHashes; h++) {
			let hash = 0;
			// Use different random projections for each hash
			const seed = h * 12345;

			for (let i = 0; i < this.hashSize; i++) {
				// Simple linear congruential generator for reproducible randomness
				const randomIndex = (seed + i * 7919) % mask.length;
				const bit = mask[randomIndex] > 0 ? 1 : 0;
				hash = (hash << 1) | bit;
			}
			hashes.push(hash);
		}

		return hashes;
	}

	// Convert hash array to bucket keys
	private getBucketKeys(hash: number[]): string[] {
		// Use different combinations of hash values as bucket keys
		const keys: string[] = [];

		// Use individual hashes
		for (let i = 0; i < hash.length; i++) {
			keys.push(`h${i}_${hash[i]}`);
		}

		// Use pairs of hashes for better precision
		for (let i = 0; i < hash.length - 1; i++) {
			keys.push(`p${i}_${hash[i]}_${hash[i + 1]}`);
		}

		return keys;
	}

	// Store a mask and its result
	store(mask: Uint8Array, result: T): string {
		const id = `cache_${++this.idCounter}`;
		const hash = this.generateLSHHash(mask);
		const record: MaskRecord<T> = { id, mask, result, hash };

		// Store in main records
		this.records.set(id, record);

		// Store in buckets
		const bucketKeys = this.getBucketKeys(hash);
		for (const key of bucketKeys) {
			if (!this.buckets.has(key)) {
				this.buckets.set(key, []);
			}
			this.buckets.get(key)!.push(record);
		}

		return id;
	}

	// Find similar masks
	findSimilar(
		queryMask: Uint8Array,
		similarityThreshold = 0.9,
	): MaskRecord<T>[] {
		const queryHash = this.generateLSHHash(queryMask);
		const bucketKeys = this.getBucketKeys(queryHash);

		// Collect candidates from buckets
		const candidates = new Set<MaskRecord<T>>();
		for (const key of bucketKeys) {
			const bucket = this.buckets.get(key);
			if (bucket) {
				for (const record of bucket) {
					candidates.add(record);
				}
			}
		}

		// Filter by actual similarity
		const results: MaskRecord<T>[] = [];
		for (const candidate of candidates) {
			const similarity = calculateIoU(queryMask, candidate.mask);
			console.log(
				`🔍 Comparing query mask with candidate ${candidate.id}: similarity = ${similarity.toFixed(2)}`,
			);
			if (similarity >= similarityThreshold) {
				results.push(candidate);
			}
		}

		return results.sort((a, b) => {
			const simA = calculateIoU(queryMask, a.mask);
			const simB = calculateIoU(queryMask, b.mask);
			return simB - simA; // Sort by similarity descending
		});
	}

	// Get the best match
	findBestMatch(
		queryMask: Uint8Array,
		similarityThreshold = 0.9,
	): MaskRecord<T> | null {
		const startTime = performance.now();
		const results = this.findSimilar(queryMask, similarityThreshold);
		const endTime = performance.now();
		console.log(
			`🔎 Found match in segment cache in ${(endTime - startTime).toFixed(2)}ms`,
		);
		return results.length > 0 ? results[0] : null;
	}
}

export const segmentCache = new LSHMaskCache<Segment>(16, 64);
