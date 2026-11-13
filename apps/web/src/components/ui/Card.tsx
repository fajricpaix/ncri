export function Card({
  id,
  title,
  action,
  className = "",
  bodyClassName = "",
  children,
}: {
  id?: string;
  title?: string;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`flex flex-col rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 ${className}`}>
      {title && (
        <header className="flex items-center justify-between rounded-t-2xl bg-navy px-4 py-2.5 text-sm font-semibold text-white">
          <h2>{title}</h2>
          {action}
        </header>
      )}
      <div className={`flex-1 p-4 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
