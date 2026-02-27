import { createEffect, onCleanup, onMount, splitProps } from "solid-js";
import type { Component, JSX } from "solid-js";
import { createMediaQuery } from "@solid-primitives/media";

import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { EditorView, lineNumbers, keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";

import { defaultDark, defaultLight } from "./cm_thm_default";

import { javascript } from "@codemirror/lang-javascript";

export interface Props extends Omit<
	JSX.HTMLAttributes<HTMLDivElement>,
	"onChange"
> {
	language?: string;
	initText?: string;
	disabled?: boolean;

	codeGetBox: [(() => string)?];
}

const CodeEdit: Component<Props> = props => {
	const [local, rest] = splitProps(props, [
		"language",
		"initText",
		"disabled",
		"class",
		"codeGetBox",
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
	const getLangExtension = (lang?: string) => {
		switch (lang?.toLowerCase()) {
			case "javascript":
			case "js":
			case "typescript":
			case "ts":
			case "json":
				return javascript();
			default:
				return [];
		}
	};

	const Theme = EditorView.theme({
		"&": {
			fontSize: "1rem",
		},
		".cm-content": {
			fontFamily: "var(--cm-monospace)",
		},
	});

	onMount(() => {
		// Basic setup extensions needed for a standard editor feel
		const extensions = [
			lineNumbers(),
			history(),
			keymap.of([...defaultKeymap, ...historyKeymap]),
			EditorState.readOnly.of(!!local.disabled),
			themeCompartment.of(getThemeExt()),
			langCompartment.of(getLangExtension(local.language)),
			Theme,
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
	});

	// Reactively update language if it changes
	createEffect(() => {
		if (editorView && local.language) {
			updateCompartment(langCompartment)(getLangExtension(local.language));
		}
	});

	onCleanup(() => {
		if (editorView) {
			editorView.destroy();
		}
	});

	return (
		<div
			ref={containerRef}
			{...rest}
			class={`text-edit-container flex flex-column ${local.class || ""}`}
		/>
	);
};

export default CodeEdit;
