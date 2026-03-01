import { createSignal, untrack, type Accessor, type Setter } from "solid-js";
import { EffectController } from "../core/effect";
import * as Effect from "../core/effect";
import { cellMap } from "./state";
import { compileCode, wrapBacktick } from "../core/js";
import type { CellType } from "../core/cell";
import YAML from "yaml";
import toml from "smol-toml";

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

const compileCellCode = (
	code: string,
	cellType: CellType,
	nameSet: Set<string>,
): [string, Function] => {
	switch (cellType.type) {
		case "code": {
			// Compile the code as JS function
			const compiled = compileCode(code, nameSet);
			const effectFn = new AsyncFunction(
				"$", // Getter objects
				"$_", // Current effect scope
				compiled,
			);
			return [compiled, effectFn];
		}
		case "raw": {
			// Return the code as a raw string directly.
			const compiled = code;
			const effectFn = () => code;
			return [compiled, effectFn];
		}
		case "backtick": {
			// Compile the code as a JS template string, wrapping by backticks.
			// TODO: Handle escaping backticks in the code.
			const wrapped = wrapBacktick(code);
			const compiled = compileCode(wrapped, nameSet);
			const effectFn = new AsyncFunction(
				"$", // Getter objects
				"$_", // Current effect scope
				compiled,
			);
			return [compiled, effectFn];
		}
		case "data": {
			// In this case, we need to parse the code as a data format.
			let dataJSON: string;
			let effectFn: Function;
			switch (cellType.lang) {
				case "yaml": {
					const d = YAML.parse(code);
					dataJSON = JSON.stringify(d);
					effectFn = () => d;
					break;
				}
				case "toml": {
					const d = toml.parse(code);
					dataJSON = JSON.stringify(d);
					effectFn = () => d;
					break;
				}
				default: {
					throw new Error(`Unsupported data format: ${(cellType as any).lang}`);
				}
			}
			return [dataJSON, effectFn];
		}
	}
};

type CellInternal = {
	id: string;
	code: string;
	cellType: CellType;

	// Compile result
	compiled: string;
	effectFn: Function;

	initValue: any;
	valueSetter: Setter<any>;
};

class Runner {
	ctrl: EffectController;
	items: Map<string, CellInternal> = new Map();

	// If paused is to control the execution of the effect loop.
	paused: Accessor<boolean>;
	setPaused: Setter<boolean>;

	// Running is to indicate whether the loop is currently running.
	running: Accessor<boolean>;
	setRunning: Setter<boolean>;

	constructor() {
		this.ctrl = new EffectController();

		const [paused, setPaused] = createSignal(false);
		this.paused = paused;
		this.setPaused = setPaused;

		const [running, setRunning] = createSignal(false);
		this.running = running;
		this.setRunning = setRunning;

		this.runLoop();
	}

	async runLoop() {
		if (untrack(() => !this.paused() && this.running())) {
			const processed = await this.ctrl.run(10000);
			console.log("RUN", processed);
			if (processed === 0) {
				console.log("RUN: No effects to run");
				this.setRunning(false);
			}
		}
		setTimeout(() => this.runLoop(), 100);
	}

	recompile() {
		const newCtrl = new EffectController();
		const items = new Map<string, CellInternal>();

		// Traverse cells and gather data.
		for (const c of cellMap.values()) {
			const d = c.getData();
			items.set(d.id, {
				id: d.id,
				code: d.formula,
				cellType: d.meta.type,
				compiled: "", // Put empty yet.
				effectFn: () => {}, // Put empty yet.
				initValue: c.value(),
				valueSetter: c.setValue,
			});
		}

		// Compile codes
		const nameSet = new Set(items.keys());
		const getters: Record<string, Effect.Getter<any>> = {};
		const setters: Record<string, Effect.Setter<any>> = {};
		for (const [, i] of items) {
			let initValue = i.initValue;
			try {
				const [c, f] = compileCellCode(i.code, i.cellType, nameSet);
				i.compiled = c;
				i.effectFn = f;
			} catch (e) {
				console.error(`Error compiling cell ${i.id}:`, e);
				i.effectFn = () => {
					return e;
				};
				initValue = e;
			}
			const [get, set] = newCtrl.sig(initValue);
			getters[i.id] = get;
			setters[i.id] = set;
		}

		// Start effects
		for (const [, i] of items) {
			newCtrl.eff(async ctx => {
				try {
					const result = await i.effectFn(getters, ctx);
					setters[i.id](result);
				} catch (e) {
					console.error(`Error in cell ${i.id}:`, e);
					setters[i.id](e);
				}
			});

			newCtrl.eff(ctx => {
				const val = getters[i.id](ctx);
				i.valueSetter(val);
			});
		}

		// Finish
		this.ctrl = newCtrl;
		this.items = items;
		this.setRunning(true);
	}
}

export const runner = new Runner();
