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
import '../../styles/empty-state.css';

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
        <button className="btn btn-primary empty-state-retry" type="button" onClick={handleRetry} disabled={checking}>
          {checking ? 'Checking connection…' : 'Try Again'}
        </button>
      </EmptyContent>
    </Empty>
  );
}
