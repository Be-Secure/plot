import * as Plot from "@observablehq/plot";
import * as d3 from "d3";

const times = [
  "2013-04-05T00:00Z",
  "2013-04-11T00:00Z",
  "2013-04-14T00:00Z",
  "2013-04-16T00:00Z",
  "2013-04-18T00:00Z",
  "2013-04-21T00:00Z",
  "2013-04-27T00:00Z"
].map(d3.isoParse);

const events = [
  {date: "2013-04-05T13:00Z", text: "Initiate"},
  {date: "2013-04-11T13:00Z", text: "Begin"},
  {date: "2013-04-13T20:00Z", text: "Entry"},
  {date: "2013-04-15T00:00Z", text: "Test"},
  {date: "2013-04-16T00:00Z", text: "Drive"},
  {date: "2013-04-17T08:00Z", text: "Drive"},
  {date: "2013-04-18T15:00Z", text: "Brake"},
  {date: "2013-04-20T10:00Z", text: "Stop"},
  {date: "2013-04-23T14:00Z", text: "Shutdown"}
].map(d => ({text: d.text, date: d3.isoParse(d.date)}));

const days = [...d3.utcDays(...d3.extent(times)), times[times.length-1]];

export default async function() {
  return Plot.plot({
    grid: true,
    x: {
      domain: times,
      type: "linear",
      ticks: days,
      tickFormat: d3.utcFormat("%d"),
      inset: 20,
      label: "date →"
    },
    color: {
      reverse: true, // unit tests both reverse…
      domain: d3.reverse(times), // …and a decreasing domain
      type: "linear",
      scheme: "cool"
    },
    marks: [
      Plot.barX(d3.pairs(days), {x1: "0", x2: "1", fill: "0", stroke: "1"}),
      Plot.dotX(events, {x: "date", fill: "white"}),
      Plot.textX(events, {x: "date", text: "text", dx: -5, dy: -10, fill: "white", textAnchor: "start"})
    ],
    height: 90
  });
}
