import {
	TbFillFile,
	TbFillHelpCircle,
	TbFillSquare,
	TbOutlineCheckbox,
	TbOutlineFileDislike,
	TbOutlineHelpCircle,
	TbOutlinePlus,
	TbOutlineProgress,
	TbOutlineSelect,
} from "solid-icons/tb";
import { Switch, Match, type Component, createSignal } from "solid-js";
import { runner } from "./runner";
import { addEmptyCell } from "./state";

const RunningIndicator: Component = () => {
	const paused = () => runner.paused();
	const running = () => runner.running();

	const btnClass = () => {
		return "button is-small " + (paused() ? "is-warning" : "is-success");
	};

	const handleClick = () => {
		runner.setPaused(p => !p);
	};

	return (
		<button
			class={btnClass()}
			onClick={handleClick}
			title={paused() ? "Resume" : "Pause"}>
			<span class="icon">
				<Switch>
					<Match when={running()}>
						<TbOutlineProgress />
					</Match>
					<Match when>
						<TbFillSquare />
					</Match>
				</Switch>
			</span>
			<span>Running</span>
		</button>
	);
};

const FileDropdown: Component = () => {
	const [active, setActive] = createSignal(false);

	const toggleActive = () => setActive(a => !a);

	return (
		<div class={"dropdown" + (active() ? " is-active" : "")}>
			<div class="dropdown-trigger">
				<button
					class="button is-small"
					onClick={toggleActive}
					title="File Menu">
					<span class="icon">
						<TbFillFile />
					</span>
				</button>
			</div>
			<div class="dropdown-menu" id="dropdown-menu" role="menu">
				<div class="dropdown-content">
					<a href="#" class="dropdown-item">
						New Sheet
					</a>
					<a href="#" class="dropdown-item">
						Save Sheet
					</a>
					<hr class="dropdown-divider" />
					<a href="#" class="dropdown-item">
						Open Sheet
					</a>
					<hr class="dropdown-divider" />
					<a href="#" class="dropdown-item">
						Import Sheet
					</a>
					<a href="#" class="dropdown-item">
						Export Sheet
					</a>
				</div>
			</div>
		</div>
	);
};

const Toolbar: Component = () => {
	return (
		<div class="sheet-toolbar has-shadow p-2">
			<RunningIndicator />

			<span class="mx-1" />

			<FileDropdown />

			<span class="mx-1" />

			<button
				class="button is-small"
				onClick={() => addEmptyCell()}
				title="Add Empty Cell">
				<span class="icon">
					<TbOutlinePlus />
				</span>
			</button>

			<button class="button is-small" title="Cell Select Mode">
				<span class="icon">
					<TbOutlineCheckbox />
				</span>
			</button>

			<span class="mx-1" />

			<a class="button is-small" href="#/about">
				<span class="icon">
					<TbOutlineHelpCircle />
				</span>
			</a>
		</div>
	);
};

export default Toolbar;
