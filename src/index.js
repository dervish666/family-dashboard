// Family Dashboard, a Lovelace card: <family-dashboard-card>.
// A small animated world where each member of the household lives as a creature.
// Tap one to see that person's week. It reads hass.states directly, so it needs no token
// and no iframe. Built for a 1280x800 wall panel whose browser is Chrome 87, so: no
// backdrop-filter, no ctx.roundRect, no CSS aspect-ratio, no :is().
//
// This is the source. `npm run build` bundles it with esbuild into the one plain module
// HACS serves, dist/family-dashboard.js, which is committed. Edit here, never in dist.
//
//   card.js           the card element, its style and markup
//   editor.js         the visual editor
//   config.js         DEFAULTS, normalize(), the first-install stub
//   calendar.js       reading calendars straight from Home Assistant
//   engine/engine.js  the world: creatures, the day, weather, parties, the cards
//   engine/draw.js    canvas helpers shared by the engine, creatures and scenes
//   creatures/*.js    one module per animal, listed in creatures/index.js
//   scenes/*.js       one module per scene, listed in scenes/index.js
import "./card.js";

// For tests/check.mjs. Home Assistant loads this file as a module and ignores the exports.
export { normalize, stubConfig, SCENES, LOOKS } from "./config.js";
export { parseCalendarEvents, weekRange, calendarPath } from "./calendar.js";
