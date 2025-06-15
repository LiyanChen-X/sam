import type { ModelScale } from "@/types/Scale";
import { Tensor, type TypedTensor } from "onnxruntime-web";

// Cache utilities for storing/retrieving tensor data
const CACHE_KEY_PREFIX = "sam-tensor-cache-";
const CACHE_EXPIRY_HOURS = 24;

interface CachedTensorData {
	scale: ModelScale;
	tensorData: {
		data: number[];
		dims: number[];
		type: string;
	};
	timestamp: number;
	imageHash: string;
}

const generateImageHash = async (file: File): Promise<string> => {
	const buffer = await file.arrayBuffer();
	const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const getCachedTensorData = async (
	file: File,
): Promise<{ scale: ModelScale; tensor: TypedTensor<"float32"> } | null> => {
	try {
		const imageHash = await generateImageHash(file);
		const cacheKey = `${CACHE_KEY_PREFIX}${imageHash}`;
		const cached = localStorage.getItem(cacheKey);

		if (!cached) return null;

		const data: CachedTensorData = JSON.parse(cached);

		// Check if cache is expired
		const now = Date.now();
		const expiryTime = data.timestamp + CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

		if (now > expiryTime) {
			localStorage.removeItem(cacheKey);
			return null;
		}

		const restoredTensor = new Tensor(
			data.tensorData.type as any,
			new Float32Array(data.tensorData.data),
			data.tensorData.dims,
		);

		return {
			scale: data.scale,
			tensor: restoredTensor,
		};
	} catch (error) {
		console.error("Error reading cache:", error);
		return null;
	}
};

export const setCachedTensorData = async (
	file: File,
	scale: ModelScale,
	tensor: TypedTensor<"float32">,
): Promise<void> => {
	try {
		const imageHash = await generateImageHash(file);
		const cacheKey = `${CACHE_KEY_PREFIX}${imageHash}`;

		const cacheData: CachedTensorData = {
			scale,
			tensorData: {
				data: Array.from(tensor.data as Float32Array),
				// @ts-expect-error
				dims: tensor.dims,
				type: tensor.type,
			},
			timestamp: Date.now(),
			imageHash,
		};

		localStorage.setItem(cacheKey, JSON.stringify(cacheData));
	} catch (error) {
		console.error("Error writing cache:", error);
	}
};
