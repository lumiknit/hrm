import { createSignal, For, Show, type Component } from "solid-js";
import { deleteCell, updateCell, type Cell } from "./state";
import {
	TbOutlineCancel,
	TbOutlineCheck,
	TbOutlineTrash,
} from "solid-icons/tb";
import { cellColorSchema, type CellColor, type FrozenCell } from "../core/cell";
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
			<div>
				<input
					ref={idRef}
					class="input is-family-monospace"
					placeholder="Identifier"
					value={data().id}
				/>
			</div>
			<div>
				<CodeEdit
					class="sc-code my-2"
					codeGetBox={codeGetBox}
					language={"javascript"}
					initText={data().formula}
				/>
			</div>

			<div>
				<div
					class="has-text-centered is-size-6 show-option-toggle"
					onClick={() => setShowOptions(s => !s)}>
					- Show Options -
				</div>
				<Show when={showOptions()}>
					<ColorSelect
						color={selectedColor()}
						onChange={c => setSelectedColor(c)}
					/>
				</Show>
			</div>

			<div class="field is-grouped">
				<p class="control">
					<button class="button is-small is-primary" onClick={handleSave}>
						<span class="icon">
							<TbOutlineCheck />
						</span>
						<span>Save</span>
					</button>
				</p>
				<p class="control">
					<button
						class="button is-small is-danger"
						onClick={() => deleteCell(props.cell.uid)}>
						<span class="icon">
							<TbOutlineTrash />
						</span>
						<span>Delete</span>
					</button>
				</p>
				<p class="control">
					<button class="button is-small" onClick={() => props.onEditEnd()}>
						<span class="icon">
							<TbOutlineCancel />
						</span>
						<span>Cancel</span>
					</button>
				</p>
			</div>
		</>
	);
};

export default SCEdit;
