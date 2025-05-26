import { useElementSize } from "./use-resize-observer";

type Props = {
	canvasHeight: number;
	canvasWidth: number;
};

export const useCanvasScale = ({ canvasHeight, canvasWidth }: Props) => {
	const {
		ref,
		width: containerWidth,
		height: containerHeight,
	} = useElementSize();

	const xScale = containerWidth / canvasHeight;
	const yScale = containerHeight / canvasHeight;
	const scale = Math.min(xScale, yScale);
	const scaledWidth = scale * canvasWidth;
	const scaledHeight = scale * canvasHeight;
	const scalingStyle = {
		transform: `scale(${scale})`,
		transformOrigin: "left top",
	};
	const scaledDimensionsStyle = {
		width: scaledWidth,
		height: scaledHeight,
	};

	return {
		ref,
		scalingStyle,
		scaledDimensionsStyle,
		scaledWidth,
		scaledHeight,
		containerWidth,
		containerHeight,
	};
};
