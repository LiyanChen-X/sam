import {
	calculateTooltipDimensions,
	calculateTooltipPosition,
} from "@/lib/utils";
import Konva from "konva";
import { useEffect, useMemo, useRef, useState } from "react";
import { Layer, Rect, Text } from "react-konva";

interface TooltipProps {
	isVisible: boolean;
	description: string;
	mousePos: { x: number; y: number };
	canvasDimensions: { width: number; height: number };
	opacity?: number;
}

export function Tooltip({
	isVisible,
	description,
	mousePos,
	canvasDimensions,
	opacity = 1,
}: TooltipProps) {
	const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
	const tooltipRectRef = useRef<Konva.Rect>(null);
	const tooltipShadowRef = useRef<Konva.Rect>(null);
	const tooltipTextRef = useRef<Konva.Text>(null);

	const tooltipDimensions = useMemo(
		() => calculateTooltipDimensions(description || "", 24),
		[description],
	);

	useEffect(() => {
		if (!isVisible || !description) return;

		const newTooltipPos = calculateTooltipPosition(
			mousePos,
			tooltipDimensions,
			canvasDimensions,
		);

		// Animate tooltip position change
		if (
			tooltipRectRef.current &&
			tooltipShadowRef.current &&
			tooltipTextRef.current
		) {
			tooltipRectRef.current.to({
				x: newTooltipPos.x,
				y: newTooltipPos.y,
				duration: 0.2,
				easing: Konva.Easings.EaseOut,
			});
			tooltipShadowRef.current.to({
				x: newTooltipPos.x + 2,
				y: newTooltipPos.y + 2,
				duration: 0.2,
				easing: Konva.Easings.EaseOut,
			});
			tooltipTextRef.current.to({
				x: newTooltipPos.x + 12,
				y: newTooltipPos.y + 12,
				duration: 0.2,
				easing: Konva.Easings.EaseOut,
			});
		}

		setTooltipPos(newTooltipPos);
	}, [isVisible, description, mousePos, tooltipDimensions, canvasDimensions]);

	if (!isVisible || !description) {
		return null;
	}

	return (
		<Layer name="tooltip" listening={false}>
			{/* Shadow/backdrop for depth */}
			<Rect
				ref={tooltipShadowRef}
				x={tooltipPos.x + 2}
				y={tooltipPos.y + 2}
				width={tooltipDimensions.width}
				height={tooltipDimensions.height}
				fill="rgba(0,0,0,0.3)"
				cornerRadius={8}
				opacity={opacity * 0.8}
			/>
			{/* Main tooltip background */}
			<Rect
				ref={tooltipRectRef}
				x={tooltipPos.x}
				y={tooltipPos.y}
				width={tooltipDimensions.width}
				height={tooltipDimensions.height}
				fill="#1f2937"
				stroke="#60a5fa"
				strokeWidth={2}
				opacity={opacity * 0.95}
				cornerRadius={8}
			/>
			{/* Tooltip text */}
			<Text
				ref={tooltipTextRef}
				x={tooltipPos.x + 12}
				y={tooltipPos.y + 12}
				text={description}
				fontSize={24}
				fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
				fontStyle="600"
				fill="white"
				width={tooltipDimensions.textWidth}
				wrap="word"
				lineHeight={1.4}
				align="left"
				opacity={opacity}
			/>
		</Layer>
	);
}
