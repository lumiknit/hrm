import { type Component } from "solid-js";
import { openModal, type ModalProps } from "../modal/ModalStack";
import { freezeCurrentSheet } from "./state";
import toast from "solid-toast";

const ModalExportSheet: Component<ModalProps> = props => {
	const sheet = freezeCurrentSheet();
	const json = JSON.stringify(sheet, null, 2);

	const handleCopy = () => {
		navigator.clipboard.writeText(json);
		toast.success("Copied to clipboard!");
	};

	const handleDownload = () => {
		const blob = new Blob([json], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${sheet.title || "sheet"}.json`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("Downloading JSON...");
	};

	return (
		<div class="modal-card">
			<header class="modal-card-head">
				<p class="modal-card-title">Export Sheet</p>
				<button
					class="delete"
					aria-label="close"
					onClick={props.onClose}></button>
			</header>
			<section class="modal-card-body">
				<div class="field">
					<label class="label">JSON Preview</label>
					<div class="control">
						<pre style={{ "max-height": "400px", "overflow-y": "auto" }}>
							{json}
						</pre>
					</div>
				</div>
			</section>
			<footer class="modal-card-foot">
				<button class="button is-primary" onClick={handleCopy}>
					Copy to Clipboard
				</button>
				<button class="button is-link" onClick={handleDownload}>
					Download JSON
				</button>
				<button class="button" onClick={props.onClose}>
					Cancel
				</button>
			</footer>
		</div>
	);
};

export const showExportSheetModal = () => {
	return openModal(ModalExportSheet);
};
