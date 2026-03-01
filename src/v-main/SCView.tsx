import { Match, Show, Switch, type Component } from "solid-js";
import type { Cell } from "./state";
import { TbOutlineEdit } from "solid-icons/tb";
import { cellDisplayModeSchema, type CellDisplayMode } from "../core/cell";
import { Dynamic } from "solid-js/web";
import YAML from "yaml";
import toml from "smol-toml";
import { marked } from "marked";
import DOMPurify from "dompurify";

type DisplayProps = {
	value: any;
};

const DefaultDisplay: Component<DisplayProps> = props => {
	return <pre>{String(props.value)}</pre>;
};

const JSONDisplay: Component<DisplayProps> = props => {
	return <pre>{JSON.stringify(props.value, null, 2)}</pre>;
};

const YAMLDisplay: Component<DisplayProps> = props => {
	return <pre>{YAML.stringify(props.value)}</pre>;
};

const TOMLDisplay: Component<DisplayProps> = props => {
	return <pre>{toml.stringify(props.value)}</pre>;
};

const MarkdownDisplay: Component<DisplayProps> = props => {
	const html = () => {
		const raw = marked.parse(String(props.value), { async: false });
		return DOMPurify.sanitize(raw as string);
	};
	return <div class="content" innerHTML={html()} />;
};

const HTMLDisplay: Component<DisplayProps> = props => {
	const html = () => DOMPurify.sanitize(String(props.value));
	return <div innerHTML={html()} />;
};

const displayComponents: Map<
	CellDisplayMode,
	Component<DisplayProps>
> = new Map([
	["default", DefaultDisplay],
	["json", JSONDisplay],
	["yaml", YAMLDisplay],
	["toml", TOMLDisplay],
	["markdown", MarkdownDisplay],
	["html", HTMLDisplay],
]);

type Props = {
	cell: Cell;

	onEditStart: () => void;
};
const SCView: Component<Props> = props => {
	const data = () => props.cell.getData();
	const value = () => props.cell.value();

	const displayMode = () => {
		const dm = data().meta.displayMode;
		const v = cellDisplayModeSchema.safeParse(dm);
		return v.success ? v.data : "default";
	};

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
				<Switch>
					<Match when={value() === undefined}>
						<i>(no value)</i>
					</Match>
					<Match when={value() instanceof Error}>
						<div class="notification is-danger is-light">
							<strong>Error:</strong> {`${value()}`}
						</div>
					</Match>
					<Match when={true}>
						<Dynamic
							component={displayComponents.get(displayMode())}
							value={value()}
						/>
					</Match>
				</Switch>
			</div>
		</>
	);
};

export default SCView;
