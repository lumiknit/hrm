import { For, Match, Switch, type Component } from "solid-js";
import SheetHead from "./SheetHead";
import SheetCellList from "./SheetCellList";

import "./style.scss";

const View: Component = () => {
	return (
		<main class="container">
			<SheetHead class="my-2" />
			<hr />
			<SheetCellList />
		</main>
	);
};

export default View;
