import { createSignal, For, Show, type Component } from "solid-js";
import { deleteCell, updateCell, type Cell } from "./state";
import {
	TbFillKey,
	TbOutlineCancel,
	TbOutlineCheck,
	TbOutlineKey,
	TbOutlineTrash,
} from "solid-icons/tb";
import {
	cellColorSchema,
	cellDisplayMode,
	type CellColor,
	type CellDisplayMode,
	type FrozenCell,
} from "../core/cell";
import CodeEdit from "../components/code/CodeEdit";

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
								<For each={cellDisplayMode.options}>
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
				const dm = cellDisplayMode.safeParse(data().meta.displayMode);
				return dm.success ? dm.data : "default";
			})(),
		);

	let idRef!: HTMLInputElement;

	const handleSave = () => {
		const newData: FrozenCell = {
			id: idRef.value.trim(),
			formula: codeGetBox[0] ? codeGetBox[0]() : data().formula,
			meta: {
				type: { type: "code" },
				color: selectedColor() !== "none" ? selectedColor() : undefined,
			},
		};
		updateCell(props.cell.uid, newData);
		props.onEditEnd();
	};

	return (
		<>
			<div class="control has-icons-left">
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
			<div>
				<CodeEdit
					class="sc-code my-2"
					codeGetBox={codeGetBox}
					language={"javascript"}
					initText={data().formula}
				/>
			</div>

			<div class="my-1">
				<div
					class="has-text-centered is-size-6 show-option-toggle cursor-pointer"
					onClick={() => setShowOptions(s => !s)}>
					- More Options -
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
			</div>

			<div class="field is-flex is-justify-content-space-between">
				<div>
					<button
						class="button is-small is-danger"
						onClick={() => deleteCell(props.cell.uid)}>
						<span class="icon">
							<TbOutlineTrash />
						</span>
						<span>Delete</span>
					</button>
				</div>
				<div class="is-flex is-gap-1 is-align-items-stretch">
					<button class="button is-small" onClick={() => props.onEditEnd()}>
						<span class="icon">
							<TbOutlineCancel />
						</span>
						<span>Cancel</span>
					</button>
					<button class="button is-small is-primary" onClick={handleSave}>
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
