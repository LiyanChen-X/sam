"use client";

import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { MousePointer, Sparkles } from "lucide-react";
import { useState } from "react";

type SegmentMode = "manual" | "automatic";

interface ToolbarProps {
	className?: string;
	onModeChange?: (mode: SegmentMode) => void;
	onDescriptionChange?: (description: string) => void;
}

export function Toolbar({
	className,
	onModeChange,
	onDescriptionChange,
}: ToolbarProps) {
	const [segmentMode, setSegmentMode] = useState<SegmentMode>("manual");
	const [description, setDescription] = useState("");

	const handleModeChange = (value: SegmentMode) => {
		setSegmentMode(value);
		onModeChange?.(value);

		// Clear description when switching to manual mode
		if (value === "manual") {
			setDescription("");
			onDescriptionChange?.("");
		}
	};

	const handleDescriptionChange = (value: string) => {
		setDescription(value);
		onDescriptionChange?.(value);
	};

	return (
		<motion.div
			layout
			className={cn(
				// Refined toolbar styling with better contrast
				"bg-slate-50 dark:bg-slate-900",
				"border border-slate-300 dark:border-slate-600",
				"rounded-md shadow-sm",
				// Compact layout
				"flex items-center gap-2 px-2 py-1.5",
				"w-fit mx-auto",
				// Transitions
				"transition-all duration-300 ease-in-out",
				className,
			)}
		>
			{/* Dropdown Select */}
			<Select value={segmentMode} onValueChange={handleModeChange}>
				<SelectTrigger
					className={cn(
						// Improved contrast styling
						"bg-white dark:bg-slate-800",
						"border-slate-400 dark:border-slate-500",
						"hover:bg-slate-100 dark:hover:bg-slate-700",
						"text-slate-800 dark:text-slate-200",
						"focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400",
						// Compact layout with consistent height
						"w-fit min-w-[150px] h-8! text-xs",
						"transition-all duration-200",
					)}
				>
					<div className="flex items-center gap-1.5">
						<SelectValue placeholder="Select mode" />
					</div>
				</SelectTrigger>
				<SelectContent
					className={cn(
						// Improved dropdown content styling
						"bg-white dark:bg-slate-800",
						"border-slate-300 dark:border-slate-600",
					)}
				>
					<SelectItem value="manual" className="text-xs">
						<div className="flex items-center gap-1.5">
							<MousePointer className="h-3 w-3" />
							<span>Segment Manually</span>
						</div>
					</SelectItem>
					<SelectItem value="automatic" className="text-xs">
						<div className="flex items-center gap-1.5">
							<Sparkles className="h-3 w-3" />
							<span>Segment Automatically</span>
						</div>
					</SelectItem>
				</SelectContent>
			</Select>

			{/* Animated Input Field */}
			<AnimatePresence mode="wait">
				{segmentMode === "automatic" && (
					<motion.div
						initial={{
							width: 0,
							opacity: 0,
							x: 20,
							scale: 0.95,
						}}
						animate={{
							width: "auto",
							opacity: 1,
							x: 0,
							scale: 1,
						}}
						exit={{
							width: 0,
							opacity: 0,
							x: 20,
							scale: 0.95,
						}}
						transition={{
							duration: 0.3,
							ease: "easeInOut",
							type: "spring",
							stiffness: 300,
							damping: 30,
						}}
						layout
						className="overflow-hidden"
					>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ delay: 0.1, duration: 0.2 }}
						>
							<Input
								value={description}
								onChange={(e) => handleDescriptionChange(e.target.value)}
								placeholder="Enter description..."
								className={cn(
									// Improved contrast and compact styling
									"bg-white dark:bg-slate-800",
									"border-slate-400 dark:border-slate-500",
									"text-slate-800 dark:text-slate-200 text-xs",
									"placeholder:text-slate-500 dark:placeholder:text-slate-400 placeholder:text-xs",
									"focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400",
									"focus:border-blue-500 dark:focus:border-blue-400",
									"focus:ring-offset-0",
									// Override the default focus-visible ring
									"focus-visible:ring-0 focus-visible:ring-transparent",
									// Compact layout with matching height
									"min-w-[160px] w-[160px] h-8 px-3 py-1",
									"transition-all duration-200",
								)}
								autoFocus
							/>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
