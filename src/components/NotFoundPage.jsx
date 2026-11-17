
export default function NotFoundPage() {
  return (
    <main className="flex min-h-[70vh] w-full items-center justify-center bg-slate-50 px-5 py-16" aria-labelledby="ab-not-found-title">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl sm:p-12">
        <p className="mb-3 text-7xl font-black tracking-tighter text-secondary-500 sm:text-8xl">404</p>
        <h1 id="ab-not-found-title" className="text-3xl font-bold text-primary-900 sm:text-4xl">We couldn’t find that page</h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-slate-600">The link may be out of date, or the page may have moved.</p>
        <a href="/" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary-700 px-6 py-3 font-bold text-white no-underline hover:bg-primary-800">Back to home</a>
      </div>
    </main>
  );
}
