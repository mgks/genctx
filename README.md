# genctx (Generate Context)

<p align="left">
  <a href="https://www.npmjs.com/package/genctx"><img src="https://img.shields.io/npm/v/genctx.svg?style=flat-square&color=007acc" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/genctx"><img src="https://img.shields.io/npm/dt/genctx.svg?style=flat-square&color=success" alt="npm downloads"></a>
  <a href="https://github.com/mgks/genctx/blob/main/LICENSE"><img src="https://img.shields.io/github/license/mgks/genctx.svg?style=flat-square&color=blue" alt="license"></a>
  <a href="https://github.com/mgks/genctx/stargazers"><img src="https://img.shields.io/github/stars/mgks/genctx?style=flat-square&logo=github" alt="stars"></a>
</p>

**The AI Context Generator for Modern Developers.**

`genctx` consolidates your entire codebase into a single, high-signal Markdown file optimized for Large Language Models (LLMs). It intelligently formats your project structure and source code, stripping noise to ensure AI models (like ChatGPT, Claude, Gemini) get the most relevant context with the fewest tokens.

## 🌟 Why genctx?

- **Token Efficiency**: Save money and context window space. `genctx` can automatically strip comments and empty lines.
- **Project Structure**: Provides a clear directory tree so the AI understands file relationships.
- **Smart Filtering**: Respects `.gitignore` and automatically excludes build artifacts (`node_modules`, `dist`, etc.).
- **Zero Config Start**: Just run it. It works out of the box for most projects.
- **Detailed Control**: Fully configurable via `genctx.config.json` for advanced users.

## 🚀 Quick Start

Run instantly in any project folder using `npx`:

```bash
npx genctx
```

This generates **`genctx.context.md`** in your current directory. Drag and drop this file into your AI chat window.

### Installing Globally (Optional)

If you use it frequently, install it globally:

```bash
npm install -g genctx
genctx
```

## 🛠️ Usage & Examples

### Basic Run
Generate context for the current directory, respecting `.gitignore` and default excludes.
```bash
npx genctx
```

### Process a Single File
Generate context for just one file (useful for targeted debugging).
```bash
npx genctx --include src/main.js
```

### Optimize for Tokens
Strip all comments and empty lines to fit a large codebase into a small context window.
```bash
npx genctx --remove-comments --remove-empty-lines
```

### Focus on Specific Folders
Only include the `src` and `config` directories.
```bash
npx genctx --include src config
```

### Use a Tech Stack Preset
Apply standard exclude patterns for a specific language ecosystem (e.g., ignoring `.env`, `coverage`, `__pycache__`).
```bash
npx genctx --preset nodejs
npx genctx --preset python
```

### Programmatic API (Node.js)
You can use `genctx` inside your own build scripts or tools.

```javascript
const { generate } = require('genctx');

await generate({
  include: ['src/**/*.ts'],
  exclude: ['**/*.test.ts'],
  outputFile: 'docs/context.md',
  options: {
    removeComments: true,
    removeEmptyLines: true
  }
});
```

