import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod/v4";

const formSchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().min(1, "Description is required"),
	price: z.string().min(0, "Price is required"),
	category: z.string().min(1, "Category is required"),
	image: z.string().optional(), // Base64 image data
});

type FormData = z.infer<typeof formSchema>;

interface EditSidebarProps {
	sticker: HTMLCanvasElement | undefined;
	description?: string;
}

export function EditSidebar({ sticker, description }: EditSidebarProps) {
	const [showEditSection, setShowEditSection] = useState(false);

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: "",
			description: description,
			price: "",
			category: "",
			image: "",
		},
	});

	const handleCreateListing = () => {
		setShowEditSection(true);
		// Set the image data when creating the listing
		if (sticker) {
			form.setValue("image", sticker.toDataURL());
		}
	};

	const handlePublish = (data: FormData) => {
		console.log("Publishing listing...", data);
		// The data now includes the image as base64 string
	};

	const handleCancel = () => {
		setShowEditSection(false);
		form.reset();
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
								<Form {...form}>
									<form
										onSubmit={form.handleSubmit(handlePublish)}
										className="space-y-4"
									>
										<h3 className="text-lg font-semibold text-gray-800 mb-4">
											Edit Listing
										</h3>

										{/* Hidden image field to include in form data */}
										<FormField
											control={form.control}
											name="image"
											render={({ field }) => (
												<FormItem className="hidden">
													<FormControl>
														<Input type="hidden" {...field} />
													</FormControl>
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="title"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Title</FormLabel>
													<FormControl>
														<Input
															placeholder="Enter listing title"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="description"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Description</FormLabel>
													<FormControl>
														<Textarea
															placeholder="Enter listing description"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="price"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Price</FormLabel>
													<FormControl>
														<Input
															type="number"
															placeholder="0.00"
															step="0.01"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="category"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Category</FormLabel>
													<Select
														onValueChange={field.onChange}
														defaultValue={field.value}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select category" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="electronics">
																Electronics
															</SelectItem>
															<SelectItem value="clothing">Clothing</SelectItem>
															<SelectItem value="home">
																Home & Garden
															</SelectItem>
															<SelectItem value="toys">Toys</SelectItem>
															<SelectItem value="other">Other</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
									</form>
								</Form>
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
								<Button
									type="submit"
									className="flex-1 text-sm py-2"
									onClick={form.handleSubmit(handlePublish)}
								>
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
