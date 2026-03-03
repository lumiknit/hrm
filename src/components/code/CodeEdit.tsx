import { createEffect, onCleanup, onMount, splitProps } from "solid-js";
import type { Component, JSX } from "solid-js";
import { createMediaQuery } from "@solid-primitives/media";

import {
	Compartment,
	EditorState,
	type Extension,
	Prec,
} from "@codemirror/state";
import { EditorView, lineNumbers, keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { autocompletion } from "@codemirror/autocomplete";

import { defaultDark, defaultLight } from "./cm_thm_default";

import { cmLangExt } from "./lang_ext";

export interface Props extends Omit<
	JSX.HTMLAttributes<HTMLDivElement>,
	"onChange"
> {
	language?: string;
	initText?: string;
	disabled?: boolean;
	maxHeight?: string;

	codeGetBox: [(() => string)?];
	codeAppendBox?: [((text: string) => void)?];
	codeSetText?: [((text: string) => void)?];
	onKeyModEnter?: () => void; // Enter with modifier
}

const CodeEdit: Component<Props> = props => {
	const [local, rest] = splitProps(props, [
		"language",
		"initText",
		"disabled",
		"maxHeight",
		"class",
		"codeGetBox",
		"codeAppendBox",
		"codeSetText",
	]);
	let containerRef!: HTMLDivElement;
	let editorView: EditorView | null = null;

	const updateCompartment = (comp: Compartment) => (ext: Extension) => {
		editorView?.dispatch({
			effects: comp.reconfigure(ext),
		});
	};

	let themeCompartment = new Compartment();
	const updateThemeExt = updateCompartment(themeCompartment);
	const colorSchemeChanges = createMediaQuery("(prefers-color-scheme: dark)");
	const getThemeExt = () => (colorSchemeChanges() ? defaultDark : defaultLight);
	createEffect(() => updateThemeExt(getThemeExt()));

	// Create a stable reference to onChange to avoid reconfiguring listeners
	const langCompartment = new Compartment();

	const Theme = EditorView.theme({
		"&": {
			fontSize: "1rem",
			maxHeight: local.maxHeight || "30svh",
		},
		".cm-content": {
			fontFamily: "var(--cm-monospace)",
		},
		".cm-scroller": {
			overflow: "auto",
		},
	});

	onMount(() => {
		// Basic setup extensions needed for a standard editor feel
		const extensions = [
			lineNumbers(),
			EditorView.lineWrapping,
			history(),
			autocompletion(),
			keymap.of([...defaultKeymap, ...historyKeymap]),
			Prec.highest(
				keymap.of([
					{
						key: "Alt-Enter",
						run: () => {
							props.onKeyModEnter?.();
							return true;
						},
					},
					{
						key: "Mod-Enter",
						run: () => {
							props.onKeyModEnter?.();
							return true;
						},
					},
					{
						key: "Shift-Enter",
						run: () => {
							props.onKeyModEnter?.();
							return true;
						},
					},
					{
						key: "Ctrl-Enter",
						run: () => {
							props.onKeyModEnter?.();
							return true;
						},
					},
				]),
			),
			EditorState.readOnly.of(!!local.disabled),
			themeCompartment.of(getThemeExt()),
			langCompartment.of([]),
			Theme,
			EditorView.domEventHandlers({
				drop(event, view) {
					if (!event.dataTransfer?.files.length) return false;

					event.preventDefault();
					const file = event.dataTransfer.files[0];
					const reader = new FileReader();

					reader.onload = e => {
						const text = e.target?.result;
						if (typeof text === "string") {
							const pos = view.posAtCoords({
								x: event.clientX,
								y: event.clientY,
							});
							if (pos !== null) {
								view.dispatch({
									changes: { from: pos, to: pos, insert: text },
									selection: { anchor: pos + text.length },
								});
								view.focus();
							}
						}
					};

					reader.readAsText(file);
					return true;
				},
			}),
		];

		const state = EditorState.create({
			doc: local.initText || "",
			extensions,
		});

		editorView = new EditorView({
			state,
			parent: containerRef,
		});

		props.codeGetBox[0] = () => editorView?.state.doc.toString() || "";
		if (props.codeAppendBox) {
			props.codeAppendBox[0] = (text: string) => {
				if (editorView) {
					const docLength = editorView.state.doc.length;
					editorView.dispatch({
						changes: { from: docLength, insert: text },
						selection: { anchor: docLength + text.length },
						effects: EditorView.scrollIntoView(docLength + text.length)
					});
					editorView.focus();
				}
			};
		}
		if (props.codeSetText) {
			props.codeSetText[0] = (text: string) => {
				if (editorView) {
					editorView.dispatch({
						changes: { from: 0, to: editorView.state.doc.length, insert: text },
						selection: { anchor: text.length },
						effects: EditorView.scrollIntoView(text.length)
					});
					editorView.focus();
				}
			};
		}
	});

	// Reactively update language if it changes
	createEffect(async () => {
		if (editorView) {
			const lang = await cmLangExt(local.language || "");
			updateCompartment(langCompartment)(lang);
		}
	});

	onCleanup(() => {
		if (editorView) {
			editorView.destroy();
		}
	});

	return <div ref={containerRef} {...rest} class={local.class} />;
};

export default CodeEdit;
