import { z } from "zod";
import { uniqueID } from "./id";

export const cellColorSchema = z.enum([
	"none",
	"primary",
	"danger",
	"warning",
	"success",
	"info",
]);
export type CellColor = z.infer<typeof cellColorSchema>;

/** JS Code Cell Type */
const cellTypeCodeSchema = z.object({
	type: z.literal("code"), // Type of the cell, currently only "code" is supported.
});
/** Raw string cell type */
const cellTypeRawSchema = z.object({
	type: z.literal("raw"),
	lang: z.string().optional(), // The programming language of the raw cell content.
});
/** JSON-like data format cell type */
const cellTypeDataSchema = z.object({
	type: z.literal("data"),
	lang: z.union([z.literal("json"), z.literal("yaml"), z.literal("toml")]),
});

export const cellTypeSchema = z.union([
	cellTypeCodeSchema,
	cellTypeRawSchema,
	cellTypeDataSchema,
]);
export type CellType = z.infer<typeof cellTypeSchema>;

export const cellMetaSchema = z.object({
	type: cellTypeSchema,
	help: z.string().optional(), // Help text or documentation for the cell. markdown.
	hide: z.boolean().optional(), // Whether to hide the cell from the UI.
	color: cellColorSchema.optional(), // Color for the cell, used for UI styling.
});
export type CellMeta = z.infer<typeof cellMetaSchema>;

/**
 * FrozenCell represents a cell in the save state of the notebook.
 */
export const frozenCellSchema = z.object({
	id: z.string(), // Identifier for the cell.
	formula: z.string(), // The formula or code contained in the cell.

	meta: cellMetaSchema, // Metadata for the cell.
});
/** */
export type FrozenCell = z.infer<typeof frozenCellSchema>;

export const defaultFrozenCell = (id?: string): FrozenCell => ({
	id: id ?? "_" + uniqueID(),
	formula: "",
	meta: {
		type: { type: "code" },
	},
});

export const sheetSchema = z.object({
	updatedAt: z.coerce.date(), // Timestamp of the last update to the sheet.
	title: z.string(),
	description: z.string(),
	cells: z.array(frozenCellSchema),
});
export type Sheet = z.infer<typeof sheetSchema>;
