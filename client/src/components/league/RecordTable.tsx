

export default function RecordTable({ title, data, accent }: any) {
    return (
      <div className="bg-bg-primary border border-border-input shadow-sm overflow-hidden">
        <div className="px-4 py-2 bg-bg-tertiary border-b border-border-default">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
            {title}
          </h3>
        </div>
        <div className="flex flex-col divide-y divide-border-subtle">
          {data.map((row: any, i: number) => (
            <div
              key={i}
              className="flex justify-between items-center px-4 py-3 hover:bg-bg-secondary"
            >
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-text-muted-subtle">
                  {row.label}
                </span>
                <span className="text-xs font-bold uppercase text-text-secondary">
                  {row.team}
                </span>
              </div>
              <span className={`font-mono font-black text-sm ${accent}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }