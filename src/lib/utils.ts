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
