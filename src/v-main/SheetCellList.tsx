import {
	DragDropProvider,
	DragDropSensors,
	SortableProvider,
	closestCenter,
	createSortable,
	transformStyle,
	type DragEvent,
} from "@thisbeyond/solid-dnd";
import { For, Show, type Component } from "solid-js";
import { addEmptyCell, cells, getCell, reorderCell } from "./state";
import SheetCell from "./SheetCell";

type SheetCellListProps = {};

type SortableCellProps = {
	uid: string;
	onDelete: () => void;
};

const SortableCellHolder: Component<SortableCellProps> = props => {
	const sortable = createSortable(props.uid);

	const handleColorClass = () => {
		const c = getCell(props.uid)?.getData().meta.color;
		if (!c || c === "none") {
			return "";
		}
		return ` has-background-${c} has-text-${c}-dark `;
	};

	return (
		<div
			ref={sortable.ref}
			class="sc-drag-container"
			style={{
				...transformStyle(sortable.transform),
				"z-index": sortable.isActiveDraggable ? 999 : "auto",
			}}>
			<div
				class={"sc-drag-handle" + handleColorClass()}
				{...sortable.dragActivators}>
				⠿
			</div>
			<div class="sc-drag-content">
				<SheetCell uid={props.uid} />
			</div>
		</div>
	);
};

const SheetCellList: Component<SheetCellListProps> = props => {
	const handleDragEnd = (event: DragEvent) => {
		if (event.draggable && event.droppable) {
			const i = cells();
			const fromIndex = i.indexOf(event.draggable.id as string);
			const toIndex = i.indexOf(event.droppable.id as string);
			if (fromIndex !== toIndex) {
				reorderCell(fromIndex, toIndex);
			}
		}
	};

	return (
		<>
			<DragDropProvider
				collisionDetector={closestCenter}
				onDragEnd={handleDragEnd}>
				<DragDropSensors />
				<SortableProvider ids={cells()}>
					<div class="sheet-cell-list">
						<For each={cells()}>
							{(uid, idx) => (
								<>
									<SortableCellHolder uid={uid} onDelete={() => {}} />
								</>
							)}
						</For>
					</div>
				</SortableProvider>
			</DragDropProvider>

			<Show when={cells().length === 0}>
				<div class="has-text-centered">
					<p>No cells.</p>

					<button class="button" onClick={() => addEmptyCell()}>
						Add Cell
					</button>
				</div>
			</Show>
		</>
	);
};

export default SheetCellList;
