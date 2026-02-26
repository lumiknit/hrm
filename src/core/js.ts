import { parse } from "acorn";
import { simple } from "acorn-walk";
import { generate } from "astring";

// Javascript Identifier regex for cell ID
const jsIdRegex = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * Return true if the string is a valid JavaScript identifier.
 */
export const validJSIdentifier = (s: string) => {
	return jsIdRegex.test(s);
};

/**
 * Compile the given javascript code for reactive cells.
 * - Wrap injected identifiers with '$.' and '()' to make them function call.
 * - If the last statement is a non-return expression, wrap it with 'return' to return the value.
 */
export const compileCode = (code: string, names: Set<string>) => {
	const ast = parse(code, {
		ecmaVersion: "latest",
		sourceType: "script",
		allowReturnOutsideFunction: true,
	});
	console.log(ast);

	// Swap identifiers with dollar prefix + function call
	simple(ast, {
		Identifier(node) {
			if (!names.has(node.name)) return;
			node.name = `$.${node.name}()`;
		},
	});

	// If the last statement is non-return expression, wrap it with return
	if (ast.type === "Program" && ast.body.length > 0) {
		const last = ast.body[ast.body.length - 1];
		if (last.type === "ExpressionStatement") {
			ast.body[ast.body.length - 1] = {
				type: "ReturnStatement",
				argument: last.expression,
			} as any;
		}
	}

	return generate(ast);
};
