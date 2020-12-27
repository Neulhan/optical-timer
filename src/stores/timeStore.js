import { writable } from "svelte/store";

export const hourStore = writable(0);

export const minuteStore = writable(0);

export const secondStore = writable(0);
