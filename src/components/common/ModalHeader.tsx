export default function ModalHeader({
  title, 
  subtitle, 
  align = "left"
}: { 
  title: string; 
  subtitle?: string; 
  align?: "left" | "center" 
}) {
  const alignClass = align === "center" ? "text-center" : "text-left";
  
  return (
    <header className={`${alignClass} pt-3 pb-2`}>
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      {subtitle ? <p className="mt-2 text-muted-foreground">{subtitle}</p> : null}
    </header>
  );
}