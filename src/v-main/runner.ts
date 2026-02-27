import {
	createSignal,
	untrack,
	type Accessor,
	type Setter,
	type Signal,
} from "solid-js";
import { EffectController } from "../core/effect";
import * as Effect from "../core/effect";
import { cellMap } from "./state";
import { compileCode } from "../core/js";

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

type CellInternal = {
	id: string;
	code: string;

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
			items.set(c.getData().id, {
				id: c.getData().id,
				code: c.getData().formula,
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
				i.compiled = compileCode(i.code, nameSet);
				i.effectFn = new AsyncFunction(
					"$", // Getter objects
					"$_", // Current effect scope
					i.compiled,
				);
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
