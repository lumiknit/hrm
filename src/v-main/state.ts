import {
	batch,
	createSignal,
	untrack,
	type Accessor,
	type Setter,
} from "solid-js";
import {
	cellColorSchema,
	defaultFrozenCell,
	type FrozenCell,
	type Sheet,
} from "../core/cell";
import { uniqueID } from "../core/id";
import toast from "solid-toast";
import { renameIdentifiersCode, validJSIdentifier } from "../core/js";
import { SheetDB } from "../core/cell-idb";
import {
	clearHistory,
	type CellAction,
	pushAndPerformAction,
	runUndo,
} from "./history";
import { showUndoToast } from "./ToastUndo";

export type Cell = {
	uid: string;

	getData: Accessor<FrozenCell>;
	setData: Setter<FrozenCell>;

	// Value in Solid.JS for rendering
	value: Accessor<any>;
	setValue: Setter<any>;

	editing: Accessor<boolean>;
	setEditing: Setter<boolean>;
};

export const thawCell = (frozen: FrozenCell): Cell => {
	const [data, setData] = createSignal(frozen);
	const [value, setValue] = createSignal<any>(undefined);
	const [editing, setEditing] = createSignal(false);

	return {
		uid: uniqueID(),
		getData: data,
		setData,
		value,
		setValue,
		editing,
		setEditing,
	};
};

export const freezeCell = (cell: Cell): FrozenCell => {
	return cell.getData();
};

export const [sheetID, setSheetID] = createSignal<string>(uniqueID());
export const [sheetTitle, setSheetTitle] = createSignal<string>("");
export const [sheetDesc, setSheetDesc] = createSignal<string>("");
export const [sheetDirty, setSheetDirty] = createSignal<boolean>(false);

/**
 * cells only contains the list of cells in the current sheet
 */
export const [cells, setCells] = createSignal<string[]>([]);

export const [selectedCells, setSelectedCells] = createSignal<Set<string>>(
	new Set(),
);
export const [cellDragging, setCellDragging] = createSignal<boolean>(false);

/** cellMap maps from cell.uid to the corresponding Cell object */
export const cellMap: Map<string, Cell> = new Map();

export const getCell = (uid: string): Cell | undefined => cellMap.get(uid);

export const reset = () => {
	batch(() => {
		setSheetID(uniqueID());
		setSheetTitle("");
		setSheetDesc("");
		setCells([]);
		cellMap.clear();
		clearHistory();
	});
};

export const loadSheet = (sh: Sheet, id?: string) => {
	reset();
	batch(() => {
		setSheetID(id ?? uniqueID());
		setSheetTitle(sh.title);
		setSheetDesc(sh.description);
		const newUIDs = [];
		for (const c of sh.cells) {
			const thawed = thawCell(c);
			cellMap.set(thawed.uid, thawed);
			newUIDs.push(thawed.uid);
		}
		setCells(newUIDs);
	});
};

export const freezeCurrentSheet = (): Sheet => {
	return untrack(() => ({
		updatedAt: new Date(),
		title: sheetTitle(),
		description: sheetDesc(),
		cells: cells().map(uid => {
			const cell = cellMap.get(uid);
			if (!cell) {
				throw new Error(`Cell with UID ${uid} not found in cellMap.`);
			}
			return freezeCell(cell);
		}),
	}));
};

export const saveCurrentSheet = async () => {
	const db = new SheetDB();
	const sheet = freezeCurrentSheet();
	await db.set(sheetID(), sheet);
	setSheetDirty(false);
};

const findNewCellName = () => {
	const nameSet = new Set();
	for (const c of cellMap.values()) {
		nameSet.add(untrack(() => c.getData()).id);
	}
	for (let i = 1; ; i++) {
		const name = `c${i}`;
		if (!nameSet.has(name)) {
			return name;
		}
	}
};

/**
 * Check the new cell ID is valid (not empty, not duplicate) before allowing the change.
 */
export const validCellUpdate = (
	oldCell: FrozenCell,
	cell: FrozenCell,
): {
	valid: boolean;
	errors?: string[];
} => {
	const errors: string[] = [];
	// Check ID
	if (!validJSIdentifier(cell.id)) {
		errors.push(`Malformed Javascript Identifier`);
	} else {
		for (const c of cellMap.values()) {
			const id = untrack(() => c.getData()).id;
			if (id === cell.id && id !== oldCell.id) {
				errors.push(`Duplicate cell ID "${cell.id}".`);
				break;
			}
		}
	}

	// Check color
	if (
		cell.meta.color !== undefined &&
		cellColorSchema.safeParse(cell.meta.color).success === false
	) {
		errors.push(`Invalid cell color "${cell.meta.color}".`);
	}

	return {
		valid: errors.length === 0,
		errors: errors.length > 0 ? errors : undefined,
	};
};

export const addEmptyCell = (idx?: number) => {
	const uid = uniqueID();
	const name = findNewCellName();
	const action: CellAction = {
		uid: uid,
		after: {
			index: idx !== undefined ? idx : cells().length,
			data: defaultFrozenCell(name),
		},
	};
	pushAndPerformAction({
		beforeSelect: new Set(untrack(selectedCells)),
		afterSelect: new Set([action.uid]),
		actions: [action],
	});
	showUndoToast("Added cell: " + name, runUndo);
};

