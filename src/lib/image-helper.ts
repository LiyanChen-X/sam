import type { Click } from "@/types/Click";
import type { Mask } from "@/types/Mask";
import type { ModelScale } from "@/types/Scale";
import { Tensor } from "onnxruntime-web";
import { convertSegmentsToSVG, generatePolygonSegments } from "./custom-tracer";

const IMAGE_SIZE = 500;
const UPLOAD_IMAGE_SIZE = 1024;

type Point = {
	x: number;
	y: number;
};

export const imageDataToBase64 = (imageData: ImageData): string => {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");

	if (!ctx) {
		throw new Error("Could not get canvas context");
	}

	canvas.width = imageData.width;
	canvas.height = imageData.height;
	ctx.putImageData(imageData, 0, 0);

	return canvas.toDataURL("image/jpeg", 1);
};

export const svgToBase64 = (
	canvas: HTMLCanvasElement,
	maxSize = 720,
): string => {
	const resizedCanvas = resizeCanvasToMaxSize(canvas, maxSize);
	return resizedCanvas.toDataURL("image/png");
};

export const fileToBase64 = async (
	file: File,
	maxSize = 720,
): Promise<string> => {
	return new Promise((resolve, reject) => {
		const img = new Image();

		img.onload = () => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");

			if (!ctx) {
				reject(new Error("Could not get canvas context"));
				return;
			}

			const { width, height } = img;
			canvas.width = width;
			canvas.height = height;

			ctx.drawImage(img, 0, 0);

			// Resize canvas to maxSize
			const resizedCanvas = resizeCanvasToMaxSize(canvas, maxSize);
			const base64 = resizedCanvas.toDataURL("image/png");

			URL.revokeObjectURL(img.src);
			resolve(base64);
		};

		img.onerror = () => {
			URL.revokeObjectURL(img.src);
			reject(new Error("Failed to load image"));
		};

		img.src = URL.createObjectURL(file);
	});
};

export const fileToImageData = async (
	file: File,
	scaleType: "display" | "upload" | "original" = "upload",
): Promise<ImageData> => {
	const UPLOAD_IMAGE_SIZE = 480;
	return new Promise((resolve, reject) => {
		const img = new Image();
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");

		if (!ctx) {
			reject(new Error("Could not get canvas context"));
			return;
		}

		img.onload = () => {
			const width = img.naturalWidth;
			const height = img.naturalHeight;

			let scale = 1;
			let uploadScale = 1;

			// Calculate scales using the same logic as imageToBlob
			if (height < width) {
				scale = IMAGE_SIZE / height;
				uploadScale = UPLOAD_IMAGE_SIZE / width;
			} else {
				scale = IMAGE_SIZE / width;
				uploadScale = UPLOAD_IMAGE_SIZE / height;
			}

			let canvasWidth: number;
			let canvasHeight: number;

			switch (scaleType) {
				case "display":
					canvasWidth = Math.round(width * scale);
					canvasHeight = Math.round(height * scale);
					break;
				case "upload":
					canvasWidth = Math.round(width * uploadScale);
					canvasHeight = Math.round(height * uploadScale);
					break;
				default: // 'original'
					canvasWidth = width;
					canvasHeight = height;
					break;
			}

			canvas.width = canvasWidth;
			canvas.height = canvasHeight;
			ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

			try {
				const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

				// Clean up object URL
				URL.revokeObjectURL(img.src);
				resolve(imageData);
			} catch (error) {
				URL.revokeObjectURL(img.src);
				reject(error);
			}
		};

		img.onerror = () => {
			URL.revokeObjectURL(img.src);
			reject(new Error("Failed to load image"));
		};

		img.src = URL.createObjectURL(file);
	});
};

