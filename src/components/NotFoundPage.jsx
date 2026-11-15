import './NotFoundPage.css';

export default function NotFoundPage() {
  return (
    <main className="ab-not-found" aria-labelledby="ab-not-found-title">
      <div className="ab-not-found__content">
        <p className="ab-not-found__code">404</p>
        <h1 id="ab-not-found-title">We couldn’t find that page</h1>
        <p>The link may be out of date, or the page may have moved.</p>
        <a href="/" className="ab-not-found__button">Back to home</a>
      </div>
    </main>
  );
}
