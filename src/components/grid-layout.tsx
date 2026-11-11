export function GridLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_1fr] gap-2 py-2 lg:grid-cols-3 lg:grid-rows-1">
      {children}
    </div>
  )
}
