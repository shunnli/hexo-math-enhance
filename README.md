# Hexo Math Enhance

Add **math, theorem environments, and references** to Hexo. MathJax 4 renders formulas to SVG at build time, with equation numbering, cross-references, and centered navigation.

[Syntax guide](SYNTAX.md) · [Complete example](examples/quickstart/quickstart.md)

## 📦 Installation

Requires Node.js ≥ 22.13, Hexo ≥ 7, and Git. Run in your blog directory:

```sh
npm install github:shunnli/hexo-math-enhance
```

For npm 12+, allow direct Git dependencies in your blog's `.npmrc`:

```ini
allow-git=root
```

For a **private repository**, configure an SSH key with repository access and install via SSH:

```sh
npm install git+ssh://git@github.com/shunnli/hexo-math-enhance.git
```

CI builds also need repository access, such as a read-only deploy key.

Hexo loads the plugin automatically. Keep your existing Markdown renderer for articles with math enhancement disabled.

## ⚙️ Configuration

Add settings to your blog's `_config.yml`. All defaults are shown below:

```yaml
math_enhance:
  enable: false               # Site-wide default
  references:
    title: References         # Bibliography heading
    backlinks: false          # Links back to citations
    links:
      doi: true               # DOI links
      url: true               # Article / PDF links
      google_scholar: true    # Google Scholar searches
```

Article front matter **overrides the site-wide default**. Use `true` or `false`, or omit the field to inherit the default:

```yaml
---
title: A Mathematical Article
math_enhance: true
---
```

Use booleans without quotes.

## ✍️ Writing

### Mathematics

Use `$...$` or `\(...\)` for inline math; `$$...$$`, `\[...\]`, or bare AMS environments for display math:

```markdown
Inline math $E=mc^2$, with a reference to \(\eqref{eq:energy}\).

\begin{align}
E &= mc^2 \label{eq:energy} \\
p &= mv \notag
\end{align}
```

Forward references, `\tag`, and document-local macros are supported. Equation numbering resets per article; long formulas scroll horizontally.

### Theorems and proofs

```markdown
{% theorem begin Nonnegative squares %}
Every real number $x$ satisfies $x^2\geq 0$.

{% proof begin %}
If $x<0$, then $x^2=(-x)^2\geq 0$; the remaining case is immediate.
{% proof end %}
{% theorem end %}
```

Environments can nest. Put markers on separate lines; theorems are not numbered automatically. See the [syntax guide](SYNTAX.md#2-theorems-proofs-and-other-statements) for `lemma`, `definition`, `remark`, and other environments.

### References

Cite entries with `[@sample2026]` and place bibliography data anywhere in the body.

**Embed BibTeX / BibLaTeX:**

```text
{% bibtex begin %}
@book{sample2026,
  author = {Doe, Jane},
  title = {Sample Mathematical Notes},
  date = {2026},
  publisher = {Example Press}
}
{% bibtex end %}
```

**Or load a file:**

```text
{% bibtex file assets/references.bib %}
```

Paths are relative to the article file; quote paths containing spaces. Both forms can be combined, with no `bibliography` front matter field. Cited entries appear at the end, numbered by first citation, with DOI, article, and Google Scholar links enabled by default.

## 💡 Tips

- **Refresh previews:** after changing the plugin, configuration, or external `.bib` files, stop the server, run `npx hexo clean`, then restart with `npx hexo server --draft`.
- **Themes:** tested with Hexo 8 + Butterfly 5. Client-side MathJax is unnecessary; if formulas look wrong, check that `css/math-enhance.css` loads.
- **Excerpts:** a standalone, top-level `<!-- more -->` is supported. Plain-text theme excerpts strip SVG formulas.
- **Code and HTML:** code blocks use Hexo's highlighter and theme. Enhanced articles do not execute other Hexo tag plugins and support only restricted HTML.
- **Scope:** this is a math and web citation renderer, not a full LaTeX / Biber compiler. See [SYNTAX.md](SYNTAX.md) for details.

## 🛠️ Development

```sh
npm ci
npm test
npx playwright install chromium
npm run test:browser
npm pack --dry-run
```

Set `BROWSER_EXECUTABLE` to use an existing Edge / Chromium installation. Browser tests check inline layout, equation navigation, and narrow-screen overflow, then close their temporary server.

| Path | Purpose |
| --- | --- |
| `index.js`, `lib/` | Hexo entry point, configuration, and lifecycle hooks |
| `core/` | Markdown, math, theorem, and bibliography parsing |
| `styles.css`, `assets/` | Styles and browser navigation script |
| `test/`, `examples/` | Regression tests and synthetic examples |

Commit lockfile updates when changing dependencies. The package includes runtime files, documentation, and the quickstart example.
