import {
	Match,
	Show,
	Switch,
	untrack,
	createSignal,
	type Component,
} from "solid-js";
import { cellMap, updateCell, type Cell } from "./state";
import { compileCellCode } from "./runner";
import CodeEdit from "../components/code/CodeEdit";
import {
	TbOutlineCopy,
	TbOutlineDownload,
	TbOutlineEdit,
	TbFillPhoto,
	TbOutlinePhotoOff,
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
	uid: string;
	cell: Cell;
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
					<div class="value-display">{String(props.value)}</div>
				</Match>
			</Switch>
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
					<div class="value-display">
						{JSON.stringify(props.value, null, 2)}
					</div>
				</Match>
			</Switch>
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
					<div class="value-display">{YAML.stringify(props.value)}</div>
				</Match>
			</Switch>
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
					<div class="value-display">{toml.stringify(props.value)}</div>
				</Match>
			</Switch>
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

const InputDisplay: Component<DisplayProps> = props => {
	const codeGetBox: [(() => string)?] = [];
	const [showOutput, setShowOutput] = createSignal(false);

	const handleBlur = () => {
		const formula = codeGetBox[0]?.() ?? "";
		const data = untrack(() => props.cell.getData());
		if (data.formula === formula) return;

		try {
			const nameSet = new Set<string>();
			for (const c of cellMap.values()) {
				nameSet.add(untrack(() => c.getData()).id);
			}
			compileCellCode(formula, data.meta.type, nameSet);
		} catch (err) {
			toast.error("Code compile error! Please fix before saving.");
			return;
		}

		updateCell(props.uid, { ...data, formula });
	};

	const lang = () => {
		const type = props.cell.getData().meta.type;
		return (type as any).lang ?? "javascript";
	};

	return (
		<div>
			<div class="is-relative mb-2">
				<CodeEdit
					initText={props.cell.getData().formula}
					language={lang()}
					codeGetBox={codeGetBox}
					onFocusOut={handleBlur}
					class="sc-code"
					onKeyModEnter={handleBlur}
				/>
				<div class="is-flex is-gap-1 is-abs-top-right">
					<button
						class="p-2"
						title={showOutput() ? "Hide Output" : "Show Output"}
						onClick={() => setShowOutput(o => !o)}>
						<span class="icon is-small">
							<Show when={showOutput()} fallback={<TbOutlinePhotoOff />}>
								<TbFillPhoto />
							</Show>
						</span>
					</button>
				</div>
			</div>
			<Show when={showOutput()}>
				<div class="is-relative mt-2">
					<DisplayCopyOverlay onData={() => String(props.value)} />
					<div class="value-display">{String(props.value)}</div>
				</div>
			</Show>
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
	["input", InputDisplay],
]);

type Props = {
	uid: string;
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
				<Dynamic
					component={displayComponents.get(displayMode())}
					value={value()}
					cell={props.cell}
					uid={props.uid}
				/>
			</div>
		</>
	);
};

export default SCView;
