// Action is wrapper for other API, with user-friendly toast/confirm and error handling.

import toast from "solid-toast";
import { loadSheet, reset, saveCurrentSheet } from "./state";
import { SheetDB } from "../core/cell-idb";
import { runner } from "./runner";

export const actionNewSheet = () => {
	if (
		!confirm(
			"Are you sure you want to create a new sheet? Unsaved changes will be lost.",
		)
	) {
		return;
	}
	reset();
};

export const actionSaveSheet = () => {
	toast.promise(saveCurrentSheet(), {
		loading: "Saving sheet...",
		success: "Sheet saved successfully.",
		error: "Failed to save sheet.",
	});
};

export const actionDeleteSheet = (id: string) => {
	if (
		!confirm(
			"Are you sure you want to delete this sheet? This action cannot be undone.",
		)
	) {
		return;
	}
	const db = new SheetDB();
	toast.promise(db.delete(id), {
		loading: "Deleting sheet...",
		success: "Sheet deleted successfully.",
		error: "Failed to delete sheet.",
	});
};

export const actionOpenSheet = async (id: string) => {
	const db = new SheetDB();
	await toast.promise(
		(async () => {
			const sheet = await db.get(id);
			if (!sheet) {
				throw new Error("Sheet not found.");
			}
			loadSheet(sheet, id);
			runner.recompile();
		})(),
		{
			loading: "Loading sheet...",
			success: "Sheet loaded successfully.",
			error: e => {
				console.error(e);
				return "Failed to load sheet.";
			},
		},
	);
};
