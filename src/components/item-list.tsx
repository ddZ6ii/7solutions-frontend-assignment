export function ItemList() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(6rem,100%),1fr))] items-start gap-1 bg-amber-500 lg:grid-cols-1 lg:gap-2">
      {Array(10)
        .fill(null)
        .map((_, i) => (
          <button key={i} className="bg-slate-500 p-2">
            Item {i + 1}
          </button>
        ))}
    </div>
  )
}
