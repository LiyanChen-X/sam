import { useGenerateImage } from "@/hooks/use-generate-image";
import { useCandidateSegment, useListingDrafts } from "@/store";
import type { Segment } from "@/types/Segment";
import { motion } from "framer-motion";
import { ListingForm } from "./ListingForm";

type Props = {
	segment: Segment;
};

export function ListingDraftEditor({ segment }: Props) {
	const { setSelectedListingDraft } = useListingDrafts();
	const { description, sticker } = segment;
	const { generateImage, generatedImage } = useGenerateImage(segment);
	const { setCandidateSegment } = useCandidateSegment();

	const handlePublish = (data: any) => {
		console.log("Publishing listing...", data);
	};

	const handleCancel = () => {
		setSelectedListingDraft(undefined);
		setCandidateSegment(undefined);
	};

	return (
		<motion.div
			key="sticker-container"
			className="flex h-full flex-col border overflow-auto scrollbar-none border-gray-300 bg-gray-100 rounded-lg mt-2 w-full flex-1"
			initial={{ scale: 0.9, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			transition={{ duration: 0.2, ease: "easeInOut", delay: 0.1 }}
			layout
		>
			{/* Image Section */}
			<motion.div className="flex relative group justify-center flex-col items-center gap-2 p-6 w-full border-b border-gray-300">
				<motion.img
					className="cursor-pointer rounded-md max-h-[240px] object-cover"
					alt="sticker"
					src={
						generatedImage
							? `data:image/png;base64,${generatedImage}`
							: sticker!.toDataURL()
					}
					layoutId={`draft-image-${segment.id}`}
				/>
				<div className="absolute inset-0 bg-white bg-opacity-70 rounded-md opacity-0 group-hover:opacity-70 transition-opacity duration-200 ease-in-out flex items-center justify-center" />
				<button
					className="bg-gray-800 absolute  text-white px-3 py-1 opacity-0 group-hover:opacity-100 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors duration-150 z-10"
					onClick={() => {
						generateImage();
					}}
				>
					create
				</button>
			</motion.div>

			<motion.div
				className="flex-1"
				initial={{ height: 0, opacity: 0 }}
				animate={{
					height: "auto",
					opacity: 1,
				}}
				transition={{
					duration: 0.2,
					ease: "easeInOut",
					delay: 0.1,
				}}
			>
				<ListingForm
					sticker={sticker}
					description={description}
					onSubmit={handlePublish}
					onCancel={handleCancel}
				/>
			</motion.div>
		</motion.div>
	);
}
