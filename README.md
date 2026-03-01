# Hrm

Excel-like reactive JS notebook for developers!

https://lumiknit.github.io/apps/hrm

## Features

- **Standard JavaScript**: Write your logic using the JavaScript you already know.
- **Local-First**: Data is processed and stored entirely within your browser (IndexedDB). No external servers required.
- **Reactive Workflow**: Cells update automatically when their dependencies change.
- **Flexible Data Handling**: Specialized support for YAML, TOML, Markdown, and HTML.
- **Developer Tools**: Fast copy-to-clipboard and one-click file downloads for cell outputs.
- **Mobile Friendly**: Designed to work conveniently on both desktop and mobile browsers.

## Usage

### Cells

A **Cell** in Hrm is the fundamental unit of data and logic.

- **Reactive Variables**: Think of a cell as a reactive signal (like Solid.js `createSignal` or React `useState`). When a cell's value changes, any other cells that depend on it are automatically re-evaluated.
- **Global Scope**: Every cell has an ID (e.g., `data1`). You can reference this cell in other cells' code simply by using its name as if it were a global variable.

### Code Syntax

Hrm provides a seamless scripting experience:

- **Async Body**: Each cell's code is executed as the body of an `async` function. This means you can use `await` and `return` anywhere.
- **Implicit Return**: If the last statement in your cell is an expression (e.g., `$.a + $.b`), Hrm automatically returns it as the cell's final value.
- **Seamless Integration**: Use standard browser APIs and modern JavaScript features directly.

### Cell Type & Display

You can configure how data is interpreted and rendered:

- **Types**:
  - `Code`: Standard JavaScript execution.
  - `Raw`: Stores content as a plain string. You can specify a language (e.g., `python`, `sql`) for syntax highlighting.
  - `Backtick`: Executed as a JavaScript template string (wrapped in `` ` ``). Useful for dynamic text generation.
  - `Data`: Parses content as `YAML` or `TOML` into a JavaScript object.
- **Display Modes**:
  - `Default`: Displays the value as-is, using js `String(...)`.
  - `JSON / YAML / TOML`: Pretty-prints the cell's value in the chosen format.
  - `Markdown`: Renders text as sanitized Markdown.
  - `HTML`: Renders text as sanitized HTML.
  - `Input`: Show an editable input field bound to the cell's value.

To change these settings, click the **pencil icon** to edit a cell and expand **More Options**.

### Internal Structure (Reactivity)

Hrm manages dependencies through a custom effect loop:

1. **Dependency Detection**: When a cell is compiled, Hrm identifies references to other cell IDs.
2. **Signal Propagation**: Updates trigger a chain reaction through the dependency graph.
3. **Async Safety**: Reactivity is handled asynchronously to keep the UI responsive even during heavy calculations.

**WARNING** Hrm does not prevent circular dependencies for maximum flexibility,
but you may be able to pause execution to break the loop if needed.
Hrm's effect loop is designed not to spin too fast and it does not crash your browser,
but the CPU usage may spike.

### Examples

Suppose that `a: expr` represents a cell with ID `a` and code `expr`.

```js
a: 42;
b: a * 2;
```

In the above example, `b` will automatically update to `84`.

```js
start: "Hello";
encoded: base64.encode(start);
decoded: base64.decode(encoded);
```

In this example, `encoded` will contain the Base64 string of "Hello", and `decoded` will return it back to "Hello".

```js
a: a + 1;
```

WARNING: This will create an infinite loop as `a` depends on itself.

### Built-in Functions

Hrm provides several built-in utilities accessible within any cell:

- **Base64**:
  - `base64.encode(s)` / `base64.decode(s)`: Standard Base64.
  - `base64.encodeURLSafe(s)`: URL-safe Base64 without padding.
- **Data Parsing**:
  - `yaml.parse(s)` / `yaml.stringify(obj)`
  - `toml.parse(s)` / `toml.stringify(obj)`
- **Markdown**:
  - `marked(s)`: Renders Markdown to an HTML string.
- **Hashing & Crypto**:
  - `md5(s)`: Returns an MD5 hex string.
  - `sha1(s)`, `sha256(s)`, `sha384(s)`, `sha512(s)`: `async` functions returning hex strings (Web Crypto API).

### Other UI Description

- **Managing Sheets**: Use the Sidebar to Save, Load, or Reset your workspace.
- **Import/Export**: You can Import or Export your entire notebook as a `.json` file for backup or sharing.
- **Adding Cells**: Use the "Add Cell" button at the bottom of the list.
- **Drag & Drop**: Grab the handle on the left side of any cell to change its order.

## Build

Hrm is built with Vite and Solid.JS. It's recommended to use `bun` for development.

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build
```
