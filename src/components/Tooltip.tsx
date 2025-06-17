import {
	calculateTooltipDimensions,
	calculateTooltipPosition,
} from "@/lib/utils";
import Konva from "konva";
import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Group, Layer, Line, Rect, Text } from "react-konva";

interface TooltipProps {
	isVisible: boolean;
	description: string;
	refPosition: { x: number; y: number };
	canvasDimensions: { width: number; height: number };
	opacity?: number;
	showTooltipAction?: boolean;
	onCancel?: () => void;
	onProceed?: () => void;
}

export function Tooltip({
	isVisible,
	description,
	refPosition,
	canvasDimensions,
	opacity = 1,
	showTooltipAction = false,
	onCancel = () => {},
	onProceed = () => {},
}: TooltipProps) {
	const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(
		null,
	);
	const tooltipRectRef = useRef<Konva.Rect>(null);
	const tooltipShadowRef = useRef<Konva.Rect>(null);
	const tooltipTextRef = useRef<Konva.Text>(null);
	const actionButtonRef = useRef<Konva.Group>(null);
	const closeButtonRef = useRef<Konva.Group>(null);
	const isInitializedRef = useRef(false);
	const [isButtonHovered, setIsButtonHovered] = useState(false);

	const tooltipDimensions = useMemo(() => {
		const baseDimensions = calculateTooltipDimensions(description || "", 24);
		// Add extra height for action button if needed, and extra padding for close button
		const extraHeight = showTooltipAction ? 100 : 0;
		const extraTopPadding = showTooltipAction ? 30 : 0;
		const extraSidePadding = showTooltipAction ? 20 : 0;
		return {
			...baseDimensions,
			width: baseDimensions.width + extraSidePadding,
			height: baseDimensions.height + extraHeight + extraTopPadding,
		};
	}, [description, showTooltipAction]);

	useEffect(() => {
		if (!isVisible || !description) {
			setTooltipPos(null);
			isInitializedRef.current = false;
			return;
		}

		const newTooltipPos = calculateTooltipPosition(
			refPosition,
			tooltipDimensions,
			canvasDimensions,
		);

		// If this is the first time setting position, don't animate
		if (!isInitializedRef.current) {
			setTooltipPos(newTooltipPos);
			isInitializedRef.current = true;
			return;
		}

		// Animate tooltip position change for subsequent updates
		const elementsToAnimate = [
			tooltipRectRef.current,
			tooltipShadowRef.current,
			tooltipTextRef.current,
			actionButtonRef.current,
			closeButtonRef.current,
		].filter(Boolean);

		elementsToAnimate.forEach((element, _) => {
			if (!element) return;

			let targetX = newTooltipPos.x;
			let targetY = newTooltipPos.y;

			// Adjust positions for different elements
			if (element === tooltipShadowRef.current) {
				targetX += 2;
				targetY += 2;
			} else if (element === tooltipTextRef.current) {
				targetX += 12;
				targetY += showTooltipAction ? 40 : 12; // More top margin when action button is visible
			} else if (element === closeButtonRef.current) {
				targetX += tooltipDimensions.width; // Center aligns with right edge
				targetY += 0; // Center aligns with top edge
			} else if (element === actionButtonRef.current) {
				targetX += tooltipDimensions.width / 2 - 120;
				targetY += tooltipDimensions.height - 80;
			}

			element.to({
				x: targetX,
				y: targetY,
				duration: 0.2,
				easing: Konva.Easings.EaseOut,
			});
		});

		setTooltipPos(newTooltipPos);
	}, [
		isVisible,
		description,
		refPosition,
		tooltipDimensions,
		canvasDimensions,
		showTooltipAction,
	]);

	if (!isVisible || !description || !tooltipPos) {
		return null;
	}

	return (
		<Layer name="tooltip" listening={showTooltipAction}>
			{/* Shadow/backdrop for depth */}
			<Rect
				ref={tooltipShadowRef}
				x={tooltipPos.x + 3}
				y={tooltipPos.y + 3}
				width={tooltipDimensions.width}
				height={tooltipDimensions.height}
				fill="rgba(0,0,0,0.4)"
				cornerRadius={6}
				opacity={opacity * 0.6}
			/>
			{/* Main tooltip background */}
			<Rect
				ref={tooltipRectRef}
				x={tooltipPos.x}
				y={tooltipPos.y}
				width={tooltipDimensions.width}
				height={tooltipDimensions.height}
				fill="#0f172a"
				stroke="#1e40af"
				strokeWidth={1}
				opacity={opacity}
				cornerRadius={6}
			/>
			{/* Inner accent border */}
			<Rect
				x={tooltipPos.x + 1}
				y={tooltipPos.y + 1}
				width={tooltipDimensions.width - 2}
				height={tooltipDimensions.height - 2}
				stroke="rgba(59, 130, 246, 0.3)"
				strokeWidth={1}
				cornerRadius={5}
				opacity={opacity}
			/>
			{/* Tooltip text */}
			<Text
				ref={tooltipTextRef}
				x={tooltipPos.x + 12}
				y={tooltipPos.y + (showTooltipAction ? 40 : 12)}
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

			{/* Close button */}
			{showTooltipAction && (
				<Group
					ref={closeButtonRef}
					x={tooltipPos.x + tooltipDimensions.width}
					y={tooltipPos.y}
					onClick={onCancel}
					onTap={onCancel}
					listening={true}
				>
					{/* Badge background */}
					<Circle radius={16} fill="#1e293b" stroke="#3b82f6" strokeWidth={1} />
					{/* Inner circle */}
					<Circle radius={14} fill="#0f172a" />
					{/* Close icon */}
					<Line
						points={[-4, -4, 4, 4]}
						stroke="#60a5fa"
						strokeWidth={2}
						lineCap="round"
					/>
					<Line
						points={[4, -4, -4, 4]}
						stroke="#60a5fa"
						strokeWidth={2}
						lineCap="round"
					/>
				</Group>
			)}

			{/* Action button */}
			{showTooltipAction && (
				<Group
					ref={actionButtonRef}
					x={tooltipPos.x + tooltipDimensions.width / 2 - 120}
					y={tooltipPos.y + tooltipDimensions.height - 80}
					onClick={onProceed}
					onTap={onProceed}
					onMouseEnter={(e) => {
						setIsButtonHovered(true);
						const container = e.target.getStage()?.container();
						if (container) {
							container.style.cursor = "pointer";
						}
						// Scale animation on hover
						actionButtonRef.current?.to({
							scaleX: 1.05,
							scaleY: 1.05,
							duration: 0.2,
							easing: Konva.Easings.EaseOut,
						});
					}}
					onMouseLeave={(e) => {
						setIsButtonHovered(false);
						const container = e.target.getStage()?.container();
						if (container) {
							container.style.cursor = "default";
						}
						// Scale back to normal
						actionButtonRef.current?.to({
							scaleX: 1,
							scaleY: 1,
							duration: 0.2,
							easing: Konva.Easings.EaseOut,
						});
					}}
					listening={true}
				>
					{/* Button shadow */}
					<Rect
						x={2}
						y={2}
						width={240}
						height={48}
						fill="rgba(0,0,0,0.3)"
						cornerRadius={24}
					/>
					{/* Button background with subtle gradient */}
					<Rect
						width={240}
						height={48}
						fillLinearGradientStartPoint={{ x: 0, y: 0 }}
						fillLinearGradientEndPoint={{ x: 0, y: 48 }}
						fillLinearGradientColorStops={[
							0,
							isButtonHovered ? "#1e40af" : "#0f172a",
							1,
							isButtonHovered ? "#3b82f6" : "#1e293b",
						]}
						stroke="#1e40af"
						strokeWidth={1}
						cornerRadius={24}
					/>
					{/* Tech accent border */}
					<Rect
						x={1}
						y={1}
						width={238}
						height={46}
						stroke={
							isButtonHovered
								? "rgba(59, 130, 246, 0.6)"
								: "rgba(59, 130, 246, 0.3)"
						}
						strokeWidth={1}
						cornerRadius={23}
					/>
					{/* Button text */}
					<Text
						x={120}
						y={24}
						text="Create Listing"
						fontSize={18}
						fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
						fontStyle="600"
						fill={isButtonHovered ? "#ffffff" : "#e2e8f0"}
						align="center"
						verticalAlign="middle"
						offsetX={60}
						offsetY={9}
					/>
				</Group>
			)}
		</Layer>
	);
}
