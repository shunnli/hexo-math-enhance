---
title: Matrices and Numbered Equations
math_enhance: true
---

This synthetic example tests formula layout. Check the spacing around the inline expression $A_{11}\in\mathbb R^{m\times m}$ and the forward reference \(\eqref{eq:energy}\).

<!-- more -->

## Block matrices

\[
A=\begin{pmatrix}B&C\\D&E\end{pmatrix},\qquad
x=\begin{pmatrix}u\\v\end{pmatrix}.
\]

The product has two rows; the second can be referenced independently as \(\eqref{eq:second-row}\):

\begin{align}
(Ax)_1 &= Bu+Cv \label{eq:first-row} \\
(Ax)_2 &= Du+Ev \label{eq:second-row}
\end{align}

## Energy identity

{% theorem begin Quadratic form of a symmetric matrix %}
Let $A=A^T$. For any $x$ and $y$,

\begin{equation}
(x+y)^TA(x+y)=x^TAx+2x^TAy+y^TAy.\label{eq:energy}
\end{equation}

{% proof begin %}
Expand the product and use $y^TAx=x^TAy$.
{% proof end %}
{% theorem end %}

The next equation uses a custom tag to test navigation to \(\eqref{eq:custom}\).

\begin{equation}
\|x\|_2^2=\sum_{j=1}^{n}x_j^2.\tag{N}\label{eq:custom}
\end{equation}

Long formulas should scroll horizontally within their own container:

\[
\begin{pmatrix}
a_{11}&a_{12}&a_{13}&a_{14}&a_{15}&a_{16}&a_{17}&a_{18}&a_{19}&a_{1,10}\\
a_{21}&a_{22}&a_{23}&a_{24}&a_{25}&a_{26}&a_{27}&a_{28}&a_{29}&a_{2,10}
\end{pmatrix}
\begin{pmatrix}x_1\\x_2\\x_3\\x_4\\x_5\\x_6\\x_7\\x_8\\x_9\\x_{10}\end{pmatrix}
=\begin{pmatrix}\sum_{j=1}^{10}a_{1j}x_j\\\sum_{j=1}^{10}a_{2j}x_j\end{pmatrix}.
\]
