import { createSignal, For, type Component } from "solid-js";
import { uniqueID } from "../core/id";
import { Dynamic } from "solid-js/web";

export type ModalProps = {
	onClose: () => void;
};

type Modal = {
	id: string;
	component: Component<ModalProps>;
};

const [modals, setModals] = createSignal<Modal[]>([]);

export const openModal = (component: Component<ModalProps>): string => {
	const id = uniqueID();
	setModals(ms => [...ms, { id, component }]);
	return id;
};

export const closeModal = (id: string) => {
	setModals(m => m.filter(modal => modal.id !== id));
};

export const ModalStack: Component = () => {
	return (
		<For each={modals()}>
			{modal => (
				<div class="modal is-active">
					<div class="modal-background"></div>
					<div class="modal-content">
						<Dynamic
							component={modal.component}
							onClose={() => closeModal(modal.id)}
						/>
					</div>
					<button
						class="modal-close is-large"
						aria-label="close"
						onClick={() => closeModal(modal.id)}
					/>
				</div>
			)}
		</For>
	);
};
