import { fileToBase64, svgToBase64 } from "@/lib/image-helper";
import { useMutation } from "@tanstack/react-query";

// TODO: move the API call to backend
export function useGenerateImage(
	contextImage: File | undefined,
	selectedObjectImage: HTMLCanvasElement | undefined,
	description: string,
) {
	const {
		mutateAsync: generateImage,
		isPending,
		data,
	} = useMutation({
		mutationKey: ["generate-image"],
		mutationFn: async () => {
			const formData = new FormData();
			if (!contextImage || !selectedObjectImage) {
				return;
			}
			formData.append("contextImage", await fileToBase64(contextImage));
			formData.append("croppedObject", svgToBase64(selectedObjectImage));
			const response = await fetch("/api/generate-image", {
				method: "POST",
				body: formData,
			});
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}
			const { result } = await response.json();
			return result;
		},
	});

	return {
		generateImage,
		isGeneratingImage: isPending,
		generatedImage: data,
	};
}
