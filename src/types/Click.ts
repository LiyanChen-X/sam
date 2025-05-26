export type Click = {
	x: number;
	y: number;
	width?: number;
	height?: number;
	clickType: ClickType;
};

export enum ClickType {
	POSITIVE = 1.0,
	NEGATIVE = 0.0,
}
