import { useCandidateSegment, useListingDrafts } from "@/store";
import { AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import { ListingDraftCard } from "./ListingDraftCard";
import { ScrollArea } from "./ui/scroll-area";

export function Sidebar() {
	const {
		listingDrafts,
		selectedListingDraft,
		setSelectedListingDraft,
		removeListingDraft,
	} = useListingDrafts();

	const { setCandidateSegment } = useCandidateSegment();

	const handleSelectDraft = (draft: typeof selectedListingDraft) => {
		if (draft) {
			// Toggle selection - if already selected, deselect it
			if (selectedListingDraft?.id === draft.id) {
				setSelectedListingDraft(undefined);
				setCandidateSegment(undefined);
			} else {
				setSelectedListingDraft(draft);
			}
		}
	};

	const handleDeleteDraft = (id: string) => {
		removeListingDraft(id);
	};

	return (
		<div id="sidebar" className="w-100 h-full flex flex-col bg-gray-200">
			{/* No drafts state */}
			{listingDrafts.length === 0 && (
				<div className="flex items-center justify-center h-full">
					<p className="text-gray-500">No listing created yet...</p>
				</div>
			)}

			{/* Cards list */}
			{listingDrafts.length > 0 && (
				<div className="py-4 flex flex-col px-3 h-full overflow-hidden">
					<h2 className="text-lg font-semibold text-gray-800 flex-shrink-0 mb-4">
						Listing Drafts ({listingDrafts.length})
					</h2>

					<ScrollArea className="h-[calc(100vh-5rem)]">
						<div
							className={cn("flex flex-col", !selectedListingDraft && "gap-2")}
						>
							<AnimatePresence mode="popLayout">
								{listingDrafts.map((draft) => (
									<ListingDraftCard
										key={draft.id}
										draft={draft}
										onSelect={handleSelectDraft}
										onDelete={handleDeleteDraft}
										isExpanded={selectedListingDraft?.id === draft.id}
										isCollapsed={
											selectedListingDraft !== undefined &&
											selectedListingDraft?.id !== draft.id
										}
									/>
								))}
							</AnimatePresence>
						</div>
					</ScrollArea>
				</div>
			)}
		</div>
	);
}
