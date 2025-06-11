import api from "@/lib/ajax";
import { imageToBlob, translateClickToTensors } from "@/lib/image-helper";
import type { Click } from "@/types/Click";
import type { ModelScale } from "@/types/Scale";
import {
	AutoModelForVision2Seq,
	AutoProcessor,
	type PreTrainedModel,
	RawImage,
	type Tensor as TransformerTensor,
	env,
} from "@huggingface/transformers";
import { useQuery } from "@tanstack/react-query";
import { InferenceSession, Tensor, type TypedTensor } from "onnxruntime-web";
import { useCallback, useEffect } from "react";
import { create } from "zustand";

env.useBrowserCache = true;

interface AppState {
	image: File | undefined;
	model: InferenceSession | undefined;
	smolVLMModel: PreTrainedModel | undefined;
	smolVLMModelProcessor: any | undefined;
	clicks: Click[];
	scale: ModelScale | undefined;
	lowResTensors: TypedTensor<"float32"> | undefined;
}

interface AppActions {
	setImage: (image: File | undefined) => void;
	setModel: (model: InferenceSession) => void;
	setClicks: (clicks: Click[]) => void;
	setScale: (scale: ModelScale) => void;
	setTensor: (tensor: TypedTensor<"float32">) => void;
	setSmolVLMModel: (model: PreTrainedModel) => void;
	setSmolVLMModelProcessor: (processor: any) => void;
}

const API_ENDPOINT =
	"https://model-zoo.metademolab.com/predictions/segment_everything_box_model";
const MODEL_DIR =
	"https://lins-cdn.sensoro.com/lins-cdn/model/interactive_module_quantized_592547_2023_03_19_sam6_long_uncertain.onnx";

const useAppStore = create<AppState & AppActions>((set) => ({
	image: undefined,
	model: undefined,
	scale: undefined,
	smolVLMModel: undefined,
	smolVLMModelProcessor: undefined,
	clicks: [],
	lowResTensors: undefined,
	setModel(model) {
		set({
			model,
		});
	},
	setImage: (image) => {
		set({
			image,
		});
	},
	setClicks: (clicks) => {
		set({
			clicks,
		});
	},
	setScale: (scale) => {
		set({
			scale,
		});
	},
	setTensor: (tensor) => {
		set({
			lowResTensors: tensor,
		});
	},
	setSmolVLMModel: (model) => {
		set({
			smolVLMModel: model,
		});
	},
	setSmolVLMModelProcessor: (processor) =>
		set({
			smolVLMModelProcessor: processor,
		}),
}));

export const useInitSamModel = () => {
	const setModel = useAppStore((state) => state.setModel);
	useEffect(() => {
		const initModel = async () => {
			const model = await InferenceSession.create(MODEL_DIR);
			setModel(model);
		};
		initModel();
	}, [setModel]);
};

export const useInitSmolVLMModel = () => {
	const setSmolVLMModel = useAppStore((state) => state.setSmolVLMModel);
	const setSmolVLMModelProcessor = useAppStore(
		(state) => state.setSmolVLMModelProcessor,
	);
	// alternative:"HuggingFaceTB/SmolVLM-Instruct";
	const modelId = "HuggingFaceTB/SmolVLM-500M-Instruct";
	useEffect(() => {
		const initModel = async () => {
			const [processor, model] = await Promise.all([
				AutoProcessor.from_pretrained(modelId, {}),
				AutoModelForVision2Seq.from_pretrained(modelId, {
					dtype: {
						embed_tokens: "fp16",
						vision_encoder: "q4",
						decoder_model_merged: "q4",
					},
					device: "webgpu",
				}),
			]);
			setSmolVLMModel(model);
			setSmolVLMModelProcessor(processor);
		};
		initModel();
	}, [setSmolVLMModel, setSmolVLMModelProcessor]);
};

