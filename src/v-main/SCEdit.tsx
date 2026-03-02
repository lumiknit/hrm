import { createSignal, For, Show, type Component } from "solid-js";
import { deleteCell, freezeCellValue, updateCell, type Cell } from "./state";
import { compileCellCode } from "./runner";
import {
	TbOutlineCancel,
	TbOutlineCheck,
	TbOutlineIceCream2,
	TbOutlineKey,
	TbOutlineTrash,
} from "solid-icons/tb";
import {
	cellColorSchema,
	cellDisplayModeSchema,
	type CellColor,
	type CellDisplayMode,
	type CellType,
	type FrozenCell,
	cellTypeSchema,
} from "../core/cell";
import CodeEdit from "../components/code/CodeEdit";
import { isSupportedLang } from "../components/code/lang_ext";
import toast from "solid-toast";

type ColorSelectProps = {
	color: CellColor;
	onChange: (color: CellColor) => void;
};

const ColorSelect: Component<ColorSelectProps> = props => {
	return (
		<div class="field is-horizontal">
			<div class="field-label is-normal">
				<label class="label">Color</label>
			</div>
			<div class="field-body">
				<div class="field">
					<div class="control">
						<div
							class={
								"select is-fullwidth " +
								(props.color !== "none" ? `is-${props.color}` : "")
							}>
							<select
								onChange={e =>
									props.onChange(e.currentTarget.value as CellColor)
								}>
								<For each={cellColorSchema.options}>
									{c => (
										<option value={c} selected={props.color === c}>
											{c}
										</option>
									)}
								</For>
							</select>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

type CellTypeProps = {
	type: CellType;
	onChange: (type: CellType) => void;
};

const CellTypeSelect: Component<CellTypeProps> = props => {
	const currentType = () => props.type.type;

	const handleTypeChange = (newType: CellType["type"]) => {
		if (newType === "code") {
			props.onChange({ type: "code" });
		} else if (newType === "raw" || newType === "backtick") {
			props.onChange({ type: newType, lang: "" });
		} else if (newType === "data") {
			props.onChange({ type: "data", lang: "yaml" });
		}
	};

	const handleLangChange = (lang: string) => {
		const t = props.type;
		if (t.type === "raw" || t.type === "backtick") {
			props.onChange({ ...t, lang });
		} else if (t.type === "data") {
			props.onChange({ ...t, lang: lang as any });
		}
	};

	return (
		<div class="field is-horizontal">
			<div class="field-body">
				<div class="field is-grouped">
					<div class="control">
						<div class="select">
							<select
								value={currentType()}
								onChange={e =>
									handleTypeChange(e.currentTarget.value as CellType["type"])
								}>
								<option value="code">Code</option>
								<option value="raw">Raw</option>
								<option value="backtick">Backtick</option>
								<option value="data">Data</option>
							</select>
						</div>
					</div>

					<Show
						when={props.type.type === "raw" || props.type.type === "backtick"}>
						<div class="control is-expanded">
							<input
								class={
									"input " +
									((props.type as any).lang &&
									!isSupportedLang((props.type as any).lang)
										? "is-danger"
										: "")
								}
								type="text"
								placeholder="Language (e.g. javascript)"
								value={(props.type as any).lang ?? ""}
								onChange={e => handleLangChange(e.currentTarget.value)}
							/>
						</div>
					</Show>

					<Show when={props.type.type === "data"}>
						<div class="control">
							<div class="select">
								<select
									value={(props.type as any).lang}
									onChange={e => handleLangChange(e.currentTarget.value)}>
									<option value="yaml">JSON/YAML</option>
									<option value="toml">TOML</option>
								</select>
							</div>
						</div>
					</Show>
				</div>
			</div>
		</div>
	);
};

type DisplayModeSelectProps = {
	displayMode: CellDisplayMode;
	onChange: (displayMode: CellDisplayMode) => void;
};

const DisplayModeSelect: Component<DisplayModeSelectProps> = props => {
	return (
		<div class="field is-horizontal">
			<div class="field-label is-normal">
				<label class="label">Display</label>
			</div>
			<div class="field-body">
				<div class="field">
					<div class="control">
						<div class="select">
							<select
								onChange={e =>
									props.onChange(e.currentTarget.value as CellDisplayMode)
								}>
								<For each={cellDisplayModeSchema.options}>
									{c => (
										<option value={c} selected={props.displayMode === c}>
											{c}
										</option>
									)}
								</For>
							</select>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

type Props = {
	cell: Cell;

	onEditEnd: () => void;
};
const SCEdit: Component<Props> = props => {
	const codeGetBox: [(() => string)?] = [];
	const [showOptions, setShowOptions] = createSignal(false);
	const data = () => props.cell.getData();

	const [selectedColor, setSelectedColor] = createSignal<CellColor>(
		(() => {
			const c = cellColorSchema.safeParse(data().meta.color);
			return c.success ? c.data : "none";
		})(),
	);
	const [selectedDisplayMode, setSelectedDisplayMode] =
		createSignal<CellDisplayMode>(
			(() => {
				const dm = cellDisplayModeSchema.safeParse(data().meta.displayMode);
				return dm.success ? dm.data : "default";
			})(),
		);
	const [selectedType, setSelectedType] = createSignal<CellType>(
		(() => {
			const t = cellTypeSchema.safeParse(data().meta.type);
			return t.success ? t.data : { type: "code" };
		})(),
	);

	const cmLang = () => {
		const t = selectedType();
		switch (t.type) {
			case "code":
				return "javascript";
			case "raw":
			case "backtick":
				return t.lang || "plaintext";
			case "data":
				return t.lang || "plaintext";
		}
	};

	let idRef!: HTMLInputElement;

	const [compileError, setCompileError] = createSignal<string>();

	const handleSave = () => {
		const id = idRef.value.trim();
		const formula = codeGetBox[0] ? codeGetBox[0]() : data().formula;
		const type = selectedType();

		// Validation: Compilation
		try {
			const nameSet = new Set<string>();
			compileCellCode(formula, type, nameSet);
			setCompileError(undefined);
		} catch (e) {
			setCompileError(String(e));
			toast.error("Code compile error! Please fix before saving.");
			return;
		}

		const newData: FrozenCell = {
			id,
			formula,
			meta: {
				type,
				color: selectedColor() !== "none" ? selectedColor() : undefined,
				displayMode:
					selectedDisplayMode() !== "default"
						? selectedDisplayMode()
						: undefined,
				help: data().meta.help,
			},
		};
		updateCell(props.cell.uid, newData);
		props.onEditEnd();
	};

	return (
		<>
			<div class="control has-icons-left mb-2">
				<input
					ref={idRef}
					class="input is-family-monospace"
					placeholder="Identifier"
					value={data().id}
				/>
				<span class="icon is-left">
					<TbOutlineKey />
				</span>
			</div>
			<CellTypeSelect
				type={selectedType()}
				onChange={t => setSelectedType(t)}
			/>

			<Show when={compileError()}>
				<div class="notification is-danger my-2">
					<button
						class="delete"
						onClick={() => setCompileError(undefined)}></button>
					<strong>Compilation Error:</strong>
					<pre class="is-background-transparent p-0 mt-1">{compileError()}</pre>
				</div>
			</Show>

			<div>
				<CodeEdit
					class="sc-code my-2"
					codeGetBox={codeGetBox}
					language={cmLang()}
					initText={data().formula}
					onKeyModEnter={handleSave}
				/>
			</div>

			<Show when={showOptions()}>
				<ColorSelect
					color={selectedColor()}
					onChange={c => setSelectedColor(c)}
				/>
				<DisplayModeSelect
					displayMode={selectedDisplayMode()}
					onChange={dm => setSelectedDisplayMode(dm)}
				/>
			</Show>

			<div class="field is-flex is-justify-content-space-between">
				<div class="is-flex is-gap-1 is-align-items-stretch">
					<button
						class="button is-small is-danger"
						title="Delete this cell"
						onClick={() => deleteCell(props.cell.uid)}>
						<span class="icon">
							<TbOutlineTrash />
						</span>
						<span class="is-hidden-mobile">Delete</span>
					</button>
					<button
						class="button is-small is-warning"
						title="Freeze cell value (convert current value to static data)"
						onClick={() => freezeCellValue(props.cell.uid)}>
						<span class="icon">
							<TbOutlineIceCream2 />
						</span>
						<span class="is-hidden-mobile">Freeze</span>
					</button>
				</div>
				<div>
					<button
						class={"button is-small" + (showOptions() ? "" : " is-info")}
						title="Toggle more options"
						onClick={() => setShowOptions(s => !s)}>
						<span>Options</span>
					</button>
				</div>
				<div class="is-flex is-gap-1 is-align-items-stretch">
					<button
						class="button is-small"
						onClick={() => props.onEditEnd()}
						title="Cancel editing and discard changes">
						<span class="icon">
							<TbOutlineCancel />
						</span>
						<span class="is-hidden-mobile">Cancel</span>
					</button>
					<button
						class="button is-small is-primary"
						onClick={handleSave}
						title="Save changes">
						<span class="icon">
							<TbOutlineCheck />
						</span>
						<span>Save</span>
					</button>
				</div>
			</div>
		</>
	);
};

export default SCEdit;
