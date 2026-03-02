import {
	TbFillSquare,
	TbOutlineArrowBackUp,
	TbOutlineArrowForwardUp,
	TbOutlineDeviceFloppy,
	TbOutlineFolder,
	TbOutlinePlus,
	TbOutlineProgress,
	TbOutlineRefresh,
} from "solid-icons/tb";
import {
	Switch,
	Match,
	type Component,
	createSignal,
	onMount,
	onCleanup,
} from "solid-js";
import { runner } from "./runner";
import {
	addEmptyCell,
	cloneSelectedCells,
	deleteSelectedCells,
	sheetDirty,
} from "./state";
import { showOpenSheetModal } from "./ModalOpenSheet";
import { showImportSheetModal } from "./ModalImportSheet";
import { showExportSheetModal } from "./ModalExportSheet";
import {
	actionEditSelectedCells,
	actionNewSheet,
	actionSaveSheet,
} from "./state-action";
import { runUndo, runRedo, canUndo, canRedo } from "./history";

const RunningIndicator: Component = () => {
	const paused = () => runner.paused();
	const running = () => runner.running();

	const btnClass = () => {
		return "button is-small " + (paused() ? "is-warning" : "is-success");
	};

	const handleClick = () => {
		runner.setPaused(p => !p);
	};

	return (
		<button
			class={btnClass()}
			onClick={handleClick}
			title={paused() ? "Resume" : "Pause"}>
			<span class="icon">
				<Switch>
					<Match when={running()}>
						<TbOutlineProgress />
					</Match>
					<Match when>
						<TbFillSquare />
					</Match>
				</Switch>
			</span>
			<span>Running</span>
		</button>
	);
};

const FileDropdown: Component = () => {
	const [active, setActive] = createSignal(false);

	const toggleActive = () => setActive(a => !a);

	return (
		<div class={"dropdown" + (active() ? " is-active" : "")}>
			<div class="dropdown-trigger">
				<button
					class="button is-small"
					onClick={toggleActive}
					title="File Menu">
					<span class="icon">
						<TbOutlineFolder />
					</span>
				</button>
			</div>
			<div class="dropdown-menu" id="dropdown-menu" role="menu">
				<div class="dropdown-content">
					<a
						href="#"
						class="dropdown-item"
						onClick={() => {
							setActive(false);
							actionNewSheet();
						}}>
						New Sheet
					</a>
					<a
						href="#"
						class="dropdown-item"
						onClick={() => {
							setActive(false);
							actionSaveSheet();
						}}>
						Save Sheet
					</a>
					<hr class="dropdown-divider" />
					<a
						href="#"
						class="dropdown-item"
						onClick={() => {
							setActive(false);
							showOpenSheetModal();
						}}>
						Open Sheet
					</a>
					<hr class="dropdown-divider" />
					<a
						href="#"
						class="dropdown-item"
						onClick={() => {
							setActive(false);
							showImportSheetModal();
						}}>
						Import Sheet
					</a>
					<a
						href="#"
						class="dropdown-item"
						onClick={() => {
							setActive(false);
							showExportSheetModal();
						}}>
						Export Sheet
					</a>
				</div>
			</div>
		</div>
	);
};

const SaveButton: Component = () => {
	const cls = () => {
		return "button is-small " + (sheetDirty() ? "is-warning" : "is-disabled");
	};
	const handleClick = () => {
		actionSaveSheet();
	};

	return (
		<button class={cls()} onClick={handleClick} title="Save Sheet">
			<span class="icon">
				<TbOutlineDeviceFloppy />
			</span>
		</button>
	);
};

const Toolbar: Component = () => {
	onMount(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Check focus is not on an input, textarea, or contenteditable element
			const target = e.target as HTMLElement;
			if (
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.tagName === "SELECT" ||
				target.isContentEditable
			) {
				return;
			}

			if (e.ctrlKey || e.metaKey) {
				switch (e.key) {
					case "z":
						e.preventDefault();
						if (e.shiftKey) {
							runRedo();
						} else {
							runUndo();
						}
						break;
					case "y":
						e.preventDefault();
						runRedo();
						break;
					case "s":
						e.preventDefault();
						actionSaveSheet();
						break;
					case "d":
						e.preventDefault();
						cloneSelectedCells();
						break;
					case "o":
						e.preventDefault();
						showOpenSheetModal();
						break;
				}
			} else {
				switch (e.key) {
					case "Enter":
						actionEditSelectedCells();
						break;
					case "Backspace":
					case "Delete":
						deleteSelectedCells();
						break;
				}
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		onCleanup(() => {
			window.removeEventListener("keydown", handleKeyDown);
		});
	});

	return (
		<div class="sheet-toolbar has-shadow m-1 p-2">
			<RunningIndicator />
			<button
				class="button is-small"
				onClick={() => runner.recompile()}
				title="Re-compile">
				<span class="icon">
					<TbOutlineRefresh />
				</span>
			</button>

			<span class="mx-1" />

			<FileDropdown />
			<SaveButton />

			<span class="mx-1" />

			<button
				class="button is-small"
				onClick={() => addEmptyCell()}
				title="Add Empty Cell">
				<span class="icon">
					<TbOutlinePlus />
				</span>
			</button>

			<span class="mx-1" />

			<button
				class={"button is-small " + (!canUndo() ? "is-disabled" : "")}
				onClick={() => runUndo()}
				disabled={!canUndo()}
				title="Undo (Ctrl+Z)">
				<span class="icon">
					<TbOutlineArrowBackUp />
				</span>
			</button>

			<button
				class={"button is-small " + (!canRedo() ? "is-disabled" : "")}
				onClick={() => runRedo()}
				disabled={!canRedo()}
				title="Redo (Ctrl+Y)">
				<span class="icon">
					<TbOutlineArrowForwardUp />
				</span>
			</button>
		</div>
	);
};

export default Toolbar;
