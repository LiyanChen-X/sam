import { EditSidebar } from "@/components/EditSidebar";
import { useCanvasScale } from "@/hooks/use-canvas-scale";
import {
	cropImageByPath,
	fileToImageData,
	resizeCanvasToMaxSize,
	rleToImage,
	traceOnnxMaskToSVG,
} from "@/lib/image-helper";
import {
	useClicks,
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
import { useMemo, useState } from "react";
import { Layer, Stage } from "react-konva";
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
				const { data, dims } = results!;
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

	const { runModel: runVisionInference } = useRunLocalVisionInference();

	const createSticker = async () => {
		if (!fullImage || !hoveringSVG) {
			return;
		}

		// Start total time measurement
		const totalStartTime = performance.now();

		try {
			// Measure fileToImageData performance
			const fileToImageDataStartTime = performance.now();
			const contextImage = await fileToImageData(image!);
			const fileToImageDataEndTime = performance.now();
			const fileToImageDataTime =
				fileToImageDataEndTime - fileToImageDataStartTime;

			const sticker = cropImageByPath(
				fullImage!,
				hoveringSVG.join(" "),
				width,
				height,
				uploadScale,
			);

			if (sticker) {
				const resizedSticker = resizeCanvasToMaxSize(sticker, 400);

				const stickerImageData = resizedSticker
					.getContext("2d")!
					.getImageData(0, 0, resizedSticker.width, resizedSticker.height);

				// Measure runVisionInference performance
				const runVisionInferenceStartTime = performance.now();
				const result = await runVisionInference(contextImage, stickerImageData);
				const runVisionInferenceEndTime = performance.now();
				const runVisionInferenceTime =
					runVisionInferenceEndTime - runVisionInferenceStartTime;

				// Calculate total time
				const totalEndTime = performance.now();
				const totalTime = totalEndTime - totalStartTime;

				// Log performance metrics
				console.group("🚀 Vision Inference Performance Metrics");
				console.log(
					`📁 File to ImageData: ${fileToImageDataTime.toFixed(2)}ms`,
				);
				console.log(
					`🧠 Vision Inference: ${runVisionInferenceTime.toFixed(2)}ms`,
				);
				console.log(`⏱️ Total Time: ${totalTime.toFixed(2)}ms`);
				console.log(
					`📐 Context Image Size: ${contextImage.width}x${contextImage.height}`,
				);
				console.log(
					`✂️ Sticker Image Size: ${stickerImageData.width}x${stickerImageData.height}`,
				);
				console.log("📊 Result:", result);
				console.groupEnd();
			}

			setSticker(sticker);
		} catch (error) {
			console.error("Error in createSticker:", error);

			// Log error with timing
			const totalEndTime = performance.now();
			const totalTime = totalEndTime - totalStartTime;
			console.log(`❌ Error occurred after ${totalTime.toFixed(2)}ms`);
		}
	};

	if (!image) {
		navigate({
			to: "/",
		});
		return null;
	}

	return (
		<div className="h-screen w-screen flex items-center flex-row justify-center">
			<div className="flex-1 h-full flex flex-col items-center py-12 justify-center bg-gray-100">
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
							onClick={(e) => {
								createSticker();
							}}
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

			<EditSidebar sticker={sticker} />
		</div>
	);
}