export const useRunLocalVisionInference = () => {
	const model = useAppStore((state) => state.smolVLMModel);
	const processor = useAppStore((state) => state.smolVLMModelProcessor);
	const runModel = useCallback(
		async (contextImage: ImageData, selectedObjectImage: ImageData) => {
			if (!model || !processor) {
				throw new Error("Model or processor not initialized");
			}

			const contextRawImage = new RawImage(
				contextImage.data,
				contextImage.width,
				contextImage.height,
				4,
			);
			const selectedObjectRawImage = new RawImage(
				selectedObjectImage.data,
				selectedObjectImage.width,
				selectedObjectImage.height,
				4,
			);

			const messages = [
				{
					role: "system",
					content: [
						{
							type: "text",
							text: `You will be provided with two images:
                                    1. A context image showing multiple objects
                                    2. A selected object that was segmented from the context image

                                    Your task is to generate a brief product description for the selected object. 
                                                                        
                                    Keep it under 30 words. Focus only on:
                                    - Product name
                                    - Color
                                    - Material
                                    - One key feature
                                    
                                    Do not include any explanations or additional text!`,
						},
					],
				},
				{
					role: "user",
					content: [
						{ type: "text", text: "Context image:" },
						{ type: "image", image: contextRawImage },
						{ type: "text", text: "Selected object:" },
						{ type: "image", image: selectedObjectRawImage },
						{
							type: "text",
							text: "Brief description (max 15 words):",
						},
					],
				},
			];

			const text = processor.apply_chat_template(messages, {
				add_generation_prompt: true,
			});

			const inputs = await processor(
				text,
				[contextRawImage, selectedObjectRawImage],
				{
					do_image_splitting: false,
				},
			);

			const generatedIds = (await model.generate({
				...inputs,
				max_new_tokens: 200,
			})) as TransformerTensor;

			const output = processor.batch_decode(
				generatedIds.slice(null, [inputs.input_ids.dims.at(-1), null]),
				{ skip_special_tokens: true },
			);

			return output[0].trim();
		},
		[model, processor],
	);
	return {
		runModel,
	};
};

export const useSetSelectedImage = () => {
	const image = useAppStore((state) => state.image);
	const setImage = useAppStore((state) => state.setImage);
	const setScale = useAppStore((state) => state.setScale);
	const setTensors = useAppStore((state) => state.setTensor);
	const { data, isLoading } = useQuery({
		queryKey: [image?.name],
		enabled: !!image,
		queryFn: async () => {
			const { blob, scale } = (await imageToBlob(image!)) as {
				blob: Blob;
				scale: ModelScale;
			};
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const data = await api.post<any>(API_ENDPOINT, blob);
			const embeddings = data.map((arrStr: string) => {
				const binaryString = window.atob(arrStr);
				const uint8arr = new Uint8Array(binaryString.length);
				for (let i = 0; i < binaryString.length; i++) {
					uint8arr[i] = binaryString.charCodeAt(i);
				}
				const float32Arr = new Float32Array(uint8arr.buffer);
				return float32Arr;
			});
			const lowResTensor = new Tensor(
				"float32",
				embeddings[0],
				[1, 256, 64, 64],
			);
			return {
				blob,
				scale,
				lowResTensor,
			};
		},
	});

	useEffect(() => {
		if (data) {
			setScale(data.scale);
			setTensors(data.lowResTensor);
		}
	}, [data, setScale, setTensors]);
	return {
		setImage,
		isLoading,
		image,
	};
};

export const useModelScale = () => {
	return useAppStore((store) => store.scale);
};

export const useSelectedImage = () => {
	return useAppStore((store) => store.image);
};

export const useRunSamModel = () => {
	const model = useAppStore((state) => state.model);
	const modelScale = useAppStore((state) => state.scale);
	const tensors = useAppStore((state) => state.lowResTensors);
	const runModel = useCallback(
		async (clicks: Click[]) => {
			if (!model || !modelScale || !tensors) {
				return;
			}
			const { pointCoordsTensor, pointLabelsTensor, imageSizeTensor } =
				translateClickToTensors(clicks, modelScale!);
			const output = await model.run({
				low_res_embedding: tensors,
				point_coords: pointCoordsTensor,
				point_labels: pointLabelsTensor,
				image_size: imageSizeTensor,
				last_pred_mask: new Tensor(
					"float32",
					new Float32Array(256 * 256),
					[1, 1, 256, 256],
				),
				has_last_pred: new Tensor("float32", [0]),
			});
			return output[model.outputNames[0]];
		},
		[modelScale, model, tensors],
	);

	return {
		runModel,
	};
};

export const useClicks = () => {
	const clicks = useAppStore((store) => store.clicks);
	const setClicks = useAppStore((store) => store.setClicks);
	const { runModel } = useRunSamModel();
	const addClick = useCallback(
		(click: Click) => {
			setClicks([...clicks, click]);
		},
		[setClicks, clicks],
	);
	const resetClick = useCallback(() => {
		setClicks([]);
	}, [setClicks]);

	useEffect(() => {
		runModel(clicks);
	}, [clicks, runModel]);

	return {
		addClick,
		clicks,
		resetClick,
	};
};

export const useHoverMask = () => {};
