---
title: Nested Environments and Markdown
math_enhance: true
---

This synthetic example tests nested environments, lists, footnotes, and literal code.

{% definition begin Mean of a finite sequence %}
Given $x_1,\dots,x_n$, define $\bar x=\frac1n\sum_{j=1}^n x_j$.
{% definition end %}

{% theorem begin Squared deviation identity %}
For any constant $c$,

\[
\sum_{j=1}^{n}(x_j-c)^2=\sum_{j=1}^{n}(x_j-\bar x)^2+n(\bar x-c)^2.
\]

{% proof begin %}
Write $x_j-c$ as $(x_j-\bar x)+(\bar x-c)$.

{% lemma begin Vanishing cross term %}
Since $\sum_{j=1}^n(x_j-\bar x)=0$, the cross term in the expansion vanishes.
{% lemma end %}

Substituting this into the expansion proves the identity.[^identity]
{% proof end %}
{% theorem end %}

[^identity]: The identity can also be verified by expanding each term directly.

1. The inline symbol $x_j$ should align with the list text.
2. {% color yellow begin %}The mean minimizes the sum of squared deviations.{% color end %}

> {% remark begin Boundary case %}
> When $n=1$, $\bar x=x_1$.
> {% remark end %}

The following is literal code and must not be parsed as an environment or bibliography:

```text
{% theorem begin Literal text %}
$this is code$
{% theorem end %}
{% bibtex file missing.bib %}
```
