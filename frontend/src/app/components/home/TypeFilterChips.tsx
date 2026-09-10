export interface TypeFilterOption {
  id: string;
  label: string;
}

export function TypeFilterChips({
  options,
  active,
  onChange,
}: {
  options: TypeFilterOption[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {options.map((opt) => {
        const isActive = active === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
              isActive
                ? 'bg-[#0f2940] border-[#0f2940] text-white'
                : 'bg-white border-gray-200 text-[#6b7280] hover:border-[#0f2940]/40'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
