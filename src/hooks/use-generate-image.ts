import { imageGenerator } from "@/lib/image-generator";
import type { Segment } from "@/types/Segment";
import { useQuery } from "@tanstack/react-query";

export function useGenerateImage(segment: Segment) {
	const { data, isPending, refetch } = useQuery({
		queryKey: ["generate-image", segment.id],
		queryFn: () => imageGenerator.getImageGeneration(segment),
		enabled: false,
		refetchOnWindowFocus: false,
		retry: false,
	});

	const generateImage = () => {
		refetch();
	};

	return {
		isGeneratingImage: isPending,
		generatedImage: data,
		generateImage,
	};
}
