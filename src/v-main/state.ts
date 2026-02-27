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
import { validJSIdentifier } from "../core/js";
import { runner } from "./runner";

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

export const [sheetTitle, setSheetTitle] = createSignal<string>("");
export const [sheetDesc, setSheetDesc] = createSignal<string>("");

/**
 * cells only contains the list of cells in the current sheet
 */
export const [cells, setCells] = createSignal<string[]>([]);

/** cellMap maps from cell.uid to the corresponding Cell object */
export const cellMap: Map<string, Cell> = new Map();

export const getCell = (uid: string): Cell | undefined => cellMap.get(uid);

export const reset = () => {
	batch(() => {
		setSheetTitle("");
		setSheetDesc("");
		setCells([]);
		cellMap.clear();
	});
};

export const loadSheet = (sh: Sheet) => {
	reset();
	batch(() => {
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
	toast.success("Deleted cell: " + untrack(() => cell.getData()).id);

	runner.recompile();
};
