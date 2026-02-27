import { createSignal, For, type Component } from "solid-js";
import { updateCell, validCellUpdate, type Cell } from "./state";
import {
	TbOutlineCancel,
	TbOutlineCheck,
	TbOutlineTrash,
} from "solid-icons/tb";
import toast from "solid-toast";
import { cellColorSchema, type CellColor, type FrozenCell } from "../core/cell";

type Props = {
	cell: Cell;

	onEditEnd: () => void;
	onDelete: () => void;
};
const SCEdit: Component<Props> = props => {
	const data = () => props.cell.getData();

	const [selectedColor, setSelectedColor] = createSignal<CellColor>(
		(() => {
			const c = cellColorSchema.safeParse(data().meta.color);
			return c.success ? c.data : "none";
		})(),
	);

	let idRef!: HTMLInputElement;
	let formulaRef!: HTMLTextAreaElement;

	const handleSave = () => {
		const newData: FrozenCell = {
			id: idRef.value.trim(),
			formula: formulaRef.value,
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
			<div
				class={
					"select " +
					(selectedColor() !== "none" ? `is-${selectedColor()}` : "")
				}>
				<select
					onChange={e => setSelectedColor(e.currentTarget.value as CellColor)}>
					<For each={cellColorSchema.options}>
						{color => (
							<option value={color} selected={selectedColor() === color}>
								{color}
							</option>
						)}
					</For>
				</select>
			</div>
			<div>
				<input
					ref={idRef}
					class="input is-family-monospace"
					placeholder="Identifier"
					value={data().id}
				/>
			</div>
			<div>
				<textarea
					ref={formulaRef}
					class="textarea is-family-monospace"
					placeholder="Formula (JS)"
					value={data().formula}
				/>
			</div>
			<div>
				<button class="button is-small is-primary" onClick={handleSave}>
					<span class="icon">
						<TbOutlineCheck />
					</span>
					<span>Save</span>
				</button>
				<button
					class="button is-small is-danger"
					onClick={() => props.onDelete()}>
					<span class="icon">
						<TbOutlineTrash />
					</span>
					<span>Delete</span>
				</button>
				<button class="button is-small" onClick={() => props.onEditEnd()}>
					<span class="icon">
						<TbOutlineCancel />
					</span>
					<span>Cancel</span>
				</button>
			</div>
		</>
	);
};

export default SCEdit;
