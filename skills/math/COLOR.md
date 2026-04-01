# Color Reference — `color` tool

## Operations

### Conversions

| Operation | Required Fields     | Optional Fields               | Returns                              |
| --------- | ------------------- | ----------------------------- | ------------------------------------ |
| `convert` | `color`, `to_space` | `from_space`, `gamut_mapping` | Color in target space + CSS string   |
| `parse`   | `color`             | `from_space`                  | Color in all 8 spaces simultaneously |

### Accessibility

| Operation            | Required Fields            | Optional Fields | Returns                                   |
| -------------------- | -------------------------- | --------------- | ----------------------------------------- |
| `contrast_ratio`     | `foreground`, `background` | —               | Ratio as `"N:1"` string                   |
| `wcag_level`         | `foreground`, `background` | `size`          | Level (`"AAA"`, `"AA"`, `"fail"`) + ratio |
| `relative_luminance` | `color`                    | `from_space`    | Luminance value 0-1                       |

### Manipulation

| Operation    | Required Fields   | Optional Fields       | Returns              |
| ------------ | ----------------- | --------------------- | -------------------- |
| `lighten`    | `color`, `amount` | `space`, `from_space` | Modified color + hex |
| `darken`     | `color`, `amount` | `space`, `from_space` | Modified color + hex |
| `saturate`   | `color`, `amount` | `space`, `from_space` | Modified color + hex |
| `desaturate` | `color`, `amount` | `space`, `from_space` | Modified color + hex |
| `mix`        | `color`, `color2` | `weight`              | Blended color + hex  |

### Palettes

| Operation    | Required Fields | Optional Fields                | Returns                   |
| ------------ | --------------- | ------------------------------ | ------------------------- |
| `complement` | `color`         | `from_space`                   | 1 color (180° rotation)   |
| `analogous`  | `color`         | `count`, `angle`, `from_space` | Array of colors           |
| `triadic`    | `color`         | `from_space`                   | 2 colors (120° intervals) |
| `tetradic`   | `color`         | `from_space`                   | 3 colors (90° intervals)  |

## Supported Color Spaces

| Space | Input format                                 | Component ranges                  |
| ----- | -------------------------------------------- | --------------------------------- |
| hex   | String: `"#FF6B35"`, `"#F63"`, `"#FF6B35CC"` | —                                 |
| rgb   | Object: `{ r, g, b }` or `{ r, g, b, a }`    | r,g,b: 0-255; a: 0-1              |
| hsl   | Object: `{ h, s, l }` or `{ h, s, l, a }`    | h: 0-360; s,l: 0-100; a: 0-1      |
| hsv   | Object: `{ h, s, v }`                        | h: 0-360; s,v: 0-100              |
| cmyk  | Object: `{ c, m, y, k }`                     | All: 0-100                        |
| lab   | Object: `{ l, a, b }`                        | l: 0-100; a,b: -128 to 128        |
| oklab | Object: `{ l, a, b }`                        | l: 0-1; a,b: approx -0.4 to 0.4   |
| oklch | Object: `{ l, c, h }`                        | l: 0-1; c: 0-0.4 approx; h: 0-360 |

All color fields also accept CSS color strings: `"#FF6B35"`, `"rgb(255, 107, 53)"`,
`"hsl(20 100% 60%)"`, `"oklch(0.7 0.15 20)"`, `"cornflowerblue"`.

## Examples

### Color space conversion

```
color({ operation: "convert", color: "#FF6B35", from_space: "hex", to_space: "hsl" })
color({ operation: "convert", color: "cornflowerblue", to_space: "rgb" })
color({ operation: "convert", color: { r: 255, g: 107, b: 53 }, from_space: "rgb", to_space: "oklch" })
```

### WCAG accessibility

```
color({ operation: "contrast_ratio", foreground: "#FFFFFF", background: "#2563EB" })
color({ operation: "wcag_level", foreground: "#FFFFFF", background: "#2563EB", size: "normal" })
color({ operation: "relative_luminance", color: "#2563EB" })
```

### Manipulation

```
color({ operation: "lighten", color: "#2563EB", amount: 10 })
color({ operation: "darken", color: "#2563EB", amount: 10, space: "oklch" })
color({ operation: "saturate", color: "#888888", amount: 20 })
color({ operation: "mix", color: "#FF0000", color2: "#0000FF", weight: 0.5 })
```

### Palettes

```
color({ operation: "complement", color: "#FF0000" })
color({ operation: "analogous", color: "#FF0000", count: 5, angle: 15 })
color({ operation: "triadic", color: "#2563EB" })
color({ operation: "tetradic", color: "#2563EB" })
```

### Parse (all formats)

```
color({ operation: "parse", color: "#FF6B35" })
color({ operation: "parse", color: "cornflowerblue" })
```

## Notes

- **Disambiguation:** Use `color` for color space conversions and color math.
  Use `convert` for unit conversions (km to miles, °C to °F, etc.). These are
  different tools.

- **CMYK:** Conversions use the standard formula without ICC profile correction.
  Actual printed color depends on ink and paper characteristics.

- **Gamut clipping:** When converting from wide-gamut spaces (OKLCH, Lab) to
  sRGB (hex, rgb), out-of-range values are clamped by default. Set
  `gamut_mapping: "css"` for the CSS Color Level 4 gamut mapping algorithm.
  Clipped results include `gamut_clipped: true`.

- **Alpha:** Alpha values are accepted and passed through conversions.
  Accessibility operations (contrast_ratio, wcag_level, relative_luminance)
  require opaque colors.

- **Amount:** For manipulation operations, `amount` is a percentage (0-100) of
  the working space's full range. `amount: 10` means "10% lighter/darker"
  regardless of whether the space is HSL (0-100) or OKLCH (0-1).

- **Mix:** Colors are mixed in OKLab space for perceptual uniformity, matching
  CSS `color-mix()` behavior. Weight 0 = all first color, 1 = all second color.

- **Ambiguous objects:** The object `{ l, a, b }` matches both Lab and OKLab.
  Provide `from_space: "lab"` or `from_space: "oklab"` to disambiguate.
