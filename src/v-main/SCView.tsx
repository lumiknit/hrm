import { Match, Show, Switch, type Component } from "solid-js";
import type { Cell } from "./state";
import {
	TbOutlineCopy,
	TbOutlineDownload,
	TbOutlineEdit,
} from "solid-icons/tb";
import toast from "solid-toast";
import { cellDisplayModeSchema, type CellDisplayMode } from "../core/cell";
import { Dynamic } from "solid-js/web";
import YAML from "yaml";
import toml from "smol-toml";
import { marked } from "marked";
import DOMPurify from "dompurify";

type DisplayProps = {
	value: any;
};

type CopyOverlayProps = {
	ext?: string;
	onData: () => any;
};

const DisplayCopyOverlay: Component<CopyOverlayProps> = props => {
	const handleCopy = () => {
		const data = props.onData();
		const text =
			typeof data === "string" ? data : JSON.stringify(data, null, 2);
		navigator.clipboard.writeText(text).then(() => {
			toast.success("Copied to clipboard");
		});
	};

	const handleDownload = () => {
		const data = props.onData();
		const text =
			typeof data === "string" ? data : JSON.stringify(data, null, 2);
		const blob = new Blob([text], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `data.${props.ext}`;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div class="is-flex is-gap-1 is-abs-top-right">
			<Show when={props.ext}>
				<button class="p-1" title="Download" onClick={handleDownload}>
					<span class="icon is-small">
						<TbOutlineDownload />
					</span>
				</button>
			</Show>
			<button class="p-2" title="Copy" onClick={handleCopy}>
				<span class="icon is-small">
					<TbOutlineCopy />
				</span>
			</button>
		</div>
	);
};

const DefaultDisplay: Component<DisplayProps> = props => {
	return (
		<div class="is-relative">
			<DisplayCopyOverlay onData={() => String(props.value)} />
			<pre>{String(props.value)}</pre>
		</div>
	);
};

const JSONDisplay: Component<DisplayProps> = props => {
	return (
		<div class="is-relative">
			<DisplayCopyOverlay
				ext="json"
				onData={() => JSON.stringify(props.value, null, 2)}
			/>
			<pre>{JSON.stringify(props.value, null, 2)}</pre>
		</div>
	);
};

const YAMLDisplay: Component<DisplayProps> = props => {
	return (
		<div class="is-relative">
			<DisplayCopyOverlay
				ext="yaml"
				onData={() => YAML.stringify(props.value)}
			/>
			<pre>{YAML.stringify(props.value)}</pre>
		</div>
	);
};

const TOMLDisplay: Component<DisplayProps> = props => {
	return (
		<div class="is-relative">
			<DisplayCopyOverlay
				ext="toml"
				onData={() => toml.stringify(props.value)}
			/>
			<pre>{toml.stringify(props.value)}</pre>
		</div>
	);
};

const MarkdownDisplay: Component<DisplayProps> = props => {
	const html = () => {
		const raw = marked.parse(String(props.value), { async: false });
		return DOMPurify.sanitize(raw as string);
	};
	return (
		<div class="is-relative">
			<DisplayCopyOverlay ext="md" onData={() => String(props.value)} />
			<div class="content" innerHTML={html()} />
		</div>
	);
};

const HTMLDisplay: Component<DisplayProps> = props => {
	const html = () => DOMPurify.sanitize(String(props.value));
	return (
		<div class="is-relative">
			<DisplayCopyOverlay ext="html" onData={() => String(props.value)} />
			<div innerHTML={html()} />
		</div>
	);
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
