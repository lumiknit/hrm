import { createSignal, For, onMount, type Component } from "solid-js";
import { openModal, type ModalProps } from "../modal/ModalStack";
import { SheetDB, type SheetSummary } from "../core/cell-idb";
import { TbFillTrash } from "solid-icons/tb";
import { actionDeleteSheet, actionOpenSheet } from "./state-action";

const ModalOpenSheet: Component<ModalProps> = props => {
	const [modalList, setModalList] = createSignal<SheetSummary[]>([]);

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
				<For each={modalList()}>
					{sum => (
						<div class="box">
							<div onClick={() => handleOpenSheet(sum.id)}>
								<p>{sum.id}</p>
								<p class="title is-5">{sum.title.trim() || "(untitled)"}</p>
								<p class="subtitle is-6">
									{sum.description || "(no description)"}
								</p>
								<p>{sum.updatedAt.toString()}</p>
							</div>
							<button
								class="button is-small is-danger"
								onClick={() => {
									handleDeleteSheet(sum.id);
								}}>
								<span class="icon">
									<TbFillTrash />
								</span>
								<span>Delete</span>
							</button>
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
