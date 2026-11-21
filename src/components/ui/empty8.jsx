import { useCallback, useState } from 'react';
import Icon from '../Icon/Icon';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './empty';

export default function EmptyComponent({
  title = 'No Internet Connection',
  description = 'It seems you are offline. Check your internet connection and try again.',
  onRetry,
  className = '',
}) {
  const [checking, setChecking] = useState(false);

  const handleRetry = useCallback(async () => {
    if (checking) return;
    setChecking(true);
    try {
      if (onRetry) {
        await onRetry();
      } else if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } finally {
      setChecking(false);
    }
  }, [checking, onRetry]);

  return (
    <Empty className={className} role="status" aria-live="polite">
      <EmptyHeader>
        <EmptyMedia variant="icon" aria-hidden="true">
          <Icon name="wifi-slash" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <button className="inline-flex min-h-10 items-center justify-center rounded-xl bg-primary-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:cursor-wait disabled:opacity-60" type="button" onClick={handleRetry} disabled={checking}>
          {checking ? 'Checking connection…' : 'Try Again'}
        </button>
      </EmptyContent>
    </Empty>
  );
}
