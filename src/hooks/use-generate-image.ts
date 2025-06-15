import { imageDataToBase64 } from "@/lib/image-helper";
import { useMutation } from "@tanstack/react-query";

// TODO: move the API call to backend
export function useGenerateImage(
	contextImage: ImageData,
	selectedObjectImage: ImageData,
) {
	const contextImageBase64 = imageDataToBase64(contextImage);
	const selectedObjectImageBase64 = imageDataToBase64(selectedObjectImage);
	const formData = new FormData();
	formData.append("contextImage", contextImageBase64);
	formData.append("croppedObject", selectedObjectImageBase64);

	const {
		mutateAsync: generateImage,
		isPending,
		data,
	} = useMutation({
		mutationKey: ["generate-image"],
		mutationFn: async () => {
			const response = await fetch("/api/generate-image", {
				method: "POST",
				body: formData,
			});
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}
			return response.json();
		},
	});

	return {
		generateImage,
		isGeneratingImage: isPending,
		generatedImage: data,
	};
}
