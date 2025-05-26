import { useCanvasScale } from "@/hooks/use-canvas-scale";
import {
	cropImageByPath,
	rleToImage,
	traceOnnxMaskToSVG,
} from "@/lib/image-helper";
import {
	useClicks,
	useModelScale,
	useRunModel,
	useSelectedImage,
} from "@/store";
import { ClickType } from "@/types/Click";
import type { Mask } from "@/types/Mask";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useCallback, useMemo, useState } from "react";
import { Circle, Image, Layer, Path, Rect, Ring, Stage } from "react-konva";
import { useDebouncedCallback } from "use-debounce";

export const Route = createFileRoute("/edit")({
	component: RouteComponent,
});

Konva.pixelRatio = 1;

const MAX_CANVAS_AREA = 1677721;

type ModelPrediction = {
	data: Mask;
	dims: readonly number[];
};

function RouteComponent() {
	const {
		width = 0,
		height = 0,
		scale: modelScale = 1,
		uploadScale = 1,
	} = useModelScale() || {};
	const navigate = useNavigate();
	const area = width * height;
	const canvasScale =
		area > MAX_CANVAS_AREA ? Math.sqrt(MAX_CANVAS_AREA / area) : 1;
	const canvasWidth = Math.floor(width * canvasScale);
	const canvasHeight = Math.floor(height * canvasScale);
	const image = useSelectedImage();
	const {
		ref,
		scalingStyle,
		scaledDimensionsStyle,
		scaledWidth,
		scaledHeight,
		containerWidth,
		containerHeight,
	} = useCanvasScale({
		canvasHeight,
		canvasWidth,
	});

	const { clicks, resetClick } = useClicks();
	const { model, runModel } = useRunModel();
	const [hoveringPrediction, setHoveringPrediction] =
		useState<ModelPrediction>();
	const [isHovering, setIsHovering] = useState(false);

	const hoveringMask = useMemo(() => {
		if (!hoveringPrediction) {
			return null;
		}
		const { data, dims } = hoveringPrediction;
		return rleToImage(data, dims[0], dims[1]);
	}, [hoveringPrediction]);

	const hoveringSVG = useMemo(() => {
		if (!hoveringPrediction) {
			return null;
		}
		const { data, dims } = hoveringPrediction;
		return traceOnnxMaskToSVG(data, dims[1], dims[0]);
	}, [hoveringPrediction]);

	const onMouseMove = useDebouncedCallback(
		async (e: KonvaEventObject<MouseEvent>) => {
			if (isHovering) {
				const pos = e.target.getStage()?.getPointerPosition();
				if (!pos) {
					return;
				}
				let { x, y } = pos;
				x *= modelScale / canvasScale;
				y *= modelScale / canvasScale;
				const results = await runModel([
					{
						x,
						y,
						clickType: ClickType.POSITIVE,
					},
				]);
				const { data, dims } = results![model!.outputNames[0]];
				setHoveringPrediction({
					data,
					dims,
				});
			}
		},
		100,
	);

	const onMouseOut = () => {
		setHoveringPrediction(undefined);
		setIsHovering(false);
	};

	const onMouseEnter = () => {
		setHoveringPrediction(undefined);
		setIsHovering(true);
	};

	const { url, img } = useMemo(() => {
		if (image) {
			const url = URL.createObjectURL(image!);
			const img = new window.Image();
			img.src = url;
			return {
				url,
				img,
			};
		}
		return {
			url: null,
			img: null,
		};
	}, [image]);

	const createSticker = () => {
		if (!img || !hoveringSVG) {
			return;
		}
		const sticker = cropImageByPath(
			img!,
			hoveringSVG.join(" "),
			width,
			height,
			uploadScale,
		);
	};

	if (!image) {
		navigate({
			to: "/",
		});
		return null;
	}

	return (
		<div className="h-screen w-screen flex items-center flex-col justify-center">
			<div
				id="container"
				className="w-2/3 relative flex items-center justify-center"
				ref={ref}
			>
				<div className="relative" style={scaledDimensionsStyle}>
					<img src={url} className="size-full absolute pointer-events-none" />
					<Stage
						width={canvasWidth}
						height={canvasHeight}
						style={scalingStyle}
						onMouseMove={onMouseMove}
						onMouseOut={onMouseOut}
						onMouseEnter={onMouseEnter}
					>
						<Layer name="annotations">
							{/* render click annotations here*/}
						</Layer>
					</Stage>
					{hoveringMask && (
						<img
							src={hoveringMask.src}
							className="absolute top-0 opacity-40 pointer-events-none w-full h-full m-0"
						/>
					)}
				</div>
			</div>
		</div>
	);
}
