import './NotFoundPage.css';

export default function NotFoundPage() {
  return (
    <main className="ab-not-found" aria-labelledby="ab-not-found-title">
      <div className="ab-not-found__content">
        <div className="ab-not-found__scene" aria-hidden="true">
          <span className="ab-not-found__ghost-number">404</span>
          <div className="ab-not-found__orbit ab-not-found__orbit--one" />
          <div className="ab-not-found__orbit ab-not-found__orbit--two" />
          <div className="ab-not-found__character">
            <span className="ab-not-found__character-face"><i /><i /><b /></span>
            <span className="ab-not-found__character-body" />
            <span className="ab-not-found__character-map">?</span>
          </div>
          <span className="ab-not-found__floating ab-not-found__floating--one">?</span>
          <span className="ab-not-found__floating ab-not-found__floating--two">?</span>
        </div>
        <h1 id="ab-not-found-title">We couldn’t find that page</h1>
        <p>The link may be out of date, or the page may have moved.</p>
        <a href="/" className="ab-not-found__button">Back to home</a>
      </div>
    </main>
  );
}
