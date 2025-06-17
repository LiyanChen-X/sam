import { Button } from "@/components/ui/button";
import { useGenerateImage } from "@/hooks/use-generate-image";
import { cn } from "@/lib/utils";
import { useSelectedImage } from "@/store";
import type { Segment } from "@/types/Segment";
import { motion } from "framer-motion";
import { useState } from "react";
import { ListingForm } from "./ListingForm";

type Props = {
	segment: Segment;
};

export function SegmentEditor({ segment }: Props) {
	const [showEditSection, setShowEditSection] = useState(false);
	const contextImage = useSelectedImage();
	const { description, sticker } = segment;
	const { generateImage, isGeneratingImage, generatedImage } = useGenerateImage(
		contextImage,
		sticker,
		description || "",
	);

	const handleCreateListing = () => {
		setShowEditSection(true);
	};

	const handlePublish = (data: any) => {
		console.log("Publishing listing...", data);
	};

	const handleCancel = () => {
		setShowEditSection(false);
	};

	return (
		<motion.div
			key="sticker-container"
			className={cn(
				"flex flex-col border border-gray-300 bg-gray-100 rounded-lg shadow-md",
				showEditSection ? "mt-2 w-full flex-1" : " my-auto max-w-full",
			)}
			layout
			transition={{ duration: 0.5, ease: "easeInOut" }}
		>
			{/* Image Section */}
			<motion.div
				className={cn(
					"flex justify-center flex-col items-center gap-2 p-6 w-full",
					showEditSection ? "border-b border-gray-300" : "",
				)}
				layout
				transition={{ duration: 0.3 }}
			>
				<motion.img
					className={cn(
						"cursor-pointer rounded-md",
						showEditSection
							? " max-h-[240px] object-cover "
							: "max-w-[75%] max-h-20 md:max-h-24 lg:max-h-28 xl:max-h-32",
					)}
					alt="sticker"
					src={sticker!.toDataURL()}
					layout
					transition={{ duration: 0.3 }}
				/>

				{isGeneratingImage && (
					<motion.div
						className="flex items-center justify-center w-full h-10 bg-gray-300 rounded-md"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.3 }}
					>
						<p className="text-sm text-gray-700">Generating image...</p>
					</motion.div>
				)}

				{!showEditSection && (
					<div className="flex flex-col gap-2">
						<hr className="w-full border-gray-300 my-1" />
						<div className="flex flex-col gap-4 w-full">
							<div className="flex items-center justify-center w-full rounded-lg p-2 bg-gray-200">
								<p className="text-xs text-secondary-foreground">
									{description}
								</p>
							</div>

							<Button
								className="w-full shadow-sm text-white font-medium py-2"
								onClick={handleCreateListing}
							>
								Create Listing
							</Button>
						</div>
					</div>
				)}
			</motion.div>

			<motion.div
				className="overflow-hidden"
				initial={false}
				animate={{
					height: showEditSection ? "auto" : 0,
					opacity: showEditSection ? 1 : 0,
				}}
				transition={{ duration: 0.3, ease: "easeInOut" }}
			>
				{showEditSection && (
					<ListingForm
						sticker={sticker}
						description={description}
						onSubmit={handlePublish}
						onCancel={handleCancel}
					/>
				)}
			</motion.div>
		</motion.div>
	);
}
