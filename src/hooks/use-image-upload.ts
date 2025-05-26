import { useCallback, useEffect, useRef, useState } from "react";

interface UseImageUploadProps {
	onUpload?: (file: File) => void;
	onRemove?: () => void;
}

export function useImageUpload({
	onUpload,
	onRemove,
}: UseImageUploadProps = {}) {
	const previewRef = useRef<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [fileName, setFileName] = useState<string | null>(null);
	const [file, setFile] = useState<File | null>(null);
	const handleThumbnailClick = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleFileChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (file) {
				setFile(file);
				setFileName(file.name);
				const url = URL.createObjectURL(file);
				setPreviewUrl(url);
				previewRef.current = url;
				onUpload?.(file);
			}
		},
		[onUpload],
	);

	const handleRemove = useCallback(() => {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
		setPreviewUrl(null);
		setFileName(null);
		setFile(null);
		onRemove?.();
		previewRef.current = null;
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}, [previewUrl, onRemove]);

	useEffect(() => {
		return () => {
			if (previewRef.current) {
				URL.revokeObjectURL(previewRef.current);
			}
		};
	}, []);

	return {
		previewUrl,
		fileName,
		fileInputRef,
		handleThumbnailClick,
		handleFileChange,
		handleRemove,
		file,
	};
}
