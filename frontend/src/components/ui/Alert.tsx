import { cn } from '@/utils/cn';

type AlertVariant = 'error' | 'success' | 'warning' | 'info';

const styles: Record<AlertVariant, string> = {
  error: 'bg-red-50 border-red-200 text-red-700',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
};

interface AlertProps {
  variant?: AlertVariant;
  message: string | string[];
  className?: string;
}

export function Alert({ variant = 'error', message, className }: AlertProps) {
  const messages = Array.isArray(message) ? message : [message];
  return (
    <div className={cn('rounded-lg border px-4 py-3 text-sm', styles[variant], className)}>
      {messages.length === 1 ? (
        messages[0]
      ) : (
        <ul className="list-disc list-inside space-y-0.5">
          {messages.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      )}
    </div>
  );
}
