import { createSignal, For, onMount, type Component } from "solid-js";
import { openModal, type ModalProps } from "../modal/ModalStack";
import { SheetDB, type SheetSummary } from "../core/cell-idb";
import { TbFillTrash } from "solid-icons/tb";
import { actionDeleteSheet, actionOpenSheet } from "./state-action";

const ModalOpenSheet: Component<ModalProps> = props => {
	const [modalList, setModalList] = createSignal<SheetSummary[]>([]);
	const [searchQuery, setSearchQuery] = createSignal("");

	const loadList = async () => {
		const db = new SheetDB();
		const sheets = await db.list();
		setModalList(sheets);
	};

	onMount(loadList);

	const handleOpenSheet = async (id: string) => {
		try {
			await actionOpenSheet(id);
		} catch (e) {
			console.error(e);
		}
		props.onClose();
	};

	const handleDeleteSheet = async (id: string) => {
		actionDeleteSheet(id);
		loadList();
	};

	const filteredList = () => {
		const q = searchQuery().toLowerCase();
		if (!q) return modalList();
		return modalList().filter(
			s =>
				s.title.toLowerCase().includes(q) ||
				s.description.toLowerCase().includes(q),
		);
	};

	return (
		<div class="modal-card">
			<header class="modal-card-head">
				<p class="modal-card-title">Open Sheet</p>
				<button
					class="delete"
					aria-label="close"
					onClick={props.onClose}></button>
			</header>
			<section class="modal-card-body">
				<div class="field mb-4">
					<p class="control">
						<input
							class="input"
							type="text"
							placeholder="Search by title or description..."
							value={searchQuery()}
							onInput={e => setSearchQuery(e.currentTarget.value)}
						/>
					</p>
					<p class="help">
						Showing {filteredList().length} of {modalList().length} sheets.
					</p>
				</div>
				<For each={filteredList()}>
					{sum => (
						<div class="box p-3 mb-3">
							<div class="columns is-mobile is-vcentered">
								<div
									class="column is-clickable"
									onClick={() => handleOpenSheet(sum.id)}>
									<div class="is-flex is-justify-content-between is-align-items-center">
										<p class="title is-5 mb-1">
											{sum.title.trim() || "(untitled)"}
										</p>
									</div>
									<p class="subtitle is-7 mb-2">
										{sum.description || "(no description)"}
									</p>
									<p class="is-size-7 has-text-grey">
										Last updated: {sum.updatedAt.toLocaleString()}
									</p>
								</div>
								<div class="column is-narrow">
									<button
										class="button is-small is-danger is-outlined"
										onClick={() => {
											handleDeleteSheet(sum.id);
										}}>
										<span class="icon">
											<TbFillTrash />
										</span>
										<span>Delete</span>
									</button>
								</div>
							</div>
						</div>
					)}
				</For>
			</section>
		</div>
	);
};

export const showOpenSheetModal = () => {
	return openModal(ModalOpenSheet);
};
