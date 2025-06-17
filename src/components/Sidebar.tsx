import { useActiveSegment } from "@/store";

import { SegmentEditor } from "./SegmentEditor";

export function Sidebar() {
	const { activeSegment } = useActiveSegment();

	return (
		<div
			id="sidebar"
			className="w-80 overflow-y-scroll px-3 h-full flex flex-col bg-gray-200"
		>
			{!activeSegment && (
				<div className="flex items-center justify-center h-full">
					<p className="text-gray-500">No segment selected</p>
				</div>
			)}
			{activeSegment && <SegmentEditor segment={activeSegment} />}
		</div>
	);
}
