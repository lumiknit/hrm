import { Match, Switch, type Component } from "solid-js";
import { getCell } from "./state";
import SCView from "./SCView";
import SCEdit from "./SCEdit";

type SheetCellProps = {
	uid: string;
};

const SheetCell: Component<SheetCellProps> = props => {
	const cell = getCell(props.uid);
	if (!cell) {
		return <div class="sheet-cell">Cell not found: {props.uid}</div>;
	}

	return (
		<div class="sheet-cell">
			<Switch>
				<Match when={!cell.editing()}>
					<SCView
						uid={props.uid}
						cell={cell}
						onEditStart={() => {
							cell.setEditing(true);
						}}
					/>
				</Match>
				<Match when={cell.editing()}>
					<SCEdit cell={cell} onEditEnd={() => cell.setEditing(false)} />
				</Match>
			</Switch>
		</div>
	);
};

export default SheetCell;
