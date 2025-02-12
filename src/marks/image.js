import {create} from "d3";
import {positive} from "../defined.js";
import {maybeFrameAnchor, maybeNumberChannel, maybeTuple, string} from "../options.js";
import {Mark} from "../plot.js";
import {applyChannelStyles, applyDirectStyles, applyIndirectStyles, applyTransform, applyAttr, offset, impliedString, applyFrameAnchor} from "../style.js";

const defaults = {
  ariaLabel: "image",
  fill: null,
  stroke: null
};

// Tests if the given string is a path: does it start with a dot-slash
// (./foo.png), dot-dot-slash (../foo.png), or slash (/foo.png)?
function isPath(string) {
  return /^\.*\//.test(string);
}

// Tests if the given string is a URL (e.g., https://placekitten.com/200/300).
// The allowed protocols is overly restrictive, but we don’t want to allow any
// scheme here because it would increase the likelihood of a false positive with
// a field name that happens to contain a colon.
function isUrl(string) {
  return /^(blob|data|file|http|https):/i.test(string);
}

// Disambiguates a constant src definition from a channel. A path or URL string
// is assumed to be a constant; any other string is assumed to be a field name.
function maybePathChannel(value) {
  return typeof value === "string" && (isPath(value) || isUrl(value))
    ? [undefined, value]
    : [value, undefined];
}

export class Image extends Mark {
  constructor(data, options = {}) {
    let {x, y, width, height, src, preserveAspectRatio, crossOrigin, frameAnchor} = options;
    if (width === undefined && height !== undefined) width = height;
    else if (height === undefined && width !== undefined) height = width;
    const [vs, cs] = maybePathChannel(src);
    const [vw, cw] = maybeNumberChannel(width, 16);
    const [vh, ch] = maybeNumberChannel(height, 16);
    super(
      data,
      [
        {name: "x", value: x, scale: "x", optional: true},
        {name: "y", value: y, scale: "y", optional: true},
        {name: "width", value: vw, filter: positive, optional: true},
        {name: "height", value: vh, filter: positive, optional: true},
        {name: "src", value: vs, optional: true}
      ],
      options,
      defaults
    );
    this.src = cs;
    this.width = cw;
    this.height = ch;
    this.preserveAspectRatio = impliedString(preserveAspectRatio, "xMidYMid");
    this.crossOrigin = string(crossOrigin);
    this.frameAnchor = maybeFrameAnchor(frameAnchor);
  }
  render(index, {x, y}, channels, dimensions) {
    const {x: X, y: Y, width: W, height: H, src: S} = channels;
    const {dx, dy} = this;
    const [cx, cy] = applyFrameAnchor(this, dimensions);
    return create("svg:g")
        .call(applyIndirectStyles, this, dimensions)
        .call(applyTransform, x, y, offset + dx, offset + dy)
        .call(g => g.selectAll()
          .data(index)
          .join("image")
            .call(applyDirectStyles, this)
            .attr("x", W && X ? i => X[i] - W[i] / 2 : W ? i => cx - W[i] / 2 : X ? i => X[i] - this.width / 2 : cx - this.width / 2)
            .attr("y", H && Y ? i => Y[i] - H[i] / 2 : H ? i => cy - H[i] / 2 : Y ? i => Y[i] - this.height / 2 : cy - this.height / 2)
            .attr("width", W ? i => W[i] : this.width)
            .attr("height", H ? i => H[i] : this.height)
            .call(applyAttr, "href", S ? i => S[i] : this.src)
            .call(applyAttr, "preserveAspectRatio", this.preserveAspectRatio)
            .call(applyAttr, "crossorigin", this.crossOrigin)
            .call(applyChannelStyles, this, channels))
      .node();
  }
}

export function image(data, {x, y, ...options} = {}) {
  if (options.frameAnchor === undefined) ([x, y] = maybeTuple(x, y));
  return new Image(data, {...options, x, y});
}
