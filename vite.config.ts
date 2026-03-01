import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
	base: "./",
	plugins: [solid()],
	server: {
		port: 19991,
	},
	define: {
		__APP_VERSION__: JSON.stringify(process.env.npm_package_version),
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (
						id.includes("@codemirror") &&
						!id.includes("legacy-modes") &&
						!id.includes("lang-")
					) {
						return "codemirror";
					} else {
						return undefined;
					}
				},
			},
		},
	},
});
