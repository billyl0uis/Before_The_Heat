// The heading block for the reading pages (Learn, Saved, About): the
// display face from DESIGN.md, left-aligned on the same column as the
// content under it, with an optional lede held to a readable measure.
export function PageHeader({ title, lede, children }) {
  return (
    <header className="mx-auto w-full max-w-5xl px-4 pt-8 pb-6 sm:px-8 sm:pt-12 sm:pb-8">
      <h1 className="text-[clamp(1.8rem,4.6vw,3.4rem)] leading-[0.98] font-extrabold tracking-tight text-balance">
        {title}
      </h1>
      {lede && <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-mute">{lede}</p>}
      {children}
    </header>
  )
}
