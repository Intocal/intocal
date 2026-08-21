# Vanilla HTML

One file, no build step, no framework. Open `index.html` in a browser.

The inline embed is a single `div`:

```html
<div data-intocal="jane/intro-30"></div>
<script src="https://intocal.com/embed.js" async></script>
```

Popups are wired in JavaScript — there is no `data-` attribute for them:

```js
IntoCal.popup({ host: "jane", event: "intro-30", trigger: "#book-btn" });
```

Styling hooks on the inline element: `data-theme="dark"`, `data-color="#00dca9"`,
`data-hide-header`.
