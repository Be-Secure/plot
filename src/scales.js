import {registry, position, radius} from "./scales/index.js";
import {ScaleDiverging, ScaleLinear, ScalePow, ScaleLog, ScaleSymlog} from "./scales/quantitative.js";
import {ScaleTime, ScaleUtc} from "./scales/temporal.js";
import {ScaleOrdinal, ScalePoint, ScaleBand} from "./scales/ordinal.js";

export function Scales(channels, {inset, round, nice, align, padding, ...options} = {}) {
  const scales = {};
  for (const key of registry.keys()) {
    if (channels.has(key) || options[key]) {
      const scale = Scale(key, channels.get(key), {
        inset: key === "x" || key === "y" ? inset : undefined, // not for facet
        round,
        nice,
        align,
        padding,
        ...options[key]
      });
      if (scale) scales[key] = scale;
    }
  }
  return scales;
}

// Mutates scale.range!
export function autoScaleRange({x, y, fx, fy}, dimensions) {
  if (fx) autoScaleRangeX(fx, dimensions);
  if (fy) autoScaleRangeY(fy, dimensions);
  if (x) autoScaleRangeX(x, fx ? {width: fx.scale.bandwidth()} : dimensions);
  if (y) autoScaleRangeY(y, fy ? {height: fy.scale.bandwidth()} : dimensions);
}

function autoScaleRangeX(scale, dimensions) {
  if (scale.range === undefined) {
    const {inset = 0} = scale;
    const {width, marginLeft = 0, marginRight = 0} = dimensions;
    scale.scale.range([marginLeft + inset, width - marginRight - inset]);
  }
}

function autoScaleRangeY(scale, dimensions) {
  if (scale.range === undefined) {
    const {inset = 0} = scale;
    const {height, marginTop = 0, marginBottom = 0} = dimensions;
    const range = [height - marginBottom - inset, marginTop + inset];
    if (scale.type === "ordinal") range.reverse();
    scale.scale.range(range);
  }
}

function Scale(key, channels = [], options = {}) {
  switch (inferScaleType(key, channels, options)) {
    case "diverging": return ScaleDiverging(key, channels, options);
    case "categorical": case "ordinal": return ScaleOrdinal(key, channels, options);
    case "cyclical": case "sequential": case "linear": return ScaleLinear(key, channels, options);
    case "sqrt": return ScalePow(key, channels, {...options, exponent: 0.5});
    case "pow": return ScalePow(key, channels, options);
    case "log": return ScaleLog(key, channels, options);
    case "symlog": return ScaleSymlog(key, channels, options);
    case "utc": return ScaleUtc(key, channels, options);
    case "time": return ScaleTime(key, channels, options);
    case "point": return ScalePoint(key, channels, options);
    case "band": return ScaleBand(key, channels, options);
    case undefined: return;
    default: throw new Error(`unknown scale type: ${options.type}`);
  }
}

function inferScaleType(key, channels, {type, domain, range}) {
  if (type !== undefined) {
    for (const {type: t} of channels) {
      if (t !== undefined && type !== t) {
        throw new Error(`scale incompatible with channel: ${type} !== ${t}`);
      }
    }
    return type;
  }
  if (registry.get(key) === radius) return "sqrt";
  for (const {type} of channels) if (type !== undefined) return type;
  if ((domain || range || []).length > 2) return inferOrdinalType(key);
  if (domain !== undefined) {
    type = inferScaleTypeFromValues(key, domain);
    if (type !== undefined) return type;
  }
  channels = channels.filter(({value}) => value !== undefined);
  if (!channels.length) return;
  for (const {value} of channels) {
    type = inferScaleTypeFromValues(key, value);
    if (type !== undefined) return type;
  }
  return "linear";
}

function inferScaleTypeFromValues(key, values) {
  for (const value of values) {
    if (value == null) continue;
    if (typeof value === "string") return inferOrdinalType(key);
    if (typeof value === "boolean") return inferOrdinalType(key);
    if (value instanceof Date) return "utc";
    return "linear";
  }
}

// Positional scales default to a point scale instead of an ordinal scale.
function inferOrdinalType(key) {
  return registry.get(key) === position ? "point" : "ordinal";
}
