/*
 * Starting money choice, shared by the one-device setup screen and the online host lobby.
 * Presets plus a custom amount in steps of ₱50, clamped to a sane range.
 */
import { RULES } from "./data.js";

export const MONEY_PRESETS = [1000, 1500, 2000, 3000];
export const MONEY_MIN = 500;
export const MONEY_MAX = 10000;
export const MONEY_STEP = 50;

const fmt = n => "₱" + Number(n).toLocaleString("en-US");

/** Any input (string, NaN, out of range) becomes a valid starting amount. */
export function clampMoney(v) {
  const n = Math.round(Number(v) / MONEY_STEP) * MONEY_STEP;
  if (!Number.isFinite(n) || n <= 0) return RULES.startMoney;
  return Math.min(MONEY_MAX, Math.max(MONEY_MIN, n));
}

/**
 * Buttons for each preset, a Custom button, and a number box when Custom is on.
 * `attr` names the data attribute the caller listens for, e.g. "money" -> data-money="1500".
 */
export function moneyPickerHtml(value, custom, attr) {
  const isCustom = custom || !MONEY_PRESETS.includes(value);
  const btns = MONEY_PRESETS.map(n => `<button type="button" class="${!isCustom && n === value ? "on" : ""}" data-${attr}="${n}">${fmt(n)}${n === RULES.startMoney ? " <small>(default)</small>" : ""}</button>`).join("");
  const box = isCustom
    ? `<span class="money-custom">₱ <input type="number" inputmode="numeric" min="${MONEY_MIN}" max="${MONEY_MAX}" step="${MONEY_STEP}" value="${value}" data-${attr}-input aria-label="Custom starting money"> <span class="muted money-hint">${fmt(MONEY_MIN)} to ${fmt(MONEY_MAX)}</span></span>`
    : "";
  return btns + `<button type="button" class="${isCustom ? "on" : ""}" data-${attr}="custom">Custom</button>` + box;
}

export const moneyLabel = fmt;
