import {
	createSignal,
	type JSX,
	Match,
	Switch,
	type Component,
} from "solid-js";
import { sheetDesc, sheetTitle, setSheetDesc, setSheetTitle } from "./state";
import Marked from "../components/Marked";

type Props = JSX.HTMLAttributes<HTMLDivElement>;

const SheetHead: Component<Props> = props => {
	const [editingDesc, setEditingDesc] = createSignal(false);

	const handleDescChange = (e: Event) => {
		const target = e.currentTarget as HTMLTextAreaElement;
		setSheetDesc(target.value);
		setEditingDesc(false);
	};

	return (
		<div {...props}>
			<input
				class="input is-large my-2"
				placeholder="Title"
				value={sheetTitle()}
				onChange={e => setSheetTitle(e.currentTarget.value)}
			/>

			<Switch>
				<Match when={!editingDesc()}>
					<Marked class="content" content={sheetDesc()} />
					<button class="button is-small" onClick={() => setEditingDesc(true)}>
						Edit Description
					</button>
				</Match>
				<Match when>
					<textarea
						class="textarea my-2"
						placeholder="Description"
						value={sheetDesc()}
						onChange={handleDescChange}
					/>
				</Match>
			</Switch>
		</div>
	);
};

export default SheetHead;
