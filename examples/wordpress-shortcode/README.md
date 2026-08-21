# WordPress shortcode

A single-file plugin exposing `[intocal]`.

## Install

Copy `intocal.php` to `wp-content/plugins/intocal/intocal.php` and activate it under
Plugins.

## Use

```
[intocal user="jane" event="intro-30"]
[intocal user="jane" event="intro-30" theme="dark" height="800"]
[intocal user="jane" event="intro-30" mode="popup" label="Book a call"]
```

| Attribute | Default | Notes |
|---|---|---|
| `user` | — | required, your IntoCal username |
| `event` | — | required, the event slug |
| `mode` | `inline` | `inline` or `popup` |
| `label` | `Book a meeting` | popup button text |
| `height` | `720` | inline minimum height in px |
| `theme` | — | `light` or `dark` |

Popup mode renders a button and calls `IntoCal.popup()`, because `embed.js` has no popup
data-attribute — a `[data-intocal]` button would mount an iframe *inside* the button.
