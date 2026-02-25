import { createSignal, For, Match, Switch, type Component } from "solid-js";
import { EffectController, type Signal } from "../core/effect";

import { parse } from "acorn";
import { simple } from "acorn-walk";
import { generate } from "astring";

function transformWithParser(code: string, names: Set<string>) {
	const ast = parse(code, {
		ecmaVersion: "latest",
		sourceType: "script",
		allowReturnOutsideFunction: true,
	});
	console.log(ast);

	// Swap identifiers with dollar prefix + function call
	simple(ast, {
		Identifier(node) {
			if (!names.has(node.name)) return;
			node.name = `$.${node.name}()`;
		},
	});

	// If the last statement is non-return expression, wrap it with return
	if (ast.type === "Program" && ast.body.length > 0) {
		const last = ast.body[ast.body.length - 1];
		if (last.type === "ExpressionStatement") {
			ast.body[ast.body.length - 1] = {
				type: "ReturnStatement",
				argument: last.expression,
			} as any;
		}
	}

	return generate(ast);
}

type Cell = {
	id: string;
	script: string;
	value?: any;
};

const [cells, setCells] = createSignal<Cell[]>([]);

const addCell = () => {
	setCells(prev => [...prev, { id: `c${prev.length + 1}`, script: "" }]);
};

type CellProps = {
	id: string;
	initScript: string;
	updateID: (newID: string) => void;
	updateScript: (newScript: string) => void;
};
const CellEdit: Component<CellProps> = props => {
	let idRef!: HTMLInputElement;
	let scriptRef!: HTMLTextAreaElement;
	const handleIDChange = () => {
		props.updateID(idRef.value);
	};
	const handleScriptChange = () => {
		props.updateScript(scriptRef.value);
	};

	return (
		<>
			<div class="field">
				<label class="label">ID</label>
				<div class="control">
					<input
						ref={idRef}
						class="input"
						type="text"
						placeholder="Cell Identifier"
						onChange={handleIDChange}
						value={props.id}
					/>
				</div>
			</div>
			<div class="field">
				<label class="label">{props.id}</label>
				<div class="control">
					<textarea
						ref={scriptRef}
						class="textarea"
						placeholder="Cell Script"
						onChange={handleScriptChange}
						value={props.initScript}
					/>
				</div>
			</div>
			<hr />
		</>
	);
};

type CellViewProps = {
	id: string;
	script: string;
	value: any;
	updateValue: (newValue: any) => void;
};
const CellView: Component<CellViewProps> = props => {
	let valRef!: HTMLInputElement;
	const handleChange = () => {
		const v = valRef.value;
		const parsed = JSON.parse(v);
		props.updateValue(parsed);
	};
	return (
		<div class="field">
			<label class="label">
				<b>{props.id}</b> = <code>{props.script}</code>
			</label>
			<div class="control">
				<input
					ref={valRef}
					class="input"
					type="text"
					placeholder={JSON.stringify(props.value)}
					onChange={handleChange}
				/>
			</div>
		</div>
	);
};

const View: Component = () => {
	let ctrl = new EffectController();
	let sigMap: Record<string, Signal<any>> = {};

	let totalRunCount = 0;

	const [editing, setEditing] = createSignal(true);
	const [runCnt, setRunCnt] = createSignal(0);

	let runTimeout: number | null = null;

	const toggleEditing = () => {
		const editingNow = setEditing(s => !s);
		if (editingNow) {
			clearTimeout(runTimeout!);
			ctrl = new EffectController();
		} else {
			constructEffects();
			runTimeout = window.setInterval(async () => {
				const r = await ctrl.run(100);
				totalRunCount += r;
				setRunCnt(c => c * 0.8 + r * 0.2);
			}, 100);
		}
	};

	const constructEffects = () => {
		ctrl = new EffectController();
		const cs = cells();

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

	return (
		<div class="container">
			<div>
				<button
					class={"button" + (editing() ? " is-success" : " is-danger")}
					onClick={toggleEditing}>
					{editing() ? "Start" : "Edit"}
				</button>
				<button class="button is-primary" onClick={addCell}>
					Add Cell
				</button>
			</div>
			<div>Cell {cells().length}</div>
			<div>RunCnt {runCnt().toFixed(2)}</div>
			<Switch>
				<Match when={editing()}>
					<For each={cells()}>
						{cell => (
							<CellEdit
								id={cell.id}
								initScript={cell.script}
								updateID={newID =>
									setCells(prev =>
										prev.map(c => (c.id === cell.id ? { ...c, id: newID } : c)),
									)
								}
								updateScript={newScript =>
									setCells(prev =>
										prev.map(c =>
											c.id === cell.id ? { ...c, script: newScript } : c,
										),
									)
								}
							/>
						)}
					</For>
				</Match>
				<Match when={!editing()}>
					<For each={cells()}>
						{cell => (
							<CellView
								id={cell.id}
								script={cell.script}
								value={cell.value}
								updateValue={newVal =>
									setCells(prev => {
										sigMap[cell.id][1](newVal);
										return prev.map(c =>
											c.id === cell.id ? { ...c, value: newVal } : c,
										);
									})
								}
							/>
						)}
					</For>
				</Match>
			</Switch>
		</div>
	);
};

export default View;
