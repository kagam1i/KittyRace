// LaneGrid — визуальная сетка 5 полос на дороге

export default function LaneGrid() {
  return (
    <div className="absolute inset-0 grid grid-cols-5">
      <div className="border-r border-border/20" />
      <div className="border-r border-border/20" />
      <div className="border-r border-border/20" />
      <div className="border-r border-border/20" />
      <div />
    </div>
  );
}
