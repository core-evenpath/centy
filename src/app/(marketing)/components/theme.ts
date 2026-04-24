export const C = {
  bg: '#FAF7F0', surface: '#FFFFFF', surfaceAlt: '#F1EDE3', surfaceDeep: '#E4DFD2',
  ink: '#0A0A0A', ink2: '#141414', ink3: '#1F1F1F',
  t1: '#0A0A0A', t2: '#3A3A38', t3: '#7A7972', t4: '#AAA89F',
  accent: '#4E3FFF', accentHover: '#3B2FE8', accentSoft: '#ECEBFF', accentDeep: '#2B1FB8',
  amber: '#C08A3E', amberSoft: '#F4E8D0',
  green: '#2F8F5F', greenSoft: '#E3F2EA', greenMid: '#5FBB8A',
  blue: '#2D6EB3', blueSoft: '#E1ECF5',
  indigo: '#4E3FFF', indigoSoft: '#ECEBFF',
  rust: '#C45D3D', rustSoft: '#F7E3DB',
  border: '#E4DFD2', borderDeep: '#CCC5B3', borderLight: '#F1EDE3',
  red: '#D23F3F',
};

export const F = "'Karla', -apple-system, BlinkMacSystemFont, sans-serif";
export const FM = "'JetBrains Mono', ui-monospace, monospace";
export const FS = "'Fraunces', 'Karla', serif";
// FD: upright editorial display face (same family as FS but used without italic)
export const FD = "'Fraunces', 'Georgia', 'Times New Roman', serif";

export const icons = {
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  arrow: 'M5 12h14M12 5l7 7-7 7',
  arrowUp: 'M7 17L17 7M7 7h10v10',
  check: 'M20 6L9 17l-5-5',
  x: 'M18 6L6 18M6 6l12 12',
  chevDown: 'M6 9l6 6 6-6',
  chevRight: 'M9 18l6-6-6-6',
  layout: 'M3 3h18v18H3zM3 9h18M9 21V9',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  inbox: 'M22 12l-6 0-2 3h-4l-2-3-6 0M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z',
  chart: 'M12 20V10M18 20V4M6 20v-4',
  spark: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
  msg: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-1 4 4 0 000 0M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  clock: 'M12 12V6M12 12l4 2M12 2a10 10 0 100 20 10 10 0 000-20z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z',
  phone: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4z',
  tag: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01',
  calendar: 'M16 2v4M8 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  dollar: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  broadcast: 'M4.93 4.93a10 10 0 0114.14 0M7.76 7.76a6 6 0 018.48 0M12 12h.01',
  megaphone: 'M3 11l18-5v12L3 13v-2zM11.6 16.8a3 3 0 11-5.8-1.6',
  file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6',
  mouse: 'M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v6l4 2',
  sparkles: 'M12 3l1.9 5.9L20 11l-6.1 2.1L12 19l-1.9-5.9L4 11l6.1-2.1L12 3z',
  lightning: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  lock: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4',
};
