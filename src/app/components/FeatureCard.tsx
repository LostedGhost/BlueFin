import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 text-center">
      <div className="w-16 h-16 bg-[#00c9a7]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-[#00c9a7]" />
      </div>
      <h3 className="font-bold text-lg text-[#0f2940] mb-2">{title}</h3>
      <p className="text-[#6b7280] text-sm">{description}</p>
    </div>
  );
}
