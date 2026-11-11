export default function AnimatedLabel({ children }) {
  const label = String(children);
  return <>
    <span className="sr-only">{label}</span>
    <span aria-hidden="true" className="action-label">
      {Array.from(label).map((character, index) => <span className="action-character" key={`${character}-${index}`} style={{ transitionDelay: `${index * 0.014}s` }}>
        <span>{character}</span><span>{character}</span>
      </span>)}
    </span>
  </>;
}
