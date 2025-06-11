import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";

interface EditSidebarProps {
	sticker: HTMLCanvasElement | undefined;
}

export function EditSidebar({ sticker }: EditSidebarProps) {
	const [showEditSection, setShowEditSection] = useState(false);

	const handleCreateListing = () => {
		setShowEditSection(true);
	};

	const handlePublish = () => {
		// Handle publish logic here
		console.log("Publishing listing...");
	};

	const handleCancel = () => {
		setShowEditSection(false);
	};

	return (
		<motion.div
			id="sidebar"
			className="w-80 overflow-y-scroll px-3 h-full flex flex-col bg-gray-200"
			layout
			transition={{ duration: 0.5, ease: "easeInOut" }}
		>
			{sticker && (
				<>
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
								src={sticker.toDataURL()}
								layout
								transition={{ duration: 0.3 }}
							/>
							{!showEditSection && (
								<Button
									className="w-full shadow-sm text-white font-medium py-2"
									onClick={handleCreateListing}
								>
									Create Listing
								</Button>
							)}
						</motion.div>

						{/* Edit Section - appears inside sticker container */}
						<motion.div
							className="overflow-hidden"
							initial={false}
							animate={{
								height: showEditSection ? "auto" : 0,
								opacity: showEditSection ? 1 : 0,
							}}
							transition={{ duration: 0.3, ease: "easeInOut" }}
						>
							<div className="p-4">
								<div className="space-y-4">
									<h3 className="text-lg font-semibold text-gray-800 mb-4">
										Edit Listing
									</h3>

									<div className="space-y-3">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Title
											</label>
											<input
												type="text"
												className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
												placeholder="Enter listing title"
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Description
											</label>
											<textarea
												className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
												rows={3}
												placeholder="Enter listing description"
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Price
											</label>
											<input
												type="number"
												className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
												placeholder="0.00"
												step="0.01"
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Category
											</label>
											<select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
												<option value="">Select category</option>
												<option value="electronics">Electronics</option>
												<option value="clothing">Clothing</option>
												<option value="home">Home & Garden</option>
												<option value="toys">Toys</option>
												<option value="other">Other</option>
											</select>
										</div>
									</div>
								</div>
							</div>
						</motion.div>
					</motion.div>

					{/* Button Section - moves to bottom when edit section is shown */}
					<motion.div
						className={cn(
							"flex space-x-2 ",
							showEditSection ? "mt-4 mb-2" : "mt-4",
						)}
						layout
						transition={{ duration: 0.5, ease: "easeInOut" }}
					>
						{showEditSection && (
							<>
								<Button className="flex-1 text-sm py-2" onClick={handlePublish}>
									Publish
								</Button>
								<Button
									variant="outline"
									className="flex-1 text-sm py-2"
									onClick={handleCancel}
								>
									Cancel
								</Button>
							</>
						)}
					</motion.div>
				</>
			)}
		</motion.div>
	);
}
