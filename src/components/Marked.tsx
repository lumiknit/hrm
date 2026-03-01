import { createMemo, splitProps, type JSX } from "solid-js";
import { marked } from "marked";
import DOMPurify from "dompurify";

interface MarkedProps extends JSX.HTMLAttributes<HTMLDivElement> {
	content: string;
}

const Marked = (props: MarkedProps) => {
	const [p, divProps] = splitProps(props, ["content"]);

	const html = createMemo(() => {
		const h = marked(p.content, { async: false });
		const purified = DOMPurify.sanitize(h);
		return purified;
	});

	return <div {...divProps} innerHTML={html()} />;
};

export default Marked;
