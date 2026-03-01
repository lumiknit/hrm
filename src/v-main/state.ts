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
import { runner } from "./runner";
import { SheetDB } from "../core/cell-idb";

export type Cell = {
	uid: string;

	getData: Accessor<FrozenCell>;
	setData: Setter<FrozenCell>;

	// Value in Solid.JS for rendering
	value: Accessor<any>;
	setValue: Setter<any>;
};

export const thawCell = (frozen: FrozenCell): Cell => {
	const [data, setData] = createSignal(frozen);
	const [value, setValue] = createSignal<any>(undefined);

	return {
		uid: uniqueID(),
		getData: data,
		setData,
		value,
		setValue,
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
	const newCell = thawCell(defaultFrozenCell(findNewCellName()));
	cellMap.set(newCell.uid, newCell);
	setCells(prev => {
		const copy = [...prev];
		if (idx !== undefined) {
			copy.splice(idx, 0, newCell.uid);
		} else {
			copy.push(newCell.uid);
		}
		return copy;
	});
	setSelectedCells(new Set([newCell.uid]));
	setSheetDirty(true);
	toast.success("Added cell: " + untrack(() => newCell.getData()).id);
};

export const reorderCell = (fromIndex: number, toIndex: number) => {
	const currentCells = cells();
	setCells(oldCells => {
		const cellID = oldCells[fromIndex];
		if (!cellID) return oldCells; // Invalid index, return unchanged
		const newCells = [...currentCells];
		newCells.splice(fromIndex, 1);
		newCells.splice(toIndex, 0, cellID);
		return newCells;
	});
	setSheetDirty(true);
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

	cell.setData(newData);
	setSheetDirty(true);
	toast.success("Updated cell: " + newData.id);

	runner.recompile();
};

export const deleteCell = (uid: string) => {
	const cell = cellMap.get(uid);
	if (!cell) {
		toast.error(`Cell with UID ${uid} not found.`);
		return;
	}
	if (
		!confirm(
			"Are you sure you want to delete cell " +
				untrack(() => cell.getData()).id +
				"?",
		)
	) {
		return;
	}

	cellMap.delete(uid);
	setCells(prev => prev.filter(id => id !== uid));
	setSheetDirty(true);
	toast.success("Deleted cell: " + untrack(() => cell.getData()).id);

	runner.recompile();
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

	const newCells: Cell[] = [];
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

		const newCell = thawCell(baseClone);
		cellMap.set(newCell.uid, newCell);
		newCells.push(newCell);
	}

	setCells(prev => {
		const copy = [...prev];
		for (const nc of newCells) {
			copy.push(nc.uid);
		}
		return copy;
	});

	setSelectedCells(new Set(newCells.map(c => c.uid)));
	setSheetDirty(true);
	toast.success(`Cloned ${newCells.length} cell(s).`);
	runner.recompile();
};

export const deleteSelectedCells = () => {
	const selected = selectedCells();
	if (selected.size === 0) {
		toast.error("No cells selected to delete.");
		return;
	}

	if (!confirm(`Are you sure you want to delete ${selected.size} cell(s)?`)) {
		return;
	}

	batch(() => {
		setCells(prev => prev.filter(id => !selected.has(id)));
		for (const uid of selected) {
			cellMap.delete(uid);
		}
		setSelectedCells(new Set<string>());
	});

	setSheetDirty(true);
	toast.success(`Deleted ${selected.size} cell(s).`);
	runner.recompile();
};
