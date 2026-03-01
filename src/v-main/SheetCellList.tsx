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
import {
	addEmptyCell,
	cellDragging,
	cells,
	cloneSelectedCells,
	deleteSelectedCells,
	getCell,
	reorderCell,
	selectedCells,
	setCellDragging,
	setSelectedCells,
} from "./state";
import SheetCell from "./SheetCell";
import { TbOutlineCopy, TbOutlinePlus, TbOutlineTrash } from "solid-icons/tb";

const DRAG_HOLD_DELAY = 500; // ms
const DRAG_MOVE_THRESHOLD = 5; // px

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

	const isSelected = () => selectedCells().has(props.uid);

	let timer: number | undefined;
	let startX = 0;
	let startY = 0;
	let isHolding = false;

	const clearTimer = () => {
		if (timer !== undefined) {
			clearTimeout(timer);
			timer = undefined;
		}
	};

	const onPointerDown = (e: PointerEvent) => {
		// Only capture on default mouse clicks (button 0) or touches
		if (e.button !== 0 && e.pointerType === "mouse") return;

		startX = e.clientX;
		startY = e.clientY;
		isHolding = false;

		clearTimer();
		timer = window.setTimeout(() => {
			isHolding = true;
			// Hold action: add to selection
			setSelectedCells(prev => {
				const next = new Set(prev);
				next.add(props.uid);
				return next;
			});
		}, DRAG_HOLD_DELAY); // 500ms threshold for holding
	};

	const onPointerMove = (e: PointerEvent) => {
		if (timer === undefined) return;
		const dx = e.clientX - startX;
		const dy = e.clientY - startY;
		if (dx * dx + dy * dy > DRAG_MOVE_THRESHOLD * DRAG_MOVE_THRESHOLD) {
			// 5px threshold
			clearTimer();
		}
	};

	const onPointerUp = (e: PointerEvent) => {
		if (timer !== undefined) {
			// Timer hasn't fired yet -> quick tap
			clearTimer();
			if (!isHolding) {
				if (e.ctrlKey || e.metaKey) {
					// Shift + click: add to selection
					setSelectedCells(prev => {
						const next = new Set(prev);
						if (next.has(props.uid)) {
							next.delete(props.uid);
						} else {
							next.add(props.uid);
						}
						return next;
					});
				} else {
					setSelectedCells(new Set([props.uid]));
				}
				e.preventDefault();
			}
		}
	};

	const onPointerCancel = () => {
		clearTimer();
	};

	return (
		<div class="sc-drag-outer">
			<div
				ref={sortable.ref}
				id={`cell-container-${props.uid}`}
				class={`sc-drag-container ${isSelected() ? "sc-selected" : ""}`}
				style={{
					...transformStyle(sortable.transform),
					"z-index": sortable.isActiveDraggable ? 999 : "auto",
				}}
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
				onPointerCancel={onPointerCancel}>
				<div
					class={"sc-drag-handle" + handleColorClass()}
					{...sortable.dragActivators}>
					⠿
				</div>
				<div class="sc-drag-content">
					<SheetCell uid={props.uid} />
				</div>
			</div>
			<Show when={!cellDragging() && isSelected()}>
				<div class="sc-cell-overlay is-flex is-justify-content-center is-gap-1">
					<button
						class="button is-small is-rounded"
						onClick={() => {
							const idx = cells().indexOf(props.uid);
							addEmptyCell(idx + 1);
						}}
						title="Add Below">
						<span class="icon is-small">
							<TbOutlinePlus />
						</span>
					</button>
					<button
						class="button is-small is-rounded"
						onClick={() => cloneSelectedCells()}
						title="Clone Selected">
						<span class="icon is-small">
							<TbOutlineCopy />
						</span>
					</button>
					<button
						class="button is-small is-rounded is-danger"
						onClick={() => deleteSelectedCells()}
						title="Delete Selected">
						<span class="icon is-small">
							<TbOutlineTrash />
						</span>
					</button>
				</div>
			</Show>
		</div>
	);
};

const SheetCellList: Component<SheetCellListProps> = () => {
	const handleDragStart = () => {
		setCellDragging(true);
	};

	const handleDragEnd = (event: DragEvent) => {
		setCellDragging(false);
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
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}>
				<DragDropSensors />
				<SortableProvider ids={cells()}>
					<div class="sheet-cell-list">
						<For each={cells()}>
							{uid => (
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
				</div>
			</Show>

			<div class="has-text-centered mt-4">
				<button class="button" onClick={() => addEmptyCell()}>
					Add Cell
				</button>
			</div>

			<div style={{ height: "30dvh" }} />
		</>
	);
};

export default SheetCellList;