export const resizeCanvasToMaxSize = (
	sourceCanvas: HTMLCanvasElement,
	maxSize = 720,
): HTMLCanvasElement => {
	const originalWidth = sourceCanvas.width;
	const originalHeight = sourceCanvas.height;

	// Calculate scaling factor to fit within maxSize
	let scaleFactor = 1;
	if (originalWidth > maxSize || originalHeight > maxSize) {
		scaleFactor = Math.min(maxSize / originalWidth, maxSize / originalHeight);
	}

	// If no scaling needed, return original canvas
	if (scaleFactor >= 1) {
		return sourceCanvas;
	}

	const scaledWidth = Math.round(originalWidth * scaleFactor);
	const scaledHeight = Math.round(originalHeight * scaleFactor);

	// Create new canvas with scaled dimensions
	const scaledCanvas = document.createElement("canvas");
	const scaledCtx = scaledCanvas.getContext("2d")!;

	scaledCanvas.width = scaledWidth;
	scaledCanvas.height = scaledHeight;

	// Draw the original canvas scaled down
	scaledCtx.drawImage(sourceCanvas, 0, 0, scaledWidth, scaledHeight);

	return scaledCanvas;
};

export async function imageToBlob(image: File): Promise<{
	blob: Blob;
	scale: ModelScale;
} | null> {
	return new Promise((resolve) => {
		const img = new Image();
		img.src = URL.createObjectURL(image);
		img.onload = async () => {
			const width = img.naturalWidth;
			const height = img.naturalHeight;
			let scale: number;
			let uploadScale: number;
			if (height < width) {
				scale = IMAGE_SIZE / height;
				uploadScale = UPLOAD_IMAGE_SIZE / width;
			} else {
				scale = IMAGE_SIZE / width;
				uploadScale = UPLOAD_IMAGE_SIZE / height;
			}
			img.width = Math.round(width * scale);
			img.height = Math.round(height * scale);
			const canvas = document.createElement("canvas");
			canvas.width = Math.round(width * uploadScale);
			canvas.height = Math.round(height * uploadScale);
			const ctx = canvas.getContext("2d");
			if (ctx) {
				ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
				canvas.toBlob(
					(blob) => {
						resolve({
							blob: blob as Blob,
							scale: {
								height,
								width,
								scale,
								uploadScale,
								maskHeight: Math.round(height * uploadScale),
								maskWidth: Math.round(width * uploadScale),
								onnxScale: scale / uploadScale,
							} as ModelScale,
						});
					},
					"image/jpeg",
					1.0,
				);
			}
		};
	});
}

export function translateClickToTensors(clicks: Click[], scale: ModelScale) {
	const n = clicks.length;
	const pointCoords = new Float32Array(2 * (n + 1));
	const pointLabels = new Float32Array(n + 1);
	for (let i = 0; i < n; i++) {
		pointCoords[2 * i] = clicks[i].x / scale.onnxScale;
		pointCoords[2 * i + 1] = clicks[i].y / scale.onnxScale;
		pointLabels[i] = clicks[i].clickType;
	}
	pointCoords[2 * n] = 0.0;
	pointCoords[2 * n + 1] = 0.0;
	pointLabels[n] = -1.0;
	const pointCoordsTensor = new Tensor("float32", pointCoords, [1, n + 1, 2]);
	const pointLabelsTensor = new Tensor("float32", pointLabels, [1, n + 1]);
	const imageSizeTensor = new Tensor("float32", [
		scale.maskHeight,
		scale.maskWidth,
	]);
	return {
		pointCoordsTensor,
		pointLabelsTensor,
		imageSizeTensor,
	};
}

function imageDataToCanvas(imageData: ImageData) {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	canvas.width = imageData.width;
	canvas.height = imageData.height;
	ctx?.putImageData(imageData, 0, 0);
	return canvas;
}

function imageDataToImage(imageData: ImageData) {
	const canvas = imageDataToCanvas(imageData);
	const image = new Image();
	image.src = canvas.toDataURL();
	return image;
}

function toImageData(
	input: any,
	width: number,
	height: number,
	color: { r: number; g: number; b: number; a: number } = {
		r: 0,
		g: 114,
		b: 189,
		a: 255,
	},
) {
	const { r, g, b, a } = color;
	const arr = new Uint8ClampedArray(4 * width * height).fill(0);
	for (let i = 0; i < input.length; i++) {
		if (input[i] > 0.0) {
			arr[4 * i + 0] = r;
			arr[4 * i + 1] = g;
			arr[4 * i + 2] = b;
			arr[4 * i + 3] = a;
		}
	}
	return new ImageData(arr, height, width);
}

