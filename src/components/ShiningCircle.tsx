import Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useEffect, useRef } from "react";
import { Circle, Group } from "react-konva";

type Annotation = {
	x: number;
	y: number;
	onClick: () => void;
};

// Shining Circle Component
export const ShiningCircle = ({ x, y, onClick }: Annotation) => {
	const circleRef = useRef<Konva.Circle>(null);
	const outerCircleRef = useRef<Konva.Circle>(null);
	const glowCircleRef = useRef<Konva.Circle>(null);

	useEffect(() => {
		if (circleRef.current && outerCircleRef.current && glowCircleRef.current) {
			// Inner circle pulsing animation
			circleRef.current.to({
				scaleX: 1.3,
				scaleY: 1.3,
				opacity: 0.4,
				duration: 1.0,
				easing: Konva.Easings.EaseInOut,
				yoyo: true,
				repeat: -1,
			});

			// Outer circle expanding animation
			outerCircleRef.current.to({
				scaleX: 4,
				scaleY: 4,
				opacity: 0,
				duration: 1.8,
				easing: Konva.Easings.EaseOut,
				repeat: -1,
			});

			// Glow circle animation
			glowCircleRef.current.to({
				scaleX: 2.5,
				scaleY: 2.5,
				opacity: 0.1,
				duration: 1.5,
				easing: Konva.Easings.EaseInOut,
				yoyo: true,
				repeat: -1,
			});
		}
	}, []);

	const handleClick = (e: KonvaEventObject<MouseEvent>) => {
		e.cancelBubble = true;
		e.evt.preventDefault();
		e.evt.stopPropagation();
		onClick();
	};

	// Prevent mouse events from bubbling to stage
	const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
		e.cancelBubble = true;
	};

	const handleMouseEnter = (e: KonvaEventObject<MouseEvent>) => {
		e.cancelBubble = true;
	};

	const handleMouseLeave = (e: KonvaEventObject<MouseEvent>) => {
		e.cancelBubble = true;
	};

	return (
		<Group x={x} y={y}>
			{/* Invisible clickable area */}
			<Circle
				x={0}
				y={0}
				radius={25}
				fill="transparent"
				onClick={handleClick}
				onTap={handleClick}
				onMouseOut={handleMouseLeave}
				onMouseMove={handleMouseMove}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				cursor="pointer"
			/>

			{/* All other circles don't listen to any events */}
			<Circle
				ref={outerCircleRef}
				x={0}
				y={0}
				radius={15}
				fill="#60a5fa"
				opacity={0.6}
				listening={false}
			/>
			<Circle
				ref={glowCircleRef}
				x={0}
				y={0}
				radius={12}
				fill="#3b82f6"
				opacity={0.3}
				listening={false}
			/>
			<Circle
				ref={circleRef}
				x={0}
				y={0}
				radius={10}
				fill="#2563eb"
				stroke="#1d4ed8"
				strokeWidth={3}
				opacity={0.8}
				listening={false}
			/>
			<Circle
				x={0}
				y={0}
				radius={5}
				fill="#60a5fa"
				stroke="white"
				strokeWidth={2}
				listening={false}
			/>
			<Circle x={0} y={0} radius={2} fill="white" listening={false} />
		</Group>
	);
};
