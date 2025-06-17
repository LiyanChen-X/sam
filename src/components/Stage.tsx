type Props = {
	image: File;
};
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
	useActiveSegment,
	useModelScale,
	useRunLocalVisionInference,
	useRunSamModel,
} from "@/store";
import { ClickType } from "@/types/Click";
import type { Segment } from "@/types/Segment";
import { generateId } from "ai";
import Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useMemo, useState } from "react";
import { Image as KonvaImage, Stage as KonvaStage, Layer } from "react-konva";
import { useDebouncedCallback } from "use-debounce";

Konva.pixelRatio = 1;

const MAX_CANVAS_AREA = 1677721;
const HOVERING_SEGMENT_ID = "hovering-segment";
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
	const { runModel } = useRunSamModel();
	const [isHovering, setIsHovering] = useState(false);
	const [refPos, setRefPos] = useState({ x: 0, y: 0 });
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
	const { activeSegment, setActiveSegment } = useActiveSegment();
	const [hoveringSegment, setHoveringSegment] = useState<Segment | undefined>();

	const hoveringMask = useMemo(() => {
		if (!hoveringSegment) {
			return null;
		}
		const { data, dims } = hoveringSegment;
		return rleToImage(data, dims[0], dims[1]);
	}, [hoveringSegment]);

	const selectedMask = useMemo(() => {
		if (!activeSegment) {
			return null;
		}
		const { data, dims } = activeSegment;
		return rleToImage(data, dims[0], dims[1], {
			r: 59,
			g: 130,
			b: 246,
			a: 120,
		});
	}, [activeSegment]);

	const activeSegmentAnnotation = useMemo(() => {
		if (!activeSegment) {
			return null;
		}
		const { data, dims } = activeSegment;

		const maskWidth = dims[0];
		const maskHeight = dims[1];
		const { x, y } = getMaskCenter(data, maskHeight, maskWidth);
		const canvasX = (x / uploadScale) * canvasScale;
		const canvasY = (y / uploadScale) * canvasScale;

		return {
			x: canvasX,
			y: canvasY,
		};
	}, [activeSegment, uploadScale, canvasScale]);

	const { run: runVisionInference } = useRunLocalVisionInference();

	const onMouseMove = useDebouncedCallback(
		async (e: KonvaEventObject<MouseEvent>) => {
			if (activeSegment || !isHovering) {
				return;
			}
			const stage = e.target.getStage();
			const pos = stage?.getPointerPosition();
			if (!pos) {
				return;
			}

			const startTime = performance.now();
			console.group("🖱️ Mouse Move Processing");

			let { x, y } = pos;
			x *= modelScale / canvasScale;
			y *= modelScale / canvasScale;

			const modelStartTime = performance.now();
			const results = await runModel([
				{
					x,
					y,
					clickType: ClickType.POSITIVE,
				},
			]);
			const modelEndTime = performance.now();
			console.log(
				`🤖 Model inference: ${(modelEndTime - modelStartTime).toFixed(2)}ms`,
			);

			const { data, dims } = results!;

			const processingStartTime = performance.now();
			const hoveringSVG = traceOnnxMaskToSVG(data, dims[1], dims[0]);
			const sticker = cropImageByPath(
				fullImage!,
				hoveringSVG.join(" "),
				width,
				height,
				uploadScale,
			)!;
			const contextImage = await fileToImageData(image!);
			const stickerImage = resizeCanvasToMaxSize(sticker!);
			const processingEndTime = performance.now();
			console.log(
				`🖼️ Image processing: ${(processingEndTime - processingStartTime).toFixed(2)}ms`,
			);

			const visionStartTime = performance.now();
			const description = await runVisionInference(
				contextImage,
				stickerImage
					.getContext("2d")
					?.getImageData(0, 0, stickerImage.width, stickerImage.height)!,
			);
			const visionEndTime = performance.now();
			console.log(
				`👁️ Vision inference: ${(visionEndTime - visionStartTime).toFixed(2)}ms`,
			);

			const totalTime = performance.now() - startTime;
			console.log(`⏱️ Total time: ${totalTime.toFixed(2)}ms`);
			console.groupEnd();

			setHoveringSegment({
				id: HOVERING_SEGMENT_ID,
				sticker,
				description,
				data,
				dims,
			});
			setRefPos(pos);
		},
		25,
	);

	const onMouseOut = () => {
		console.log("Mouse out of stage");
		setIsHovering(false);
		setHoveringSegment(undefined);
	};

	const onMouseEnter = () => {
		setHoveringSegment(undefined);
		setIsHovering(true);
	};

	const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
		const stage = e.target.getStage();
		const pos = stage?.getPointerPosition();
		if (!pos) return;

		if (!hoveringSegment) {
			return;
		}

		const { data, dims } = hoveringSegment;

		const maskWidth = dims[0];
		const maskHeight = dims[1];
		const { x, y } = getMaskCenter(data, maskHeight, maskWidth);
		const canvasX = (x / uploadScale) * canvasScale;
		const canvasY = (y / uploadScale) * canvasScale;

		setRefPos({
			x: canvasX,
			y: canvasY,
		});
		setHoveringSegment(undefined);
		setActiveSegment({
			...hoveringSegment,
			id: generateId(),
		});
	};

	const canvasDimensions = useMemo(
		() => ({
			width: canvasWidth,
			height: canvasHeight,
		}),
		[canvasWidth, canvasHeight],
	);

	const isTooltipVisible = !!(activeSegment || hoveringSegment);
	const tooltipContent =
		activeSegment?.description || hoveringSegment?.description || "";
	const showTooltipAction = !!activeSegment;

	return (
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
							onClick={handleStageClick}
						>
							<Layer name="annotations">
								{activeSegmentAnnotation && (
									<ShiningCircle
										x={activeSegmentAnnotation.x}
										y={activeSegmentAnnotation.y}
										onClick={() => {
											setActiveSegment(undefined);
										}}
									/>
								)}
							</Layer>
							<Layer name="selectedMask">
								{selectedMask && (
									<KonvaImage
										image={selectedMask}
										width={canvasWidth}
										height={canvasHeight}
										opacity={0.5}
										listening={false}
									/>
								)}
							</Layer>
							<Layer name="hoveringMask">
								{hoveringMask && isHovering && (
									<KonvaImage
										image={hoveringMask}
										width={canvasWidth}
										height={canvasHeight}
										opacity={0.4}
										listening={false}
									/>
								)}
							</Layer>
							{isTooltipVisible && (
								<Tooltip
									isVisible={isTooltipVisible}
									description={tooltipContent}
									refPosition={refPos}
									canvasDimensions={canvasDimensions}
									showTooltipAction={showTooltipAction}
									onCancel={() => {
										setActiveSegment(undefined);
									}}
									onProceed={() => {
										console.log("proceed");
									}}
								/>
							)}
						</KonvaStage>
					</div>
				</div>
			</div>
		</div>
	);
}
