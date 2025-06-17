import Konva from "konva";
import { useEffect, useRef } from "react";
import { Circle } from "react-konva";

type ClickAnnotation = {
	x: number;
	y: number;
};

// Shining Circle Component
export const ShiningCircle = ({ x, y }: ClickAnnotation) => {
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

	return (
		<>
			{/* Outermost expanding circle */}
			<Circle
				ref={outerCircleRef}
				x={x}
				y={y}
				radius={15}
				fill="#60a5fa"
				opacity={0.6}
				listening={false}
			/>
			{/* Glow effect circle */}
			<Circle
				ref={glowCircleRef}
				x={x}
				y={y}
				radius={12}
				fill="#3b82f6"
				opacity={0.3}
				listening={false}
			/>
			{/* Inner pulsing circle */}
			<Circle
				ref={circleRef}
				x={x}
				y={y}
				radius={10}
				fill="#2563eb"
				stroke="#1d4ed8"
				strokeWidth={3}
				opacity={0.8}
				listening={false}
			/>
			{/* Center bright circle */}
			<Circle
				x={x}
				y={y}
				radius={5}
				fill="#60a5fa"
				stroke="white"
				strokeWidth={2}
				listening={false}
			/>
			{/* Center dot */}
			<Circle x={x} y={y} radius={2} fill="white" listening={false} />
		</>
	);
};
