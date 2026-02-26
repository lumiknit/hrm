import { TbFillBrandGithub } from "solid-icons/tb";
import type { Component } from "solid-js";

const AboutView: Component = () => {
	return (
		<main class="container">
			<div class="content">
				<h1>About Hrm</h1>
				<p>Version: {__APP_VERSION__}</p>
				<p>
					<b>Hrm</b> is a web-based, responsive programmable notebook
					application. It is a utility tool that combines the simplicity of
					Excel with the flexibility of JavaScript for more general-purpose
					tasks.
				</p>
				<p>
					For more detailed information, please refer to the document below.
				</p>

				<h2> Links </h2>
				<ul>
					<li>
						<a
							href="https://github.com/lumiknit/hrm#README.md"
							target="_blank"
							rel="noopener noreferrer">
							<TbFillBrandGithub />
							Github Readme
						</a>
					</li>
				</ul>
			</div>
		</main>
	);
};

export default AboutView;
