import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ListingDraft } from "@/types/ListingDraft";
import { motion, usePresence } from "framer-motion";
import { ListingDraftEditor } from "./ListingDraftEditor";

interface ListingDraftCardProps {
	draft: ListingDraft;
	onSelect: (draft: ListingDraft) => void;
	onDelete: (id: string) => void;
	isExpanded: boolean;
	isCollapsed: boolean;
}

const CARD_HEIGHT = 240; // Fixed height for collapsed cards

export function ListingDraftCard({
	draft,
	onSelect,
	onDelete,
	isExpanded,
	isCollapsed,
}: ListingDraftCardProps) {
	const { segment, listingDetails, status } = draft;
	const [isPresent] = usePresence();

	// Calculate target height based on state
	const getTargetHeight = () => {
		if (isExpanded) {
			return "100%"; // Take full sidebar height when expanded
		}
		if (isCollapsed) {
			return 0; // Hide completely when other cards are expanded
		}
		return CARD_HEIGHT; // Fixed height when in normal state
	};

	return (
		<motion.div
			initial={false}
			animate={{
				height: getTargetHeight(),
				opacity: isCollapsed ? 0 : 1,
				scale: isCollapsed ? 0.95 : 1,
			}}
			exit={{
				height: 0,
				opacity: 0,
				scale: 0.9,
			}}
			transition={{
				height: {
					duration: 0.4,
					ease: [0.4, 0.0, 0.2, 1],
				},
				opacity: {
					duration: isCollapsed ? 0.2 : 0.3,
					ease: "easeInOut",
					delay: isCollapsed ? 0 : 0.1,
				},
				scale: {
					duration: 0.3,
					ease: "easeOut",
				},
			}}
			className={cn(
				isCollapsed && "pointer-events-none",
				"relative",
				"overflow-hidden",
				isExpanded ? "z-10" : "z-1",
			)}
		>
			<div className="h-full relative">
				{/* Card content - conditionally rendered to avoid opacity conflicts with layoutId */}
				<motion.div
					className="absolute inset-0 "
					initial={false}
					animate={{
						opacity: isExpanded ? 0 : 1,
					}}
					transition={{
						duration: 0.2,
						delay: isExpanded ? 0 : 0.1, // Shorter delay to overlap with editor fadeout
					}}
					style={{ pointerEvents: isExpanded ? "none" : "auto" }}
				>
					<Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
						<div onClick={() => onSelect(draft)} className="h-full flex">
							{/* Left section: Image and Status */}
							<div className="flex flex-col items-center justify-start p-4 w-24 flex-shrink-0">
								<motion.img
									src={segment.sticker?.toDataURL()}
									alt="Draft item"
									className="h-16 w-16 object-contain rounded-md mb-2"
									layoutId={isPresent ? `draft-image-${segment.id}` : undefined}
								/>
								<span
									className={`px-2 py-1 text-xs rounded-full text-center ${
										status === "published"
											? "bg-green-100 text-green-800"
											: "bg-yellow-100 text-yellow-800"
									}`}
								>
									{status === "published" ? "Published" : "Draft"}
								</span>
							</div>

							{/* Right section: Title, Description, and Delete Button */}
							<div className="flex-1 flex flex-col p-4 pl-2">
								<div className="flex-1">
									<CardTitle className="text-sm mb-2">
										{listingDetails?.title || "Untitled"}
									</CardTitle>
									<CardDescription className="line-clamp-3 text-sm">
										{segment.description || "No description"}
									</CardDescription>
								</div>

								<div className="mt-4">
									<Button
										variant="outline"
										size="sm"
										className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
										onClick={(e) => {
											e.stopPropagation();
											onDelete(draft.id);
										}}
									>
										Delete
									</Button>
								</div>
							</div>
						</div>
					</Card>
				</motion.div>

				{/* Editor content - fades in when expanded */}
				<motion.div
					className="absolute inset-0 h-full"
					initial={false}
					animate={{
						opacity: isExpanded ? 1 : 0,
					}}
					transition={{
						duration: 0.2,
						delay: isExpanded ? 0.1 : 0.1, // Wait longer for height animation to mostly complete
					}}
					style={{ pointerEvents: isExpanded ? "auto" : "none" }}
				>
					{isExpanded && <ListingDraftEditor segment={segment} />}
				</motion.div>
			</div>
		</motion.div>
	);
}
