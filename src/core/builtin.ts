// built.ts provided some global utilites for the HRM system.

import * as yaml from "yaml";
import * as smoltoml from "smol-toml";
import { marked, type MarkedOptions } from "marked";
import MD5 from "crypto-js/md5";
import { v4 as uuidv4, v6 as uuidv6, v7 as uuidv7 } from "uuid";
import Papa from "papaparse";

export const putBuiltins = (target: Record<string, any>) => {
	// Async sleep for the given milliseconds
	target.sleep = (ms: number): Promise<void> => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

	// Range generator
	target.range = (start: number, end?: number, step: number = 1): number[] => {
		if (end === undefined) {
			end = start;
			start = 0;
		}
		const result: number[] = [];
		for (let i = start; i < end; i += step) {
			result.push(i);
		}
		return result;
	};

	target.zip = <T, U>(a: T[], b: U[]): [T, U][] => {
		const length = Math.min(a.length, b.length);
		const result: [T, U][] = [];
		for (let i = 0; i < length; i++) {
			result.push([a[i], b[i]]);
		}
		return result;
	};

	target.unzip = <T, U>(pairs: [T, U][]): [T[], U[]] => {
		const a: T[] = [];
		const b: U[] = [];
		for (const [x, y] of pairs) {
			a.push(x);
			b.push(y);
		}
		return [a, b];
	};

	target.sum = (...arr: number[]): number => {
		return arr.reduce((acc, val) => acc + val, 0);
	};

	target.product = (...arr: number[]): number => {
		return arr.reduce((acc, val) => acc * val, 1);
	};

	target.average = (...arr: number[]): number => {
		if (arr.length === 0) {
			return 0;
		}
		return target.sum(...arr) / arr.length;
	};

	target.randomInt = (min: number, max: number): number => {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};

	target.clamp = (value: number, min: number, max: number): number => {
		return Math.min(Math.max(value, min), max);
	};

	target.max = Math.max;
	target.min = Math.min;

	target.stdev = (...arr: number[]): number => {
		if (arr.length === 0) {
			return 0;
		}
		const mean = target.average(...arr);
		const variance = target.average(...arr.map(x => (x - mean) ** 2));
		return Math.sqrt(variance);
	};

	// Base64
	target.base64 = {
		encode: (s: string) => {
			return btoa(s);
		},
		encodeURLSafe: (s: string) => {
			return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
		},
		decode: (s: string) => {
			// Check url-safe format
			if (s.includes("-") || s.includes("_")) {
				s = s.replace(/-/g, "+").replace(/_/g, "/");
			}
			// Pad with '=' to make the length a multiple of 4
			while (s.length % 4) {
				s += "=";
			}
			return atob(s);
		},
	};

	// YAML
	target.yaml = {
		parse: yaml.parse,
		stringify: yaml.stringify,
	};

	// TOML
	target.toml = {
		parse: (s: string) => {
			return smoltoml.parse(s);
		},
		stringify: (obj: any) => {
			return smoltoml.stringify(obj);
		},
	};

	// CSV
	target.csv = {
		parse: (s: string) => {
			return Papa.parse(s, { header: true, dynamicTyping: true }).data;
		},
		stringify: (obj: any) => {
			return Papa.unparse(obj);
		},
	};

	// Markdown
	target.marked = (s: string, options?: MarkedOptions) => {
		if (!options) {
			options = {};
		}
		return marked(s, {
			...options,
			async: false,
		});
	};

	// Web Crypto Hash
	const hashHex = async (s: string, algorithm: string): Promise<string> => {
		const crypto = window.crypto || (window as any).msCrypto;
		if (!crypto || !crypto.subtle) {
			throw new Error("Web Crypto API is not supported in this environment.");
		}
		const encoder = new TextEncoder();
		const data = encoder.encode(s);
		const hashBuffer = await crypto.subtle.digest(algorithm, data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hashHex = hashArray
			.map(b => b.toString(16).padStart(2, "0"))
			.join("");
		return hashHex;
	};
	target.sha1 = async (s: string): Promise<string> => {
		return await hashHex(s, "SHA-1");
	};
	target.sha256 = async (s: string): Promise<string> => {
		return await hashHex(s, "SHA-256");
	};
	target.sha384 = async (s: string): Promise<string> => {
		return await hashHex(s, "SHA-384");
	};
	target.sha512 = async (s: string): Promise<string> => {
		return await hashHex(s, "SHA-512");
	};

	// CryptoJS
	target.md5 = (s: string): string => {
		return MD5(s).toString();
	};

	// UUID
	target.uuidv4 = uuidv4;
	target.uuidv6 = uuidv6;
	target.uuidv7 = uuidv7;
	target.uuid = uuidv4;
};
