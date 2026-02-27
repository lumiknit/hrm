// built.ts provided some global utilites for the HRM system.

import * as yaml from "yaml";
import * as smoltoml from "smol-toml";
import { marked, type MarkedOptions } from "marked";

export const putBuiltins = (target: Record<string, any>) => {
	target.yaml = {
		parse: yaml.parse,
		stringify: yaml.stringify,
	};
	target.toml = {
		parse: (s: string) => {
			return smoltoml.parse(s);
		},
		stringify: (obj: any) => {
			return smoltoml.stringify(obj);
		},
	};
	target.marked = (s: string, options?: MarkedOptions) => {
		if (!options) {
			options = {};
		}
		return marked(s, {
			...options,
			async: false,
		});
	};
};
