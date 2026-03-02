import { batch, createSignal } from "solid-js";
import type { FrozenCell } from "../core/cell";
import {
	cellMap,
	thawCell,
	setCells,
	setSheetDirty,
	setSelectedCells,
} from "./state";
import { runner } from "./runner";

type CellHistoryState = {
	data: FrozenCell;
	index: number; // -1 if doesn't exist
};

export type CellAction = {
	uid: string;
	before?: CellHistoryState;
	after?: CellHistoryState;
};

export type HistoryItem = {
	beforeSelect: Set<string>;
	afterSelect: Set<string>;
	actions: CellAction[];
};

const [historyStack, setHistoryStack] = createSignal<HistoryItem[]>([]);
const [redoStack, setRedoStack] = createSignal<HistoryItem[]>([]);

export const clearHistory = () => {
	batch(() => {
		setHistoryStack([]);
		setRedoStack([]);
	});
};

export const pushHistory = (item: HistoryItem) => {
	batch(() => {
		setHistoryStack(prev => [...prev, item]);
		setRedoStack([]); // New action invalidates redo stack
	});
};

export const pushAndPerformAction = (item: HistoryItem) => {
	pushHistory(item);
	batch(() => {
		for (const action of item.actions) {
			performCellAction(action.uid, action.before, action.after);
		}
		setSelectedCells(item.afterSelect);
		setSheetDirty(true);
	});
	runner.recompile();
};

const performCellAction = (
	uid: string,
	from: CellHistoryState | undefined,
	to: CellHistoryState | undefined,
) => {
	console.log("CellAction", uid, from, to);
	if (to === undefined) {
		// Deleting existing cell
		setCells(prev => prev.filter(id => id !== uid));
		cellMap.delete(uid);
	} else if (from === undefined) {
		// Non-exist state, so we are creating a new cell
		const newCell = thawCell(to!.data);
		// Override the random uid to match the history one
		newCell.uid = uid;
		cellMap.set(uid, newCell);
		setCells(prev => {
			const newCells = [...prev];
			newCells.splice(to!.index, 0, uid);
			return newCells;
		});
	} else {
		// Update existing cell
		cellMap.get(uid)?.setData(to.data);
		if (from.index !== to.index) {
			setCells(prev => {
				const newCells = [...prev];
				// Remove from old position
				const existingIdx = newCells.indexOf(uid);
				if (existingIdx !== -1) {
					newCells.splice(existingIdx, 1);
				}
				// Insert to new position
				newCells.splice(to.index, 0, uid);
				return newCells;
			});
		}
	}
};

export const runUndo = () => {
	// Pop the last history and reorder stack
	const stk = historyStack();
	if (stk.length === 0) return;
	const last = stk[stk.length - 1];

	batch(() => {
		setHistoryStack(prev => prev.slice(0, -1));
		setRedoStack(prev => [...prev, last]);
	});

	// Apply the inverse of last
	batch(() => {
		for (let i = last.actions.length - 1; i >= 0; i--) {
			const action = last.actions[i];
			performCellAction(action.uid, action.after, action.before);
		}
		setSelectedCells(last.beforeSelect);
		setSheetDirty(true);
	});
	runner.recompile();
};

export const runRedo = () => {
	// Pop the last redo and reorder stack
	const act = redoStack();
	if (act.length === 0) return;
	const next = act[act.length - 1];

	batch(() => {
		setRedoStack(prev => prev.slice(0, -1));
		setHistoryStack(prev => [...prev, next]);
	});

	// Apply the redo action
	batch(() => {
		for (const action of next.actions) {
			performCellAction(action.uid, action.before, action.after);
		}
		setSheetDirty(true);
		setSelectedCells(next.afterSelect);
	});
	runner.recompile();
};

export const canUndo = () => historyStack().length > 0;
export const canRedo = () => redoStack().length > 0;
