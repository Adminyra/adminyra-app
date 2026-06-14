type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: string[];
};

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  items,
}: PlaceholderPageProps) {
  return (
    <section>
      <p className="mb-3 text-sm font-black uppercase tracking-[0.35em] text-[#c9795e]">
        {eyebrow}
      </p>

      <h1 className="text-4xl font-black tracking-[-0.03em] text-[#0f2d3a] md:text-5xl">
        {title}
      </h1>

      <p className="mt-4 max-w-3xl text-lg leading-8 text-[#405459]">
        {description}
      </p>

      <div className="mt-8 rounded-[2rem] border border-[#0f2d3a]/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-[#0f2d3a]">
          Komt in V1
        </h2>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-[#0f2d3a]/10 bg-[#fffaf4] p-4 text-sm font-bold leading-6 text-[#405459]"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}