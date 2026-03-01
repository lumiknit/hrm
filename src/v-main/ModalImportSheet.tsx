import { createSignal, type Component } from "solid-js";
import { openModal, type ModalProps } from "../modal/ModalStack";
import { loadSheet } from "./state";
import { sheetSchema } from "../core/cell";
import toast from "solid-toast";

const ModalImportSheet: Component<ModalProps> = props => {
	const [jsonText, setJsonText] = createSignal("");
	const [error, setError] = createSignal<string | null>(null);

	const handleImport = (text: string) => {
		try {
			const parsed = JSON.parse(text);
			const validation = sheetSchema.safeParse(parsed);
			if (!validation.success) {
				setError(validation.error.message);
				toast.error("Invalid sheet format");
				return;
			}
			loadSheet(validation.data);
			toast.success("Sheet imported successfully!");
			props.onClose();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Invalid JSON");
			toast.error("Failed to parse JSON");
		}
	};

	const handleFileUpload = (e: Event) => {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = e => {
			const text = e.target?.result as string;
			handleImport(text);
		};
		reader.readAsText(file);
	};

	return (
		<div class="modal-card">
			<header class="modal-card-head">
				<p class="modal-card-title">Import Sheet</p>
				<button
					class="delete"
					aria-label="close"
					onClick={props.onClose}></button>
			</header>
			<section class="modal-card-body">
				<div class="field">
					<label class="label">Paste JSON</label>
					<div class="control">
						<textarea
							class="textarea"
							placeholder='{"title": "...", "cells": [...]}'
							value={jsonText()}
							onInput={e => setJsonText(e.currentTarget.value)}
							rows={10}></textarea>
					</div>
					{error() && <p class="help is-danger">{error()}</p>}
				</div>

				<div class="field">
					<label class="label">Or Upload JSON File</label>
					<div class="control">
						<div class="file has-name is-fullwidth">
							<label class="file-label">
								<input
									class="file-input"
									type="file"
									accept=".json"
									onChange={handleFileUpload}
								/>
								<span class="file-cta">
									<span class="file-label">Choose a file…</span>
								</span>
							</label>
						</div>
					</div>
				</div>
			</section>
			<footer class="modal-card-foot">
				<button
					class="button is-primary"
					onClick={() => handleImport(jsonText())}>
					Import
				</button>
				<button class="button" onClick={props.onClose}>
					Cancel
				</button>
			</footer>
		</div>
	);
};

export const showImportSheetModal = () => {
	return openModal(ModalImportSheet);
};
