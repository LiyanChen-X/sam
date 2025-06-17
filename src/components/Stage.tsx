type Props = {
	image: File;
};
import { EditSidebar } from "@/components/EditSidebar";
import { ShiningCircle } from "@/components/ShiningCircle";
import { Tooltip } from "@/components/Tooltip";
import { useCanvasScale } from "@/hooks/use-canvas-scale";
import {
	cropImageByPath,
	fileToImageData,
	getMaskCenter,
	resizeCanvasToMaxSize,
	rleToImage,
	traceOnnxMaskToSVG,
} from "@/lib/image-helper";
import {
	useModelScale,
	useRunLocalVisionInference,
	useRunSamModel,
} from "@/store";
import { ClickType } from "@/types/Click";
import type { Mask } from "@/types/Mask";
import Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useEffect, useMemo, useState } from "react";
import { Image as KonvaImage, Stage as KonvaStage, Layer } from "react-konva";
import { useDebouncedCallback } from "use-debounce";

type ModelPrediction = {
	data: Mask;
	dims: readonly number[];
};

Konva.pixelRatio = 1;

const MAX_CANVAS_AREA = 1677721;

export function Stage({ image }: Props) {
	const {
		width = 0,
		height = 0,
		scale: modelScale = 1,
		uploadScale = 1,
	} = useModelScale() || {};
	const area = width * height;
	const canvasScale =
		area > MAX_CANVAS_AREA ? Math.sqrt(MAX_CANVAS_AREA / area) : 1;
	const canvasWidth = Math.floor(width * canvasScale);
	const canvasHeight = Math.floor(height * canvasScale);
	const { ref, scalingStyle, scaledDimensionsStyle } = useCanvasScale({
		canvasHeight,
		canvasWidth,
	});

	const [sticker, setSticker] = useState<HTMLCanvasElement>();
	const [stickerDescription, setStickerDescription] = useState<string>();
	const { runModel } = useRunSamModel();
	const [hoveringPrediction, setHoveringPrediction] =
		useState<ModelPrediction>();
	const [isHovering, setIsHovering] = useState(false);
	const [hoveringDescription, setHoveringDescription] = useState<string>("");
	const [tooltipOpacity, setTooltipOpacity] = useState(0);
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

	const hoveringMask = useMemo(() => {
		if (!hoveringPrediction) {
			return null;
		}
		const { data, dims } = hoveringPrediction;
		return rleToImage(data, dims[0], dims[1]);
	}, [hoveringPrediction]);

	const hoveringPredictionAnnotation = useMemo(() => {
		if (!hoveringPrediction) {
			return null;
		}
		const { data, dims } = hoveringPrediction;

		// The dims array contains [width, height] from the model output
		// But getMaskCenter expects (width, height) parameters in that order
		const maskWidth = dims[0];
		const maskHeight = dims[1];

		const { x, y } = getMaskCenter(data, maskHeight, maskWidth);

		// Convert from model coordinates to canvas coordinates
		// The mask coordinates are in the upload scale coordinate system
		// We need to convert to canvas coordinates for display
		const canvasX = (x / uploadScale) * canvasScale;
		const canvasY = (y / uploadScale) * canvasScale;

		return {
			x: canvasX,
			y: canvasY,
		};
	}, [hoveringPrediction, uploadScale, canvasScale]);

	const { run: runVisionInference } = useRunLocalVisionInference();

	const onMouseMove = useDebouncedCallback(
		async (e: KonvaEventObject<MouseEvent>) => {
			const stage = e.target.getStage();
			const pos = stage?.getPointerPosition();
			if (!pos) {
				return;
			}
			if (!isHovering) {
				return;
			}
			setMousePos(pos);
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

			const { data, dims } = results!;
			setHoveringPrediction({
				data,
				dims,
			});
		},
		100,
	);

	const onMouseOut = () => {
		setHoveringPrediction(undefined);
		setIsHovering(false);
		setTooltipOpacity(0);
	};

	const onMouseEnter = () => {
		setHoveringPrediction(undefined);
		setIsHovering(true);
	};

	const { fullImageUrl, fullImage } = useMemo(() => {
		if (image) {
			const url = URL.createObjectURL(image!);
			const img = new window.Image();
			img.src = url;
			return {
				fullImageUrl: url,
				fullImage: img,
			};
		}
		return {
			fullImageUrl: null,
			fullImage: null,
		};
	}, [image]);

	const hoveringSticker = useMemo(() => {
		if (!hoveringPrediction) {
			return null;
		}
		const { data, dims } = hoveringPrediction;
		const hoveringSVG = traceOnnxMaskToSVG(data, dims[1], dims[0]);
		const sticker = cropImageByPath(
			fullImage!,
			hoveringSVG.join(" "),
			width,
			height,
			uploadScale,
		);
		return sticker;
	}, [hoveringPrediction, width, height, uploadScale, fullImage]);

	useEffect(() => {
		if (!hoveringSticker) {
			return;
		}
		const run = async () => {
			const contextImage = await fileToImageData(image!);
			const stickerImage = resizeCanvasToMaxSize(hoveringSticker);
			const result = await runVisionInference(
				contextImage,
				stickerImage
					.getContext("2d")
					?.getImageData(0, 0, stickerImage.width, stickerImage.height)!,
			);
			setHoveringDescription(result);
			// Fade in tooltip when description is ready
			setTooltipOpacity(1);
		};
		run();
	}, [hoveringSticker, image, runVisionInference]);

	const createSticker = async () => {
		if (!hoveringSticker || !hoveringPrediction) {
			return;
		}
		try {
			setSticker(hoveringSticker);
			setStickerDescription(hoveringDescription);
		} catch (error) {
			console.error("Error in createSticker:", error);
		}
	};

	const canvasDimensions = useMemo(
		() => ({
			width: canvasWidth,
			height: canvasHeight,
		}),
		[canvasWidth, canvasHeight],
	);
	return (
		<div className="h-screen w-screen flex items-center flex-row justify-center">
			<div className="flex-1 h-full flex flex-col items-center justify-center bg-gray-100">
				<div className=" size-3/4 flex flex-col items-center py-4 justify-center">
					<div
						id="container"
						className="size-full relative flex items-center justify-center box-border"
						ref={ref}
					>
						<div className="relative" style={scaledDimensionsStyle}>
							<img
								src={fullImageUrl!}
								className="size-full absolute pointer-events-none"
							/>
							<KonvaStage
								width={canvasWidth}
								height={canvasHeight}
								style={scalingStyle}
								onMouseMove={onMouseMove}
								onMouseOut={onMouseOut}
								onMouseEnter={onMouseEnter}
								onClick={() => {
									createSticker();
								}}
							>
								<Layer name="annotations">
									{
										<ShiningCircle
											x={hoveringPredictionAnnotation?.x || 0}
											y={hoveringPredictionAnnotation?.y || 0}
										/>
									}
								</Layer>
								<Layer name="hoveringMask">
									{hoveringMask && (
										<KonvaImage
											image={hoveringMask}
											width={canvasWidth}
											height={canvasHeight}
											opacity={0.4}
											listening={false}
										/>
									)}
								</Layer>
								<Tooltip
									isVisible={isHovering && !!hoveringDescription}
									description={hoveringDescription}
									mousePos={mousePos}
									canvasDimensions={canvasDimensions}
									opacity={tooltipOpacity}
								/>
							</KonvaStage>
						</div>
					</div>
				</div>
			</div>
			<EditSidebar sticker={sticker} description={stickerDescription} />
		</div>
	);
}
