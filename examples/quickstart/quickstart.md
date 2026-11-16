---
title: Math Enhancement Quickstart
math_enhance: true
---

This example demonstrates equation numbering, theorem environments, and both bibliography formats. A plain-text introduction gives themes a readable homepage excerpt.

<!-- more -->

## Mathematics

Inline math can use $e^{i\pi}+1=0$ or \(a^2+b^2=c^2\). Forward references also work: \(\eqref{eq:energy}\).

\begin{align}
E &= mc^2 \label{eq:energy} \\
p &= mv \notag
\end{align}

\[
\int_0^1 x^2\,\mathrm{d}x=\frac13.
\]

## Theorems and proofs

{% theorem begin Nonnegative squares %}
Every real number $x$ satisfies $x^2\geq 0$.

{% proof begin %}
If $x<0$, then $x^2=(-x)^2\geq 0$; the remaining case is immediate.
{% proof end %}
{% theorem end %}

## References

Cite an entry from an external file [@external2026] or one embedded in the body [@inline2025, pp. 12–14]. Both entries are fictional test data.

{% bibtex file assets/references.bib %}

{% bibtex begin %}
@book{inline2025,
  author = {Doe, Jane},
  title = {An Embedded Example},
  year = {2025},
  publisher = {Example Press}
}
{% bibtex end %}

## Literal code

```text
{% bibtex file this-file-is-not-opened.bib %}
\begin{equation}
E=mc^2
\end{equation}
```
