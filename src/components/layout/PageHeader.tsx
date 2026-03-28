import { Menu } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  onMenuClick: () => void;
}

export const PageHeader = ({ title, onMenuClick }: PageHeaderProps) => (
  <header className="sticky top-0 z-40 bg-m3-surface/80 backdrop-blur-md border-b border-m3-outline/10 px-4 py-4 lg:px-8">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-3 lg:hidden text-m3-on-surface-variant hover:bg-m3-surface-variant/50 rounded-full transition-colors"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-3 lg:hidden">
          <h1 className="text-xl font-black tracking-tight text-m3-on-surface">Mise</h1>
        </div>
        <div className="hidden lg:block">
          <h1 className="text-2xl font-black tracking-tight text-m3-on-surface">{title}</h1>
        </div>
      </div>
    </div>
  </header>
);