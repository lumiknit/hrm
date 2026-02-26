/* @refresh reload */
import type { Component } from "solid-js";
import { render } from "solid-js/web";
import { HashRouter, Route, type RouteSectionProps } from "@solidjs/router";
import { Toaster } from "solid-toast";

import "./index.scss";

import MainView from "./v-main/View";
import Nav from "./components/Nav";
import AboutView from "./v-other/AboutView";

const root = document.getElementById("root");

const Layout: Component<RouteSectionProps> = props => {
	return (
		<>
			<Toaster />
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
