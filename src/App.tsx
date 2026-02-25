import { createSignal, type Component } from "solid-js";
import { Toaster } from "solid-toast";
import MainView from "./v-main/View";

const App: Component = () => {
	return (
		<>
			<Toaster />
			<MainView />
		</>
	);
};

export default App;
