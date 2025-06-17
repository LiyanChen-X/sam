import type { Mask } from "./Mask";

export type Segment = {
	id: string;
	sticker: HTMLCanvasElement;
	description: string;
	data: Mask;
	dims: readonly number[];
};
