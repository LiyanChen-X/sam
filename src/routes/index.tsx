import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/ui/image-uploader";
import { useInitSamModel, useSetSelectedImage } from "@/store";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	useInitSamModel();
	const { setImage, isLoading, image } = useSetSelectedImage();
	const navigate = useNavigate();
	return (
		<div className="flex flex-col h-screen  items-center justify-center">
			<ImageUploader
				onUpload={setImage}
				onRemove={() => {
					setImage(undefined);
				}}
			/>
			<div className="flex flex-col items-center justify-center mt-4">
				<Button
					disabled={isLoading || !image}
					onClick={() => {
						navigate({
							to: "/edit",
						});
					}}
				>
					{isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
					continue
				</Button>
			</div>
		</div>
	);
}
