export default function PageHero({
  title, subtitle, pad = "pt-3"
}: { title: string; subtitle?: string; pad?: string }) {
  return (
    <header className={`text-center ${pad} pb-2`}>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {subtitle ? <p className="mt-2 text-muted-foreground">{subtitle}</p> : null}
    </header>
  );
}