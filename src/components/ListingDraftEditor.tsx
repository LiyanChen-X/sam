import { useGenerateImage } from "@/hooks/use-generate-image";
import {
	useCandidateSegment,
	useListingDrafts,
	useSelectedImage,
} from "@/store";
import type { Segment } from "@/types/Segment";
import { motion } from "framer-motion";
import { ListingForm } from "./ListingForm";

type Props = {
	segment: Segment;
};

export function ListingDraftEditor({ segment }: Props) {
	const contextImage = useSelectedImage();
	const { setSelectedListingDraft } = useListingDrafts();
	const { description, sticker } = segment;
	const { isGeneratingImage } = useGenerateImage(
		contextImage,
		sticker,
		description || "",
	);
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
			className="flex h-full flex-col border border-gray-300 bg-gray-100 rounded-lg shadow-md mt-2 w-full flex-1 "
			initial={{ scale: 0.9, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			transition={{ duration: 0.5, ease: "easeInOut", delay: 0.1 }}
			layout
		>
			{/* Image Section */}
			<motion.div className="flex justify-center flex-col items-center gap-2 p-6 w-full border-b border-gray-300">
				<motion.img
					className="cursor-pointer rounded-md max-h-[240px] object-cover"
					alt="sticker"
					src={sticker!.toDataURL()}
					layoutId={`draft-image-${segment.id}`}
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
			</motion.div>

			<motion.div
				className="overflow-hidden flex-1"
				initial={{ height: 0, opacity: 0 }}
				animate={{
					height: "auto",
					opacity: 1,
				}}
				transition={{
					duration: 0.4,
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
