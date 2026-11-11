const paths = {
  arrowRight: <><path d="M4 12h15"/><path d="m13 5 7 7-7 7"/></>,
  arrowLeft: <><path d="M20 12H5"/><path d="m11 5-7 7 7 7"/></>,
  arrowUpRight: <><path d="M7 17 17 7"/><path d="M8 7h9v9"/></>,
  arrowDown: <><path d="M12 4v15"/><path d="m5 12 7 7 7-7"/></>,
  refresh: <><path d="M20 7v5h-5"/><path d="M4.7 9a8 8 0 0 1 13.2-2L20 12M4 17v-5h5"/><path d="M19.3 15a8 8 0 0 1-13.2 2L4 12"/></>,
  menu: <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>,
  close: <><path d="m6 6 12 12"/><path d="M18 6 6 18"/></>,
  chevronDown: <path d="m6 9 6 6 6-6"/>,
  dashboard: <><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="5"/><rect x="13" y="10" width="8" height="11"/><rect x="3" y="13" width="8" height="8"/></>,
  receipt: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2z"/><path d="M8 8h8M8 12h8M8 16h4"/></>,
  payment: <><rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 10h18M7 15h4"/></>,
  inventory: <><path d="m3 7 9-4 9 4-9 4z"/><path d="m3 12 9 4 9-4"/><path d="m3 17 9 4 9-4"/></>,
  box: <><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/><path d="M12 13v8"/></>,
  chart: <><path d="M4 19V5"/><path d="M4 19h17"/><path d="m7 15 4-4 3 2 6-7"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.1.9-1.1 1.9-1.4-.5a7.7 7.7 0 0 1-1.5.9l-.3 1.5h-2.2l-.3-1.5a7.7 7.7 0 0 1-1.5-.9l-1.4.5-1.1-1.9 1.1-.9a7 7 0 0 1 0-1.8l-1.1-.9 1.1-1.9 1.4.5a7.7 7.7 0 0 1 1.5-.9l.3-1.5h2.2l.3 1.5a7.7 7.7 0 0 1 1.5.9l1.4-.5 1.1 1.9-1.1.9a7 7 0 0 1 0 1.7Z" transform="translate(-1 -1)"/></>,
  signOut: <><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/></>,
  spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></>,
  plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
  shop: <><path d="M4 10V6l2-3h12l2 3v4"/><path d="M3 10h18v11H3z"/><path d="M8 21v-6h8v6"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
};

export default function Icon({ name, size = 16, strokeWidth = 1.6, className, ...props }) {
  return <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" focusable="false" {...props}>{paths[name] || paths.spark}</svg>;
}
