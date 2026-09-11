import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export function ScrollTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Remonter en haut"
      className="fixed bottom-20 right-4 z-40 w-11 h-11 rounded-full bg-[#00c9a7] shadow-lg flex items-center justify-center lg:hidden"
    >
      <ArrowUp className="w-5 h-5 text-white" />
    </button>
  );
}