> **Need to clean raw code strings?**  
> `genctx` is designed for files and directories. If you need to strip comments from raw strings or code blocks, check out **[clean-context](https://www.npmjs.com/package/clean-context)**.

### Directory Tree Modes

By default, `genctx` generates a **"Context-Only"** tree. This means the directory structure in the output file only lists the files that the AI can actually read. Binary files (images), large files, or token-limited files are hidden to save tokens.

**Want the full picture?**
Use the `--tree-full` flag to include *all* discovered files in the tree (including images and large datasets), even if their content is skipped. This gives the AI better architectural context of your project's assets and data structure.

```bash
# Default: Only shows text files included in context
npx genctx 

# Full Mode: Shows everything (images, binaries, large files)
npx genctx --tree-full
```

> **Note**: This does **not** show files you explicitly excluded (like `node_modules`). Excluded files are always hidden.

## ⚙️ Configuration

While CLI flags are great for quick runs, you can persist your settings in a configuration file.

Initialize a config file:
```bash
npx genctx --init
```

This creates **`genctx.config.json`**:

```json
{
  "include": ["**/*"],
  "exclude": [
    "node_modules", ".git", ".env", "dist"
  ],
  "outputFile": "genctx.context.md",
  "options": {
    "removeComments": false,
    "removeEmptyLines": false,
    "treeFull": false,
    "maxFileSizeKB": 2048,
    "useGitignore": true
  }
}
```

### ⚠️ Important: How Excludes Work
`genctx` uses **strict glob patterns**, which behave differently than `.gitignore`.

*   **To exclude a file in the root only**:
    *   `"config.json"` (Matches `./config.json` only)
*   **To exclude a file anywhere (Recursive)**:
    *   `"**/config.json"` (Matches `src/config.json`, `config/config.json`, etc.)

If you find a file isn't being excluded, make sure you are using the recursive `**/` pattern.

### CLI Options

| Option | Alias | Description |
| :--- | :--- | :--- |
| `--version` | `-v` | Show current version. |
| `--help` | `-h` | Show usage information. |
| `--output` | `-o` | Output filename. |
| `--tree-full` | | Show full directory structure (including skipped binaries). |
| `--include` | `-i` | Add include glob patterns. |
| `--add-exclude` | `-a` | Add exclude glob patterns. |
| `--remove-comments` | | Strip code comments to save tokens. |
| `--remove-empty-lines` | | Remove empty vertical whitespace. |

### 🛡️ Smart Binary Detection
`genctx` doesn't just rely on file extensions. It performs **content inspection** (reading the first 512 bytes) to detect binary files. This prevents accidental inclusion of compiled binaries, obscure media formats, or corrupted files that could break your LLM context window.

### 💡 Advanced: Whitelist Strategy

The `include` option works as a strict **whitelist**. This allows you to cherry-pick specific files even if they might otherwise be ignored by a broad rule (as long as they are not explicitly in `exclude`).

**Scenario**: You want to verify a single binary file but ignore the rest of the `bin/` folder.

```json
{
  "include": [
    "src/**/*",
    "bin/genctx"
  ],
  "exclude": ["node_modules"]
}
```

### 🔒 Privacy by Default
`genctx` automatically excludes sensitive and high-noise files to ensure your context is clean and secure.

- **Security**: `*.pem`, `*.key`, `*.cert`, `*.pfx`, `id_rsa` are **hard-excluded**.
- **Binaries**: Images, Videos, Archives, PDFs, and Executables are ignored.
- **System**: `.DS_Store`, `.git`, Logs, and Lockfiles are skipped.
- **Overrides**: You can force-include any of these by explicitly adding them to `include` (e.g., `include: ["src/logo.png"]`).

## 📦 Presets

Presets apply additive exclusion rules and default extensions for specific technologies.

| Preset | Adds Exclusions | Adds Extensions |
|---|---|---|
| `nodejs` | `coverage`, `.env`, `npm-debug.log` | `.mjs`, `.cjs` |
| `python` | `__pycache__`, `.venv`, `venv`, `*.pyc`, `requirements.txt` | `.py` |
| `java` | `target`, `.mvn`, `*.jar`, `*.war` | `.java`, `.xml` |
| `android` | `gradle`, `*.apk`, `*.aab` | `.kt`, `.kts`, `.gradle` |
| `go` | `*.exe`, `*.bin`, `go.sum` | `.go` |
| `rust` | `target`, `Cargo.lock` | `.rs` |
| `dotnet` | `bin`, `obj`, `*.sln` | `.cs` |
| ...and more | Includes `swift`, `ruby`, `php`, `c_cpp`, `r` | |

Use multiple presets if your project is full-stack:
```bash
npx genctx --preset nodejs --preset python
```

## 🤝 Contributing

We welcome contributions! Whether it's adding a new preset, fixing a bug, or improving documentation.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

> **{ github.com/mgks }**
> 
> ![Website Badge](https://img.shields.io/badge/Visit-mgks.dev-blue?style=flat&link=https%3A%2F%2Fmgks.dev) ![Sponsor Badge](https://img.shields.io/badge/%20%20Become%20a%20Sponsor%20%20-red?style=flat&logo=github&link=https%3A%2F%2Fgithub.com%2Fsponsors%2Fmgks)