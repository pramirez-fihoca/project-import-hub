import { ReactNode } from 'react';
import { LucideIcon, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type AccentColor = 'blue' | 'green' | 'orange' | 'purple' | 'red';

const accentMap: Record<AccentColor, { border: string; text: string; iconBg: string; innerBg: string }> = {
  blue:   { border: 'border-l-blue-500',   text: 'text-blue-600',   iconBg: 'bg-blue-50',   innerBg: 'bg-blue-50/60' },
  green:  { border: 'border-l-green-500',  text: 'text-green-600',  iconBg: 'bg-green-50',  innerBg: 'bg-green-50/60' },
  orange: { border: 'border-l-orange-500', text: 'text-orange-600', iconBg: 'bg-orange-50', innerBg: 'bg-orange-50/60' },
  purple: { border: 'border-l-purple-500', text: 'text-purple-600', iconBg: 'bg-purple-50', innerBg: 'bg-purple-50/60' },
  red:    { border: 'border-l-red-500',    text: 'text-red-600',    iconBg: 'bg-red-50',    innerBg: 'bg-red-50/60' },
};

interface KPIPanelProps {
  title: string;
  icon: LucideIcon;
  color?: AccentColor;
  helpText?: string;
  children: ReactNode;
  className?: string;
}

export function KPIPanel({ title, icon: Icon, color = 'blue', helpText, children, className }: KPIPanelProps) {
  const c = accentMap[color];
  return (
    <div
      className={cn(
        'bg-card rounded-xl border border-border border-l-4 shadow-sm p-5',
        c.border,
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className={cn('h-5 w-5', c.text)} />
        <h3 className={cn('font-semibold text-base flex-1', c.text)}>{title}</h3>
        {helpText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-foreground">
                  <HelpCircle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{helpText}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className={cn('rounded-lg p-4', c.innerBg)}>
        {children}
      </div>
    </div>
  );
}

interface KPIBigValueProps {
  value: string | number;
  caption?: string;
  color?: AccentColor;
}

export function KPIBigValue({ value, caption, color = 'blue' }: KPIBigValueProps) {
  const c = accentMap[color];
  return (
    <div className="text-center py-2">
      <div className={cn('text-5xl font-bold', c.text)}>{value}</div>
      {caption && <p className="text-xs text-muted-foreground mt-2">{caption}</p>}
    </div>
  );
}

interface KPIMiniCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: AccentColor;
}

export function KPIMiniCard({ label, value, icon: Icon, color = 'blue' }: KPIMiniCardProps) {
  const c = accentMap[color];
  return (
    <div className={cn('flex-1 rounded-lg border border-border bg-card p-3 text-center', c.iconBg)}>
      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
        {Icon && <Icon className="h-3 w-3" />}
        <span>{label}</span>
      </div>
      <div className={cn('text-2xl font-bold', c.text)}>{value}</div>
    </div>
  );
}

export function KPIMiniGrid({ children }: { children: ReactNode }) {
  return <div className="flex gap-2 mt-3">{children}</div>;
}