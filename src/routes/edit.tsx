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

	return <Stage image={image} />;
}
