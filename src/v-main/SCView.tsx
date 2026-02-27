import { Match, Show, Switch, type Component } from "solid-js";
import type { Cell } from "./state";
import { TbOutlineEdit } from "solid-icons/tb";

type DisplayProps = {
	value: any;
};

const DefaultDisplay: Component<DisplayProps> = props => {
	return (
		<Switch>
			<Match when={props.value === undefined}>
				<i>(no value)</i>
			</Match>
			<Match when={props.value instanceof Error}>
				<div class="notification is-danger is-light">
					<strong>Error:</strong> {`${props.value}`}
				</div>
			</Match>
			<Match when={true}>
				<pre>{String(props.value)}</pre>
			</Match>
		</Switch>
	);
};

type Props = {
	cell: Cell;

	onEditStart: () => void;
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
				<DefaultDisplay value={value()} />
			</div>
		</>
	);
};

export default SCView;
