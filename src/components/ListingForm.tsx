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
import { zodResolver } from "@hookform/resolvers/zod";
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

interface ListingFormProps {
	sticker?: HTMLCanvasElement;
	description?: string;
	onSubmit: (data: FormData) => void;
	onCancel: () => void;
}

export function ListingForm({
	sticker,
	description,
	onSubmit,
	onCancel,
}: ListingFormProps) {
	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: "",
			description: description || "",
			price: "",
			category: "",
			image: sticker?.toDataURL() || "",
		},
	});

	const handleSubmit = (data: FormData) => {
		onSubmit(data);
	};

	return (
		<div className="p-4">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
									<Input placeholder="Enter listing title" {...field} />
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
										<SelectItem value="electronics">Electronics</SelectItem>
										<SelectItem value="clothing">Clothing</SelectItem>
										<SelectItem value="home">Home & Garden</SelectItem>
										<SelectItem value="toys">Toys</SelectItem>
										<SelectItem value="other">Other</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="flex space-x-2 pt-4">
						<Button type="submit" className="flex-1 text-sm py-2">
							Publish
						</Button>
						<Button
							type="button"
							variant="outline"
							className="flex-1 text-sm py-2"
							onClick={onCancel}
						>
							Cancel
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
