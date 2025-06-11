import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/ui/image-uploader";
import {
	useInitSamModel,
	useInitSmolVLMModel,
	useSetSelectedImage,
} from "@/store";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, Loader2 } from "lucide-react";
import { useRef } from "react";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	useInitSamModel();
	useInitSmolVLMModel();
	const { setImage, isLoading, image } = useSetSelectedImage();
	const navigate = useNavigate();
	const containerRef = useRef<HTMLDivElement>(null);
	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ["start start", "end start"],
	});
	const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

	const fadeInUp = {
		initial: { opacity: 0, y: 60 },
		animate: { opacity: 1, y: 0 },
		transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
	};

	const staggerContainer = {
		animate: {
			transition: {
				staggerChildren: 0.2,
			},
		},
	};

	return (
		<div ref={containerRef} className="bg-white">
			{/* Header */}
			<motion.header
				className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100"
				initial={{ y: -100 }}
				animate={{ y: 0 }}
				transition={{ duration: 0.6, ease: "easeOut" }}
			>
				<div className="max-w-7xl mx-auto px-8 py-6">
					<div className="flex items-center justify-between">
						<motion.div
							className="text-2xl font-light tracking-tight text-gray-900"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.3 }}
						>
							listing<span className="font-medium">AI</span>
						</motion.div>
						<motion.nav
							className="hidden md:flex space-x-12"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.5 }}
						>
							<a
								href="#features"
								className="text-gray-600 hover:text-gray-900 transition-colors text-sm tracking-wide"
							>
								Features
							</a>
							<a
								href="#upload"
								className="text-gray-600 hover:text-gray-900 transition-colors text-sm tracking-wide"
							>
								Get Started
							</a>
						</motion.nav>
					</div>
				</div>
			</motion.header>

			{/* Hero Section */}
			<section className="min-h-screen flex items-center justify-center px-8 pt-24">
				<div className="max-w-4xl mx-auto text-center">
					<motion.div
						variants={staggerContainer}
						initial="initial"
						animate="animate"
					>
						<motion.h1
							className="text-7xl md:text-8xl font-light text-gray-900 mb-8 leading-none tracking-tight"
							variants={fadeInUp}
						>
							Transform
							<br />
							<span className="font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
								Images
							</span>
							<br />
							Into Listings
						</motion.h1>

						<motion.p
							className="text-xl text-gray-500 mb-16 max-w-2xl mx-auto font-light leading-relaxed"
							variants={fadeInUp}
						>
							AI-powered tool that converts product photos into multiple
							optimized eBay listings
						</motion.p>

						<motion.div variants={fadeInUp}>
							<Button
								onClick={() =>
									document
										.getElementById("upload")
										?.scrollIntoView({ behavior: "smooth" })
								}
								className="bg-gray-900 text-white px-12 py-4 rounded-full text-lg font-medium hover:bg-gray-800 transition-all duration-300"
							>
								Get Started
							</Button>
						</motion.div>
					</motion.div>

					<motion.div
						className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 1.5 }}
					>
						<motion.div
							animate={{ y: [0, 10, 0] }}
							transition={{
								duration: 2,
								repeat: Number.POSITIVE_INFINITY,
								ease: "easeInOut",
							}}
						>
							<ArrowDown className="h-6 w-6 text-gray-400" />
						</motion.div>
					</motion.div>
				</div>
			</section>

			{/* Features Section */}
			<motion.section id="features" className="py-32 px-8" style={{ y }}>
				<div className="max-w-6xl mx-auto">
					<motion.div
						className="text-center mb-24"
						initial={{ opacity: 0, y: 60 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						viewport={{ once: true, margin: "-100px" }}
					>
						<h2 className="text-5xl font-light text-gray-900 mb-6 tracking-tight">
							Why Choose Us
						</h2>
						<div className="w-24 h-px bg-gray-300 mx-auto" />
					</motion.div>

					<div className="grid md:grid-cols-3 gap-16">
						{[
							{
								icon: "⚡",
								title: "Lightning Fast",
								desc: "Process images in seconds with advanced AI",
							},
							{
								icon: "🎯",
								title: "Smart Detection",
								desc: "Automatically identify multiple products",
							},
							{
								icon: "📈",
								title: "Sales Optimized",
								desc: "Generate listings that convert better",
							},
						].map((feature, index) => (
							<motion.div
								key={feature.title}
								className="text-center group"
								initial={{ opacity: 0, y: 60 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8, delay: index * 0.2 }}
								viewport={{ once: true, margin: "-50px" }}
							>
								<motion.div
									className="text-6xl mb-8 group-hover:scale-110 transition-transform duration-300"
									whileHover={{ scale: 1.1 }}
								>
									{feature.icon}
								</motion.div>
								<h3 className="text-2xl font-medium text-gray-900 mb-4 tracking-tight">
									{feature.title}
								</h3>
								<p className="text-gray-500 font-light leading-relaxed">
									{feature.desc}
								</p>
							</motion.div>
						))}
					</div>
				</div>
			</motion.section>

			{/* Upload Section */}
			<motion.section
				id="upload"
				className="py-32 px-8 bg-gray-50"
				initial={{ opacity: 0 }}
				whileInView={{ opacity: 1 }}
				transition={{ duration: 1 }}
				viewport={{ once: true, margin: "-100px" }}
			>
				<div className="max-w-5xl mx-auto">
					<motion.div
						className="text-center mb-20"
						initial={{ opacity: 0, y: 60 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						viewport={{ once: true }}
					>
						<h2 className="text-5xl font-light text-gray-900 mb-6 tracking-tight">
							Ready to Start?
						</h2>
						<p className="text-xl text-gray-500 font-light">
							Upload your product image and watch the magic happen
						</p>
					</motion.div>

					<motion.div
						className="bg-white rounded-3xl p-16 shadow-sm border border-gray-100"
						initial={{ opacity: 0, y: 80 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2 }}
						viewport={{ once: true }}
					>
						<div className="flex flex-col lg:flex-row gap-16 items-center">
							<motion.div
								className="flex-1 w-full"
								initial={{ opacity: 0, x: -50 }}
								whileInView={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.8, delay: 0.4 }}
								viewport={{ once: true }}
							>
								<ImageUploader
									onUpload={setImage}
									onRemove={() => setImage(undefined)}
								/>
							</motion.div>

							<motion.div
								className="flex flex-col items-center space-y-8"
								initial={{ opacity: 0, x: 50 }}
								whileInView={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.8, delay: 0.6 }}
								viewport={{ once: true }}
							>
								<div className="w-px h-16 bg-gray-200 lg:w-16 lg:h-px" />
								<Button
									size="lg"
									disabled={isLoading || !image}
									onClick={() => navigate({ to: "/edit" })}
									className="bg-gray-900 text-white px-12 py-4 rounded-full text-lg font-medium hover:bg-gray-800 transition-all duration-300 disabled:opacity-50"
								>
									{isLoading && (
										<Loader2 className="mr-3 h-5 w-5 animate-spin" />
									)}
									Generate Listings
								</Button>
							</motion.div>
						</div>
					</motion.div>
				</div>
			</motion.section>

			{/* Footer */}
			<motion.footer
				className="py-16 px-8 text-center"
				initial={{ opacity: 0 }}
				whileInView={{ opacity: 1 }}
				transition={{ duration: 0.6 }}
				viewport={{ once: true }}
			>
				<div className="max-w-4xl mx-auto">
					<div className="w-24 h-px bg-gray-200 mx-auto mb-8" />
					<p className="text-gray-400 font-light tracking-wide">
						Powered by artificial intelligence
					</p>
				</div>
			</motion.footer>
		</div>
	);
}