export function rleToImage(
	input: any,
	width: number,
	height: number,
	options: {
		r?: number;
		g?: number;
		b?: number;
		a?: number;
	} = {},
) {
	const color = {
		r: options.r ?? 0,
		g: options.g ?? 114,
		b: options.b ?? 189,
		a: options.a ?? 255,
	};

	return imageDataToImage(toImageData(input, width, height, color));
}

export function getMaskCenter(
	input: any,
	width: number,
	height: number,
): { x: number; y: number } {
	// Add validation
	if (!input || input.length === 0) {
		return { x: width / 2, y: height / 2 };
	}

	let totalX = 0;
	let totalY = 0;
	let pixelCount = 0;

	// Use standard row-major indexing
	// Origin (0,0) at top-left, x increases right, y increases down
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = y * width + x; // Row-major: i = y * width + x
			if (i < input.length && input[i] > 0.0) {
				totalX += x;
				totalY += y;
				pixelCount++;
			}
		}
	}

	if (pixelCount === 0) {
		return { x: width / 2, y: height / 2 };
	}

	const centerX = Math.round(totalX / pixelCount);
	const centerY = Math.round(totalY / pixelCount);

	return {
		x: centerX,
		y: centerY,
	};
}

export function cropImageByPath(
	image: HTMLImageElement,
	pathData: string,
	width: number,
	height: number,
	uploadScale: number,
) {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	const pathWidth = width * uploadScale;
	const pathHeight = height * uploadScale;
	const scaleX = width / pathWidth;
	const scaleY = height / pathHeight;
	const points = parsePathData(pathData, scaleX, scaleY);
	const { x, y, width: cropWidth, height: cropHeight } = getBoundingBox(points);
	const path = new Path2D();
	path.moveTo(points[0].x, points[0].y);
	for (let i = 1; i < points.length; i++) {
		path.lineTo(points[i].x, points[i].y);
	}
	canvas.width = width;
	canvas.height = height;
	ctx?.clip(path);
	ctx?.drawImage(image, 0, 0, width, height);
	return cropCanvasToBoundingBox(canvas, x, y, cropWidth, cropHeight);
}

const parsePathData = (
	pathData: string,
	scaleX: number,
	scaleY: number,
): Point[] => {
	const commands = pathData.split(/(?=[A-Za-z])/);
	const points: Point[] = [];
	let currentPoint: Point = { x: 0, y: 0 };

	for (const command of commands) {
		const type = command.charAt(0);
		const args = command
			.substring(1)
			.trim()
			.split(/[ ,]+/)
			.map((arg) => Number.parseFloat(arg));

		// Based on svgCoordToInt() in mask_utils.tsx, we only use the "M" and "L" commands
		switch (type) {
			case "M":
				currentPoint = { x: args[0] * scaleX, y: args[1] * scaleY };
				points.push(currentPoint);
				break;
			case "L":
				for (let i = 0; i < args.length; i += 2) {
					const x = args[i] * scaleX;
					const y = args[i + 1] * scaleY;
					currentPoint = { x, y };
					points.push(currentPoint);
				}
				break;
			default:
				break;
		}
	}

	return points;
};

