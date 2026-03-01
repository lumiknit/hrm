/* @refresh reload */
import type { Component } from "solid-js";
import { render } from "solid-js/web";
import { HashRouter, Route, type RouteSectionProps } from "@solidjs/router";
import { Toaster } from "solid-toast";

import "./index.scss";

import MainView from "./v-main/View";
import Nav from "./components/Nav";
import AboutView from "./v-other/AboutView";
import { putBuiltins } from "./core/builtin";
import { ModalStack } from "./modal/ModalStack";

const root = document.getElementById("root");

putBuiltins(window);

const Layout: Component<RouteSectionProps> = props => {
	return (
		<>
			<Toaster />
			<ModalStack />
			<Nav />
			{props.children}
		</>
	);
};

render(
	() => (
		<HashRouter root={Layout}>
			<Route path="" component={MainView} />
			<Route path="about" component={AboutView} />
		</HashRouter>
	),
	root!,
);
