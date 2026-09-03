import { Wifi, WifiOff } from 'lucide-react';

export default function ConnectivityIndicator({ status = 'ONLINE' }) {
  const isOnline = status === 'ONLINE';
  return (
    <div
      className={[
        'flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-mono tracking-wide',
        isOnline
          ? 'border-status-safe/30 bg-status-safe/10 text-status-safe'
          : 'border-status-critical/30 bg-status-critical/10 text-status-critical',
      ].join(' ')}
    >
      {isOnline ? (
        <Wifi className="h-3.5 w-3.5" strokeWidth={2} />
      ) : (
        <WifiOff className="h-3.5 w-3.5" strokeWidth={2} />
      )}
      <span className="relative flex h-1.5 w-1.5">
        <span
          className={[
            'absolute inline-flex h-full w-full rounded-full',
            isOnline ? 'bg-status-safe animate-pulse-dot' : 'bg-status-critical',
          ].join(' ')}
        />
      </span>
      {status}
    </div>
  );
}
