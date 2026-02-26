import type { Setter } from "solid-js";
import { EffectController } from "../core/effect";
import { cellMap, cells } from "./state";

type CellInternal = {
	id: string;
	code: string;
	compiled: string;

	initValue: any;
	valueSetter: Setter<any>;
};

class Runner {
	ctrl: EffectController;
	items: Map<string, CellInternal> = new Map();
	paused: boolean = false;

	constructor() {
		this.ctrl = new EffectController();
	}

	recompile() {
		const newCtrl = new EffectController();
		const items = Map<string, CellInternal>();

		// Traverse cells and compile code
		for (const c of cellMap.values()) {
			const meta = c.getData().meta;
			items.set(c.getData().id, {
				id: c.getData().id,
				code: c.getData().formula,
				compiled: "", // Put empty yet.
			});
		}
	}

	setPause(pause: boolean) {
		this.paused = pause;
	}
}

const constructEffects = () => {
	const names = new Set(cs.map(c => c.id));

	// Create signals for each cell

	sigMap = {};
	for (const c of cs) {
		const sig = ctrl.sig(null);
		sigMap[c.id] = sig;
	}

	// Create value getter proxy
	const getters: Record<string, () => any> = {};
	for (const c of cs) {
		getters[c.id] = sigMap[c.id][0];
	}

	// Build effects for each cell
	for (const c of cs) {
		const tr = transformWithParser(c.script, names);
		console.log("Before", c.script);
		console.log("After ", tr);
		const effectFn = new Function("$", tr);
		console.log("BUILD ", c.id, effectFn.toString());
		ctrl.eff(() => {
			try {
				const result = effectFn(getters);
				sigMap[c.id][1](result);
			} catch (e) {
				console.error(`Error in cell ${c.id}:`, e);
			}
		});
	}

	// Create effect to update cell values
	for (const c of cs) {
		ctrl.eff(() => {
			const val = getters[c.id]();
			console.log("CHANGE ", c.id, val);
			setCells(prev =>
				prev.map(cell => (cell.id === c.id ? { ...cell, value: val } : cell)),
			);
		});
	}
};
