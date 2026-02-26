import { createSignal, type Component } from "solid-js";
import { TbOutlineInfoCircle } from "solid-icons/tb";

const Nav: Component = () => {
	const [active, setActive] = createSignal(false);
	return (
		<nav class="navbar" role="navigation" aria-label="main navigation">
			<div class="navbar-brand">
				<a class="navbar-item has-text-weight-extrabold" href="#/">
					Hrm
				</a>

				<a
					role="button"
					class="navbar-burger"
					aria-label="menu"
					aria-expanded={active() ? "true" : "false"}
					data-target="navbarBasicExample"
					onClick={() => setActive(s => !s)}>
					<span aria-hidden="true"></span>
					<span aria-hidden="true"></span>
					<span aria-hidden="true"></span>
					<span aria-hidden="true"></span>
				</a>
			</div>

			<div
				id="navbarBasicExample"
				class={`navbar-menu ${active() ? "is-active" : ""}`}>
				<div class="navbar-start">
					<a class="navbar-item">Home</a>
					<a class="navbar-item">Doc</a>
				</div>

				<div class="navbar-end">
					<a class="navbar-item" title="about" href="#/about">
						<TbOutlineInfoCircle />
					</a>
				</div>
			</div>
		</nav>
	);
};

export default Nav;
