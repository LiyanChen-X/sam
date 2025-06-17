import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Function to calculate tooltip dimensions based on text content
export const calculateTooltipDimensions = (text: string, fontSize: number) => {
	const maxWidth = 350;
	const minWidth = 200;
	const padding = 24; // 12px on each side
	const lineHeight = 1.4;

	// Estimate characters per line based on font size
	const avgCharWidth = fontSize * 0.6;
	const availableWidth = maxWidth - padding;
	const charsPerLine = Math.floor(availableWidth / avgCharWidth);

	// Calculate number of lines needed
	const estimatedLines = Math.ceil(text.length / charsPerLine);

	// Calculate actual width needed
	const textWidth = Math.min(
		maxWidth - padding,
		Math.max(minWidth - padding, text.length * avgCharWidth),
	);
	const actualWidth = textWidth + padding;

	// Calculate height based on lines
	const textHeight = estimatedLines * fontSize * lineHeight;
	const actualHeight = textHeight + padding;

	return {
		width: Math.min(maxWidth, actualWidth),
		height: Math.max(60, actualHeight),
		textWidth: textWidth,
	};
};

// Helper function to calculate tooltip position with smart flipping
export const calculateTooltipPosition = (
	mousePos: { x: number; y: number },
	tooltipDimensions: { width: number; height: number },
	canvasDimensions: { width: number; height: number },
) => {
	const { width: canvasWidth, height: canvasHeight } = canvasDimensions;
	const offset = 10;
	const { width: tooltipWidth, height: tooltipHeight } = tooltipDimensions;

	// Priority order for positioning:
	// 1. Top-right (default)
	// 2. Top-left
	// 3. Bottom-right
	// 4. Bottom-left

	const positions = [
		// Top-right
		{ x: mousePos.x + offset, y: mousePos.y - offset - tooltipHeight },
		// Top-left
		{
			x: mousePos.x - offset - tooltipWidth,
			y: mousePos.y - offset - tooltipHeight,
		},
		// Bottom-right
		{ x: mousePos.x + offset, y: mousePos.y + offset },
		// Bottom-left
		{ x: mousePos.x - offset - tooltipWidth, y: mousePos.y + offset },
	];

	// Find the first position that fits within canvas bounds
	for (const pos of positions) {
		if (
			pos.x >= 0 &&
			pos.x + tooltipWidth <= canvasWidth &&
			pos.y >= 0 &&
			pos.y + tooltipHeight <= canvasHeight
		) {
			return pos;
		}
	}

	// If no position fits perfectly, constrain to canvas bounds
	return {
		x: Math.max(0, Math.min(mousePos.x, canvasWidth - tooltipWidth)),
		y: Math.max(0, Math.min(mousePos.y, canvasHeight - tooltipHeight)),
	};
};
