import api from "@/lib/ajax";
import { imageToBlob, translateClickToTensors } from "@/lib/image-helper";
import type { Click } from "@/types/Click";
import type { ModelScale } from "@/types/Scale";
import { useQuery } from "@tanstack/react-query";
import { InferenceSession, Tensor, type TypedTensor } from "onnxruntime-web";
import { useCallback, useEffect } from "react";
import { create } from "zustand";

interface AppState {
	image: File | undefined;
	model: InferenceSession | undefined;
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
}

const API_ENDPOINT =
	"https://model-zoo.metademolab.com/predictions/segment_everything_box_model";
const MODEL_DIR =
	"https://lins-cdn.sensoro.com/lins-cdn/model/interactive_module_quantized_592547_2023_03_19_sam6_long_uncertain.onnx";

const useAppStore = create<AppState & AppActions>((set) => ({
	image: undefined,
	model: undefined,
	scale: undefined,
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

export const useRunModel = () => {
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
			return output;
		},
		[modelScale, model, tensors],
	);

	return {
		model,
		runModel,
	};
};

export const useClicks = () => {
	const clicks = useAppStore((store) => store.clicks);
	const setClicks = useAppStore((store) => store.setClicks);
	const { runModel } = useRunModel();
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
