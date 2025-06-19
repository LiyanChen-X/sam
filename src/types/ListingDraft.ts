import type { Segment } from "./Segment";

export type ListingDraft = {
	id: string;
	status: "published" | "draft";
	segment: Segment;
	// TODO: figure out how to create listing
	listingDetails?: {
		title: string;
		description: string;
		image: string;
		price: number;
		category: string;
	};
};
