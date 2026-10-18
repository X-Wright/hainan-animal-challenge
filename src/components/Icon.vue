<script setup>
defineProps({ name: String, size: { type: [Number, String], default: 20 } });
const paths = {
  arrow: 'M4 12h16m-6-6 6 6-6 6', back: 'M20 12H4m6-6-6 6 6 6',
  expand: 'M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5',
  volume: 'M11 5 6 9H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  mute: 'M11 5 6 9H3v6h3l5 4V5Zm5 4 5 6m0-6-5 6',
  check: 'm5 12 4 4L19 6', close: 'm6 6 12 12M18 6 6 18',
  refresh: 'M20 7v5h-5m5 0a8 8 0 1 0-2 6M20 7l-3-3',
  leaf: 'M19 4C9 2 3 8 6 15s14 2 13-11ZM6 18l9-9',
  clock: 'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  book: 'M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1m0-15c4-3 8-2 10-1v15c-4-2-7-1-10 1V5Z',
  spark: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z',
  trophy: 'M7 3h10v6a5 5 0 0 1-10 0V3Zm0 2H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4M12 14v6m-4 1h8'
};
</script>
<template><svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] || paths.spark" /></svg></template>
