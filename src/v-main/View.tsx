import { For, Match, Switch, type Component } from "solid-js";
import SheetHead from "./SheetHead";
import SheetCellList from "./SheetCellList";

import "./style.scss";
import SheetToolbar from "./SheetToolbar";

const View: Component = () => {
	return (
		<main class="container">
			<SheetToolbar />
			<SheetHead class="my-2" />
			<hr />
			<SheetCellList />
		</main>
	);
};

export default View;
