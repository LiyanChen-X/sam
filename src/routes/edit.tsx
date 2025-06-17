import { Sidebar } from "@/components/Sidebar";
import { Stage } from "@/components/Stage";

import { useSelectedImage } from "@/store";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/edit")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const image = useSelectedImage();
	if (!image) {
		navigate({
			to: "/",
		});
		return null;
	}

	return (
		<div className="h-screen w-screen flex items-center flex-row justify-center">
			<Stage image={image} />
			<Sidebar />
		</div>
	);
}
