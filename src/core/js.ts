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
		allowAwaitOutsideFunction: true,
	});
	console.log(ast);

	// Swap identifiers with dollar prefix + function call
	simple(ast, {
		Identifier(node) {
			if (!names.has(node.name)) return;
			node.name = `$.${node.name}($_)`;
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

	const generated = generate(ast);
	return generated;
};

/**
 * Rename identifiers based on the name map.
 */
export const renameIdentifiersCode = (
	code: string,
	nameMap: Map<string, string>,
) => {
	const ast = parse(code, {
		ecmaVersion: "latest",
		sourceType: "script",
		allowReturnOutsideFunction: true,
		allowAwaitOutsideFunction: true,
	});

	simple(ast, {
		Identifier(node) {
			if (nameMap.has(node.name)) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				node.name = nameMap.get(node.name)!;
			}
		},
	});

	return generate(ast);
};

/**
 * wrapBacktick takes a string which is the 'content' of a backtick string (js template string literal),
 * and returns a new string that is properly escaped and wrapped with backticks.
 * @param input
 * @returns
 */
export const wrapBacktick = (input: string): string => {
	// Context Constants
	const CTX_BASE = 0;
	const CTX_JS = 1;
	const CTX_STR_SINGLE = 2;
	const CTX_STR_DOUBLE = 3;
	const CTX_STR_BACKTICK = 4;
	type Context =
		| typeof CTX_BASE
		| typeof CTX_JS
		| typeof CTX_STR_SINGLE
		| typeof CTX_STR_DOUBLE
		| typeof CTX_STR_BACKTICK;

	let result = "";

	// Context stack
	const stack: Context[] = [CTX_BASE];
	let i = 0;

	while (i < input.length) {
		const char = input[i];
		const nextChar = input[i + 1];
		const currentContext = stack[stack.length - 1];

		// Handle escape
		if (char === "\\") {
			if (currentContext === CTX_BASE) {
				result += "\\\\";
			} else {
				result += char + (nextChar || "");
			}
			i += 2;
			continue;
		}

		// Handle for each context
		switch (currentContext) {
			case CTX_BASE:
				{
					// 가장 바깥쪽 문자열 문맥
					if (char === "`") {
						result += "\\`"; // 백틱 이스케이프
					} else if (char === "$" && nextChar === "{") {
						result += "${";
						stack.push(CTX_JS); // JS 문맥(보간법) 진입
						i++;
					} else {
						result += char;
					}
				}
				break;
			case CTX_JS:
				{
					// ${ } 내부의 JS 식 문맥
					if (char === "}") {
						stack.pop(); // 보간법 종료
						result += "}";
					} else if (char === "{") {
						stack.push(CTX_JS); // JS 내부의 객체 리터럴 등 중첩 중괄호 처리
						result += "{";
					} else if (char === "'") {
						stack.push(CTX_STR_SINGLE);
						result += "'";
					} else if (char === '"') {
						stack.push(CTX_STR_DOUBLE);
						result += '"';
					} else if (char === "`") {
						stack.push(CTX_STR_BACKTICK);
						result += "`";
					} else {
						result += char;
					}
				}
				break;
			case CTX_STR_SINGLE:
				if (char === "'") stack.pop();
				result += char;
				break;
			case CTX_STR_DOUBLE:
				if (char === '"') stack.pop();
				result += char;
				break;
			case CTX_STR_BACKTICK: {
				if (char === "`") {
					stack.pop();
					result += "`";
				} else if (char === "$" && nextChar === "{") {
					result += "${";
					stack.push(CTX_JS);
					i++;
				} else {
					result += char;
				}
			}
		}

		i++;
	}

	return `\`${result}\``;
};