export const reorderCell = (fromIndex: number, toIndex: number) => {
	// Find UID
	const currentCells = cells();
	const uid = currentCells[fromIndex];
	if (!uid) {
		toast.error(`Invalid fromIndex ${fromIndex} for reordering.`);
		return;
	}
	const data = cellMap.get(uid)?.getData();
	if (!data) {
		toast.error(`Cell with UID ${uid} not found for reordering.`);
		return;
	}

	const action: CellAction = {
		uid,
		before: {
			index: fromIndex,
			data: data,
		},
		after: {
			index: toIndex,
			data: data,
		},
	};
	pushAndPerformAction({
		beforeSelect: new Set(untrack(selectedCells)),
		afterSelect: new Set(untrack(selectedCells)),
		actions: [action],
	});
};

export const updateCell = (uid: string, newData: FrozenCell) => {
	const cell = cellMap.get(uid);
	if (!cell) {
		toast.error(`Cell with UID ${uid} not found.`);
		return;
	}

	const oldData = cell.getData();
	const validateResult = validCellUpdate(oldData, newData);
	if (!validateResult.valid) {
		toast.error(
			`Invalid cell data: ` + (validateResult.errors ?? []).join(", "),
		);
		return;
	}

	const action: CellAction = {
		uid,
		before: {
			index: -1,
			data: oldData,
		},
		after: {
			index: -1,
			data: newData,
		},
	};
	pushAndPerformAction({
		beforeSelect: new Set(untrack(selectedCells)),
		afterSelect: new Set(untrack(selectedCells)),
		actions: [action],
	});
	showUndoToast("Updated cell: " + newData.id, runUndo);
};

export const deleteCell = (uid: string) => {
	const cell = cellMap.get(uid);
	if (!cell) {
		toast.error(`Cell with UID ${uid} not found.`);
		return;
	}

	const oldData = cell.getData();
	const action = {
		uid,
		before: {
			index: cells().indexOf(uid),
			data: oldData,
		},
	};

	const oldSel = untrack(selectedCells);
	const newSel = new Set(oldSel);
	newSel.delete(uid);

	pushAndPerformAction({
		beforeSelect: new Set(oldSel),
		afterSelect: newSel,
		actions: [action],
	});
	showUndoToast("Deleted cell: " + oldData.id, runUndo);
};

// Convert current cell data into JSON
export const freezeCellValue = (uid: string) => {
	const cell = cellMap.get(uid);
	if (!cell) {
		throw new Error(`Cell with UID ${uid} not found for freezing.`);
	}
	const value = cell.value();
	const j = JSON.stringify(value, null, 2);

	const newData: FrozenCell = {
		...cell.getData(),
		formula: j,
		meta: {
			...cell.getData().meta,
			type: {
				type: "data",
				lang: "yaml",
			},
			displayMode: "input",
		},
	};
	updateCell(uid, newData);
	cell.setEditing(false);
};

export const checkSheetDirty = (): boolean => {
	return untrack(sheetDirty);
};

export const cloneSelectedCells = () => {
	const selected = selectedCells();
	if (selected.size === 0) {
		toast.error("No cells selected to clone.");
		return;
	}

	const nameMap = new Map<string, string>();
	const existingNames = new Set<string>();
	for (const c of cellMap.values()) {
		existingNames.add(untrack(() => c.getData()).id);
	}

	// First pass: generate new names and mapping
	const originalCells: FrozenCell[] = [];
	for (const uid of selected) {
		const cell = cellMap.get(uid);
		if (cell) {
			const data = untrack(() => cell.getData());
			originalCells.push(data);
			let newName = "";
			for (let i = 1; ; i++) {
				newName = `${data.id}_${i}`;
				if (!existingNames.has(newName)) {
					existingNames.add(newName);
					break;
				}
			}
			nameMap.set(data.id, newName);
		}
	}

	const historyEvents: CellAction[] = [];
	let startIdx = cells().length;

	// Second pass: clone cells and rewrite code if needed
	for (const data of originalCells) {
		const newName = nameMap.get(data.id)!;
		const baseClone = JSON.parse(JSON.stringify(data)) as typeof data;

		baseClone.id = newName;
		if (baseClone.meta.type.type === "code") {
			try {
				baseClone.formula = renameIdentifiersCode(baseClone.formula, nameMap);
			} catch (e) {
				console.error(
					`Failed to rename identifiers in clone of ${data.id}:`,
					e,
				);
			}
		}

		historyEvents.push({
			uid: uniqueID(),
			after: {
				index: startIdx++,
				data: baseClone,
			},
		});
	}

	if (historyEvents.length > 0) {
		const newSel = new Set(historyEvents.map(c => c.uid));
		pushAndPerformAction({
			beforeSelect: new Set(untrack(selectedCells)),
			afterSelect: newSel,
			actions: historyEvents,
		});
	}

	showUndoToast(`Cloned ${historyEvents.length} cell(s).`, runUndo);
};

export const deleteSelectedCells = () => {
	const selected = selectedCells();
	if (selected.size === 0) {
		toast.error("No cells selected to delete.");
		return;
	}

	const historyEvents: CellAction[] = [];
	const currentCells = cells();
	for (let i = 0; i < currentCells.length; i++) {
		const uid = currentCells[i];
		if (selected.has(uid)) {
			historyEvents.push({
				uid,
				before: {
					index: i,
					data: structuredClone(untrack(() => cellMap.get(uid)?.getData()!)),
				},
			});
		}
	}

	// Sort by index descending to avoid messing up indices when deleting multiple cells
	historyEvents.sort((a, b) => b.before!.index - a.before!.index);

	if (historyEvents.length > 0) {
		pushAndPerformAction({
			beforeSelect: new Set(untrack(selectedCells)),
			afterSelect: new Set(),
			actions: historyEvents,
		});
	}

	showUndoToast(`Deleted ${selected.size} cell(s).`, runUndo);
};
