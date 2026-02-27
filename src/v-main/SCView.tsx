import { Show, type Component } from "solid-js";
import type { Cell } from "./state";
import {
	TbFillTrash,
	TbOutlineEdit,
	TbOutlinePencil,
	TbOutlineTrash,
} from "solid-icons/tb";

type Props = {
	cell: Cell;

	onEditStart: () => void;
	onDelete: () => void;
};
const SCView: Component<Props> = props => {
	const data = () => props.cell.getData();
	const value = () => props.cell.value();

	return (
		<>
			<div class="sc-v-hd is-flex is-align-items-center is-justify-content-space-between py-1">
				<b>{data().id}</b>=
				<div
					class="sc-v-formula is-font-monospaced"
					onClick={() => props.onEditStart()}>
					<Show when={data().formula} fallback={<i>(no formula)</i>}>
						<code>{data().formula}</code>
					</Show>
				</div>
				<span class="icon overlay">
					<TbOutlineEdit />
				</span>
			</div>
			<div class="sc-v-val">
				<Show when={value() !== undefined} fallback={<i>(no value)</i>}>
					<pre>{value()}</pre>
				</Show>
			</div>
		</>
	);
};

export default SCView;