const getBoundingBox = (
	points: Point[],
): {
	x: number;
	y: number;
	width: number;
	height: number;
} => {
	const { minX, minY, maxX, maxY } = points.reduce(
		(prev, curr) => {
			return {
				minX: Math.min(prev.minX, curr.x),
				minY: Math.min(prev.minY, curr.y),
				maxX: Math.max(prev.maxX, curr.x),
				maxY: Math.max(prev.maxY, curr.y),
			};
		},
		{
			minX: Number.POSITIVE_INFINITY,
			minY: Number.POSITIVE_INFINITY,
			maxX: Number.NEGATIVE_INFINITY,
			maxY: Number.NEGATIVE_INFINITY,
		},
	);

	return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

const cropCanvasToBoundingBox = (
	canvas: HTMLCanvasElement,
	x: number,
	y: number,
	width: number,
	height: number,
): HTMLCanvasElement | undefined => {
	const croppedCanvas = document.createElement("canvas");
	const croppedCtx = croppedCanvas.getContext("2d");

	// Set the dimensions of the cropped canvas
	croppedCanvas.width = width;
	croppedCanvas.height = height;

	// Draw the portion of the original canvas that falls within the bounding box
	croppedCtx?.drawImage(canvas, x, y, width, height, 0, 0, width, height);

	return croppedCanvas;
};

export const traceOnnxMaskToSVG = (
	maskData: Mask,
	height: number,
	width: number,
) => {
	const rleMask = maskDataToFortranArrayToRle(maskData, width, height);
	// @ts-expect-error
	let svgStr = traceRleToSVG(rleMask, width);
	svgStr = filterSmallSVGRegions(svgStr);
	return svgStr;
};

function maskDataToFortranArrayToRle(
	input: Mask,
	nrows: number,
	ncols: number,
) {
	const result = [];
	let count = 0;
	let bit = false;
	for (let c = 0; c < ncols; c++) {
		for (let r = 0; r < nrows; r++) {
			const i = c + r * ncols;
			if (i < input.length) {
				const filled = (input[i] as number) > 0.0;
				if (filled !== bit) {
					result.push(count);
					bit = !bit;
					count = 1;
				} else count++;
			}
		}
	}
	if (count > 0) result.push(count);
	return result;
}

const traceRleToSVG = (rleMask: Mask, height: number) => {
	const polySegments = generatePolygonSegments(rleMask, height);
	const svgStr = convertSegmentsToSVG(polySegments);
	return svgStr;
};

/**
 * Filters SVG edges that enclose an area smaller than maxRegionSize.
 * Expects a list over SVG strings, with each string in the format:
 * 'M<x0> <y0> L<x1> <y1> <x2> <y2> ... <xn-1> <yn-1>'
 * The area calculation is not quite exact, truncating fractional pixels
 * instead of rounding. Both clockwise and counterclockwise SVG edges
 * are filtered, removing stray regions and small holes. Always keeps
 * at least one positive area region.
 */
export function filterSmallSVGRegions(input: string[], maxRegionSize = 100) {
	const filtered_regions = input.filter(
		(region: string) => Math.abs(areaOfSVGPolygon(region)) > maxRegionSize,
	);
	if (filtered_regions.length === 0) {
		const areas = input.map((region: string) => areaOfSVGPolygon(region));
		const bestIdx = areas.indexOf(Math.max(...areas));
		return [input[bestIdx]];
	}
	return filtered_regions;
}

function areaOfSVGPolygon(input: string) {
	const coords = input.split(" ");
	if (coords.length < 4) return 0;
	if (coords.length % 2) return 0;
	let area = 0;
	// We need to close the polygon loop, so start with the last coords.
	let old_x = svgCoordToInt(coords[coords.length - 2]);
	let old_y = svgCoordToInt(coords[coords.length - 1]);
	for (let i = 0; i < coords.length; i = i + 2) {
		const new_x = svgCoordToInt(coords[i]);
		const new_y = svgCoordToInt(coords[i + 1]);
		area = area + areaUnderLine(old_x, old_y, new_x, new_y);
		old_x = new_x;
		old_y = new_y;
	}
	return area;
}

function svgCoordToInt(input: string) {
	if (input.charAt(0) === "L" || input.charAt(0) === "M") {
		return Number.parseInt(input.slice(1));
	}
	return Number.parseInt(input);
}

function areaUnderLine(x0: number, y0: number, x1: number, y1: number) {
	// A vertical line has no area
	if (x0 === x1) return 0;
	// Square piece
	const ymin = Math.min(y0, y1);
	const squareArea = (x1 - x0) * ymin;
	// Triangle piece
	const ymax = Math.max(y0, y1);
	const triangleArea = Math.trunc(((x1 - x0) * (ymax - ymin)) / 2);
	return squareArea + triangleArea;
}
