import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ListingDraft } from "@/types/ListingDraft";
import { motion, usePresence } from "framer-motion";
import { X } from "lucide-react";
import { ListingDraftEditor } from "./ListingDraftEditor";
import { Pill, PillIndicator } from "./ui/kibo-ui/pill";

interface ListingDraftCardProps {
	draft: ListingDraft;
	onSelect: (draft: ListingDraft) => void;
	onDelete: (id: string) => void;
	isExpanded: boolean;
	isCollapsed: boolean;
}

const CARD_HEIGHT = 180; // Fixed height for collapsed cards

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
			return "calc(100vh - 6rem)"; // Take full sidebar height when expanded
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
				opacity: 0,
				scale: 0.9,
			}}
			transition={{
				height: {
					duration: 0.15,
					ease: [0.4, 0.0, 0.2, 1],
				},
				opacity: {
					duration: 0.1,
					ease: "easeInOut",
					delay: 0,
				},
				scale: {
					duration: 0.15,
					ease: "easeOut",
				},
			}}
			className={cn(
				isCollapsed && "pointer-events-none",
				"relative",
				isExpanded ? "" : "overflow-hidden",
				isExpanded ? "z-10" : "z-1",
			)}
		>
			<div className="relative h-full">
				{/* Card content - conditionally rendered to avoid opacity conflicts with layoutId */}
				<motion.div
					className="absolute inset-0"
					initial={false}
					animate={{
						// Remove opacity animation
						visibility: isExpanded ? "hidden" : "visible",
					}}
					transition={{
						duration: 0, // Instant visibility change
					}}
					style={{ pointerEvents: isExpanded ? "none" : "auto" }}
				>
					<Card className="cursor-pointer hover:shadow-md transition-shadow h-full relative py-2">
						{/* Delete button - positioned at top right */}
						<Button
							variant="ghost"
							size="sm"
							className="absolute top-2 right-2 z-10 h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
							onClick={(e) => {
								e.stopPropagation();
								onDelete(draft.id);
							}}
						>
							<X className="h-4 w-4" />
						</Button>

						<div onClick={() => onSelect(draft)} className="h-full flex">
							{/* Left section: Image and Status */}
							<div className="flex flex-col items-center justify-between p-4 w-32 flex-shrink-0">
								<motion.img
									src={segment.sticker?.toDataURL()}
									alt="Draft item"
									className="w-24 h-24  object-contain rounded-md mb-2"
									layoutId={isPresent ? `draft-image-${segment.id}` : undefined}
								/>
								{status === "published" ? (
									<Pill variant={"outline"}>
										<PillIndicator pulse variant="success" />
										Published
									</Pill>
								) : (
									<Pill variant={"outline"}>
										<PillIndicator pulse variant="warning" />
										Draft
									</Pill>
								)}
							</div>

							{/* Right section: Title and Description */}
							<div className="flex-1 flex flex-col p-4 pl-2 pr-8">
								<CardTitle className="text-sm mb-2">
									{listingDetails?.title || "Untitled"}
								</CardTitle>
								<CardDescription className="line-clamp-3 text-sm">
									{segment.description || "No description"}
								</CardDescription>
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
						duration: 0.1,
						delay: isExpanded ? 0.05 : 0, // Wait longer for height animation to mostly complete
					}}
					style={{ pointerEvents: isExpanded ? "auto" : "none" }}
				>
					{isExpanded && <ListingDraftEditor segment={segment} />}
				</motion.div>
			</div>
		</motion.div>
	);
}
