// src/components/PageSection.tsx
import React from 'react';

interface PageSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function PageSection({ title, subtitle, children }: PageSectionProps) {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <div className="max-w-[1440px] mx-auto">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-[#00c9a7] mb-2">Bluefin-Immo</p>
          <h2 className="text-2xl lg:text-4xl font-bold text-[#0f2940]">{title}</h2>
          {subtitle && <p className="text-sm lg:text-base text-[#6b7280] mt-3 max-w-2xl mx-auto">{subtitle}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}