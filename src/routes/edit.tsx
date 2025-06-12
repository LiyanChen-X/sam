import { EditSidebar } from "@/components/EditSidebar";
import { useCanvasScale } from "@/hooks/use-canvas-scale";
import {
	cropImageByPath,
	fileToImageData,
	resizeCanvasToMaxSize,
	rleToImage,
	traceOnnxMaskToSVG,
} from "@/lib/image-helper";
import { calculateTooltipDimensions } from "@/lib/utils";
import {
	useModelScale,
	useRunLocalVisionInference,
	useRunSamModel,
	useSelectedImage,
} from "@/store";
import { ClickType } from "@/types/Click";
import type { Mask } from "@/types/Mask";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useEffect, useMemo, useState } from "react";
import { Image as KonvaImage, Layer, Rect, Stage, Text } from "react-konva";
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
	const { ref, scalingStyle, scaledDimensionsStyle } = useCanvasScale({
		canvasHeight,
		canvasWidth,
	});

	const [sticker, setSticker] = useState<HTMLCanvasElement>();
	const { runModel } = useRunSamModel();
	const [hoveringPrediction, setHoveringPrediction] =
		useState<ModelPrediction>();
	const [isHovering, setIsHovering] = useState(false);
	const [hoveringDescription, setHoveringDescription] = useState<string>("");
	const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

	const hoveringMask = useMemo(() => {
		if (!hoveringPrediction) {
			return null;
		}
		const { data, dims } = hoveringPrediction;
		return rleToImage(data, dims[0], dims[1]);
	}, [hoveringPrediction]);

	const { run: runVisionInference } = useRunLocalVisionInference();

	const onMouseMove = useDebouncedCallback(
		async (e: KonvaEventObject<MouseEvent>) => {
			if (isHovering) {
				const pos = e.target.getStage()?.getPointerPosition();
				if (!pos) {
					return;
				}

				// Update tooltip position
				setTooltipPos({ x: pos.x + 10, y: pos.y - 10 });
				let { x, y } = pos;
				x *= modelScale / canvasScale;
				y *= modelScale / canvasScale;
				const startTime = performance.now();
				const results = await runModel([
					{
						x,
						y,
						clickType: ClickType.POSITIVE,
					},
				]);
				const endTime = performance.now();
				console.log(`runModel took ${endTime - startTime} milliseconds`);
				const { data, dims } = results!;
				setHoveringPrediction({
					data,
					dims,
				});
			}
		},
	);

	const onMouseOut = () => {
		setHoveringPrediction(undefined);
		setIsHovering(false);
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
		};
		run();
	}, [hoveringSticker, image, runVisionInference]);

	const createSticker = async () => {
		if (!hoveringSticker) {
			return;
		}
		try {
			setSticker(hoveringSticker);
		} catch (error) {
			console.error("Error in createSticker:", error);
		}
	};

	const tooltipDimensions = useMemo(() => {
		if (!hoveringDescription) return { width: 200, height: 60, textWidth: 176 };
		return calculateTooltipDimensions(hoveringDescription, 24);
	}, [hoveringDescription]);

	if (!image) {
		navigate({
			to: "/",
		});
		return null;
	}

	return (
		<div className="h-screen w-screen flex items-center flex-row justify-center">
			<div className="flex-1 h-full flex flex-col items-center justify-center bg-gray-100">
				<div className=" size-3/4 flex flex-col items-center py-12 justify-center">
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
							<Stage
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
									{/* render click annotations here*/}
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
								<Layer name="tooltip" listening={false}>
									{isHovering && hoveringDescription && (
										<>
											{/* Shadow/backdrop for depth */}
											<Rect
												x={tooltipPos.x + 2}
												y={tooltipPos.y + 2}
												width={tooltipDimensions.width}
												height={tooltipDimensions.height}
												fill="rgba(0,0,0,0.3)"
												cornerRadius={8}
											/>
											{/* Main tooltip background */}
											<Rect
												x={tooltipPos.x}
												y={tooltipPos.y}
												width={tooltipDimensions.width}
												height={tooltipDimensions.height}
												fill="#1f2937"
												stroke="#60a5fa"
												strokeWidth={2}
												opacity={0.95}
												cornerRadius={8}
											/>
											{/* Tooltip text */}
											<Text
												x={tooltipPos.x + 12}
												y={tooltipPos.y + 12}
												text={hoveringDescription}
												fontSize={24}
												fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
												fontStyle="600"
												fill="white"
												width={tooltipDimensions.textWidth}
												wrap="word"
												lineHeight={1.4}
												align="left"
											/>
										</>
									)}
								</Layer>
							</Stage>
						</div>
					</div>
				</div>
			</div>

			<EditSidebar sticker={sticker} />
		</div>
	);
}
