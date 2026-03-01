import { type Component, onCleanup, onMount } from "solid-js";
import SheetHead from "./SheetHead";
import SheetCellList from "./SheetCellList";

import "./style.scss";
import SheetToolbar from "./SheetToolbar";
import { checkSheetDirty } from "./state";

const View: Component = () => {
	const checkUnload = (e: BeforeUnloadEvent) => {
		if (checkSheetDirty()) {
			e.preventDefault();
			e.returnValue = "";
		}
	};

	onMount(() => {
		window.addEventListener("beforeunload", checkUnload);
	});

	onCleanup(() => {
		window.removeEventListener("beforeunload", checkUnload);
	});

	return (
		<main class="container p-1 ">
			<SheetToolbar />
			<SheetHead class="my-2" />
			<hr />
			<SheetCellList />
		</main>
	);
};

export default View;
