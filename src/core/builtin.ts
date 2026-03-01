// built.ts provided some global utilites for the HRM system.

import * as yaml from "yaml";
import * as smoltoml from "smol-toml";
import { marked, type MarkedOptions } from "marked";
import MD5 from "crypto-js/md5";

export const putBuiltins = (target: Record<string, any>) => {
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
};
