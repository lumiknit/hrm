import toast from "solid-toast";

let currentUndoToastID: string | null = null;

export const showUndoToast = (message: string, onUndo: () => void) => {
	if (currentUndoToastID) {
		toast.dismiss(currentUndoToastID);
	}
	currentUndoToastID = toast.custom(
		t => (
			<div
				class={`${t.visible ? "animate-enter" : "animate-leave"} toast-undo`}>
				<button
					class="button is-small is-ghost"
					onClick={() => toast.dismiss(t.id)}>
					&times;
				</button>
				<span>{message}</span>
				<button
					class="button is-small "
					onClick={() => {
						toast.dismiss(t.id);
						onUndo();
					}}>
					Undo
				</button>
			</div>
		),
		{
			duration: 6000,
			unmountDelay: 0,
		},
	);
};
