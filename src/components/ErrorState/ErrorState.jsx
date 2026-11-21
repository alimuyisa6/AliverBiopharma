import Icon from '../Icon/Icon';

export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center rounded-2xl border border-red-200 bg-red-50/70 px-5 py-8 text-center sm:px-8">
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-700">
        <Icon name="exclamation-triangle" className="h-6 w-6" />
      </span>
      <h3 className="text-lg font-bold leading-7 text-red-950">Error</h3>
      <p className="mt-2 text-sm leading-6 text-red-800">{message}</p>
      {onRetry && (
        <button
          type="button"
          className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
          onClick={onRetry}
        >
          Try Again
        </button>
      )}
    </div>
  );
}