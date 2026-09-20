/* pages/BlogPage.jsx */
import { useEffect, useState } from 'react';
import { useLayout } from '../contexts/LayoutContext';
import { useParams } from 'react-router-dom';
import { getSections } from '../api/sections';
import { getArticleBySlug } from '../api/cachedClient';

export default function BlogPage() {
  const { level } = useLayout();
  const { slug } = useParams();
  const [sections, setSections] = useState(null);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    const request = slug
      ? getArticleBySlug(slug).then((data) => {
          if (cancelled) return;
          setArticle(data || null);
          setSections(null);
        })
      : level?.id
        ? getSections(level.id).then((data) => {
            if (cancelled) return;
            setSections(data || {});
            setArticle(null);
          })
        : Promise.resolve();

    request
      .catch((err) => {
        if (cancelled) return;
        setArticle(null);
        setSections(null);
        setError(err?.message || 'Unable to load blog content.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [level?.id, slug]);

  const blog = sections?.blog;
  const posts = Array.isArray(blog?.posts) ? blog.posts.filter(Boolean) : [];
  const featured = article || blog?.featured || posts[0] || null;
  const topics = Array.isArray(blog?.topics)
    ? blog.topics.filter(Boolean)
    : [...new Set(posts.map((post) => post.category).filter(Boolean))];
  const bodyParagraphs = Array.isArray(featured?.content)
    ? featured.content.filter(Boolean)
    : typeof featured?.content === 'string' && featured.content.trim()
      ? [featured.content]
      : [];
  const bodySections = Array.isArray(featured?.sections)
    ? featured.sections.filter(Boolean)
    : [];

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : new Intl.DateTimeFormat(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(date);
  };

  return (
    <>
      <style>{`
        .blog-page {
          --blog-content-width: 800px;
          --blog-grid-width: 1000px;
          --blog-page-gutter: var(--page-gutter-x);
          --blog-surface: var(--bg-card);
          --blog-surface-muted: var(--bg-muted);
          --blog-border: var(--border-default);
          --blog-text: var(--text-main);
          --blog-secondary: var(--text-secondary);
          --blog-muted: var(--text-muted);
          --blog-primary: var(--primary);
          --blog-primary-hover: var(--primary-hover);
          --blog-primary-light: var(--primary-light);
          --blog-radius: var(--radius-md);
          --blog-radius-small: var(--radius-sm);
          --blog-shadow-card: var(--shadow-card);
          --blog-shadow-raised: var(--shadow-raised);
        }

        .blog-page * {
          box-sizing: border-box;
        }

        .blog-page .blog-topic-area {
          width: min(100%, var(--blog-content-width));
          margin: var(--space-10) auto;
          padding: 0 var(--blog-page-gutter);
          text-align: center;
        }

        .blog-page .blog-topic-buttons {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: var(--space-3);
          margin-bottom: var(--space-8);
        }

        .blog-page .blog-topic-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          min-height: var(--button-height-md);
          padding: var(--space-3) var(--space-5);
          border: 1px solid var(--blog-border);
          border-radius: var(--blog-radius-small);
          background: var(--blog-surface);
          color: var(--blog-text);
          font-family: var(--font-primary);
          font-size: var(--text-md);
          font-weight: var(--weight-semibold);
          line-height: var(--leading-normal);
          cursor: pointer;
          transition:
            background-color var(--duration-fast) var(--ease-standard),
            border-color var(--duration-fast) var(--ease-standard),
            transform var(--duration-fast) var(--ease-standard);
        }

        .blog-page .blog-topic-button:hover {
          background: var(--blog-primary-light);
          border-color: var(--blog-primary);
          transform: translateY(-1px);
        }

        .blog-page .blog-explore-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: min(100%, 400px);
          min-height: var(--button-height-lg);
          margin: 0 auto;
          padding: var(--space-3) var(--space-8);
          border: 1px solid var(--blog-primary);
          border-radius: var(--blog-radius-small);
          background: var(--blog-primary);
          color: var(--text-on-primary);
          font-family: var(--font-primary);
          font-size: var(--text-md);
          font-weight: var(--weight-bold);
          letter-spacing: var(--tracking-wide);
          line-height: var(--leading-normal);
          cursor: pointer;
          box-shadow: var(--shadow-sm);
          transition:
            background-color var(--duration-fast) var(--ease-standard),
            transform var(--duration-fast) var(--ease-standard),
            box-shadow var(--duration-fast) var(--ease-standard);
        }

        .blog-page .blog-explore-button:hover {
          background: var(--blog-primary-hover);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .blog-page .blog-article-header {
          width: min(100%, var(--blog-content-width));
          margin: var(--space-12) auto var(--space-6);
          padding: 0 var(--blog-page-gutter);
          text-align: center;
        }

        .blog-page .blog-article-header h1 {
          margin: 0 0 var(--space-4);
          color: var(--blog-text);
          font-family: var(--font-heading);
          font-size: var(--text-page-title);
          font-weight: var(--weight-page-title);
          line-height: var(--leading-page-title);
          letter-spacing: var(--tracking-tight);
        }

        .blog-page .blog-article-meta {
          margin-bottom: var(--space-5);
          color: var(--blog-muted);
          font-size: var(--text-sm);
          line-height: var(--leading-normal);
        }

        .blog-page .blog-article-meta strong {
          color: var(--blog-primary);
          font-weight: var(--weight-bold);
        }

        .blog-page .blog-share {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-8);
        }

        .blog-page .blog-share-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: var(--space-10);
          height: var(--space-10);
          border: 1px solid var(--blog-border);
          border-radius: var(--radius-round);
          background: var(--blog-surface);
          color: var(--blog-text);
          font-size: var(--text-sm);
          font-weight: var(--weight-bold);
          transition:
            background-color var(--duration-fast) var(--ease-standard),
            border-color var(--duration-fast) var(--ease-standard),
            transform var(--duration-fast) var(--ease-standard);
        }

        .blog-page .blog-share-link:hover {
          background: var(--blog-primary);
          border-color: var(--blog-primary);
          color: var(--text-on-primary);
          transform: translateY(-2px);
        }

        .blog-page .blog-featured-image {
          display: block;
          width: min(calc(100% - (var(--blog-page-gutter) * 2)), var(--blog-content-width));
          height: auto;
          max-height: 500px;
          margin: 0 auto var(--space-8);
          object-fit: cover;
          border: 1px solid var(--blog-border);
          border-radius: var(--blog-radius);
          box-shadow: var(--blog-shadow-raised);
        }

        .blog-page .blog-article-body {
          width: min(100%, var(--blog-content-width));
          margin: 0 auto;
          padding: 0 var(--blog-page-gutter) var(--space-16);
          color: var(--blog-secondary);
          font-family: var(--font-reading);
          font-size: var(--text-body-lead);
          line-height: var(--leading-body-lead);
        }

        .blog-page .blog-article-body p {
          margin: 0 0 var(--space-5);
          color: var(--blog-secondary);
        }

        .blog-page .blog-article-body h2 {
          margin: var(--space-10) 0 var(--space-4);
          color: var(--blog-text);
          font-family: var(--font-heading);
          font-size: var(--text-subsection-title);
          font-weight: var(--weight-semibold);
          line-height: var(--leading-subsection-title);
        }

        .blog-page .blog-article-body ul {
          margin: 0 0 var(--space-5);
          padding-left: var(--space-6);
        }

        .blog-page .blog-article-body li {
          margin-bottom: var(--space-2);
          color: var(--blog-secondary);
        }

        .blog-page .blog-latest {
          padding: var(--space-16) var(--blog-page-gutter);
          background: var(--section-tint);
          border-top: 1px solid var(--blog-border);
          border-bottom: 1px solid var(--blog-border);
        }

        .blog-page .blog-latest h2 {
          margin: 0 0 var(--space-10);
          color: var(--blog-text);
          font-family: var(--font-heading);
          font-size: var(--text-section-title);
          font-weight: var(--weight-section-title);
          line-height: var(--leading-section-title);
          text-align: center;
        }

        .blog-page .blog-posts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--content-gap);
          width: min(100%, var(--blog-grid-width));
          margin: 0 auto;
        }

        .blog-page .blog-post-card {
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow: hidden;
          background: var(--blog-surface);
          border: 1px solid var(--blog-border);
          border-radius: var(--blog-radius);
          box-shadow: var(--blog-shadow-card);
          transition:
            border-color var(--duration-fast) var(--ease-standard),
            box-shadow var(--duration-fast) var(--ease-standard),
            transform var(--duration-fast) var(--ease-standard);
        }

        .blog-page .blog-post-card:hover {
          border-color: var(--border-strong);
          box-shadow: var(--blog-shadow-raised);
          transform: translateY(-4px);
        }

        .blog-page .blog-post-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
        }

        .blog-page .blog-post-content {
          display: flex;
          flex: 1;
          flex-direction: column;
          align-items: flex-start;
          padding: var(--card-padding-y) var(--card-padding-x);
        }

        .blog-page .blog-post-category {
          margin-bottom: var(--space-3);
          color: var(--blog-primary);
          font-size: var(--text-eyebrow);
          font-weight: var(--weight-eyebrow);
          letter-spacing: var(--tracking-eyebrow);
          text-transform: uppercase;
        }

        .blog-page .blog-post-title {
          margin: 0 0 var(--space-3);
          color: var(--blog-text);
          font-family: var(--font-heading);
          font-size: var(--text-card-title);
          font-weight: var(--weight-card-title);
          line-height: var(--leading-card-title);
        }

        .blog-page .blog-post-date {
          margin-bottom: var(--space-4);
          color: var(--blog-muted);
          font-size: var(--text-caption);
        }

        .blog-page .blog-post-excerpt {
          display: -webkit-box;
          overflow: hidden;
          margin: 0 0 var(--space-5);
          color: var(--blog-secondary);
          font-size: var(--text-body-sm);
          line-height: var(--leading-relaxed);
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
        }

        .blog-page .blog-read-more {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: var(--button-height-sm);
          margin-top: auto;
          padding: var(--space-2) var(--space-5);
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-sm);
          background: transparent;
          color: var(--blog-text);
          font-size: var(--text-sm);
          font-weight: var(--weight-semibold);
          transition:
            background-color var(--duration-fast) var(--ease-standard),
            border-color var(--duration-fast) var(--ease-standard),
            color var(--duration-fast) var(--ease-standard);
        }

        .blog-page .blog-read-more:hover {
          background: var(--blog-primary);
          border-color: var(--blog-primary);
          color: var(--text-on-primary);
        }

        @media (max-width: 768px) {
          .blog-page .blog-topic-area {
            margin-block: var(--space-8);
          }

          .blog-page .blog-topic-buttons {
            flex-direction: column;
            align-items: stretch;
          }

          .blog-page .blog-topic-button {
            width: 100%;
          }

          .blog-page .blog-article-header {
            margin-top: var(--space-8);
          }

          .blog-page .blog-article-header h1 {
            font-size: var(--text-2xl);
          }

          .blog-page .blog-article-body {
            font-size: var(--text-body);
          }

          .blog-page .blog-latest {
            padding-block: var(--space-12);
          }

          .blog-page .blog-latest h2 {
            font-size: var(--text-2xl);
            margin-bottom: var(--space-8);
          }
        }

        @media (max-width: 480px) {
          .blog-page .blog-featured-image {
            width: calc(100% - (var(--space-4) * 2));
          }

          .blog-page .blog-post-image {
            height: 180px;
          }

          .blog-page .blog-post-content {
            padding: var(--card-padding-y-compact) var(--card-padding-x-compact);
          }
        }
      `}</style>

      <div className="blog-page">
        {loading ? (
          <section className="blog-article-body" aria-busy="true" aria-live="polite">
            <p>Loading blog content…</p>
          </section>
        ) : error ? (
          <section className="blog-article-body" role="alert">
            <p>{error}</p>
          </section>
        ) : !featured && posts.length === 0 ? (
          <section className="blog-article-body">
            <p>No blog content is currently available.</p>
          </section>
        ) : (
          <>
            {topics.length > 0 && (
              <section className="blog-topic-area" aria-label="Blog topics">
                <div className="blog-topic-buttons">
                  {topics.map((topic) => {
                    const label = typeof topic === 'string'
                      ? topic
                      : topic?.label || topic?.name || '';
                    if (!label) return null;
                    return (
                      <button type="button" className="blog-topic-button" key={label}>
                        {label}
                      </button>
                    );
                  })}
                </div>
                {blog?.explore_label && (
                  <button type="button" className="blog-explore-button">
                    {blog.explore_label}
                  </button>
                )}
              </section>
            )}

            {featured && (
              <article>
                <header className="blog-article-header">
                  <h1>{featured.title}</h1>
                  <div className="blog-article-meta">
                    {featured.category && <strong>{featured.category}</strong>}
                    {featured.author && <> · by {featured.author}</>}
                    {featured.published_at && <> · {formatDate(featured.published_at)}</>}
                  </div>
                  {(featured.share?.facebook || featured.share?.x || featured.share?.linkedin || featured.share?.whatsapp) && (
                    <div className="blog-share" aria-label="Share article">
                      {featured.share.facebook && <a href={featured.share.facebook} className="blog-share-link" aria-label="Share on Facebook">f</a>}
                      {featured.share.x && <a href={featured.share.x} className="blog-share-link" aria-label="Share on X">X</a>}
                      {featured.share.linkedin && <a href={featured.share.linkedin} className="blog-share-link" aria-label="Share on LinkedIn">in</a>}
                      {featured.share.whatsapp && <a href={featured.share.whatsapp} className="blog-share-link" aria-label="Share on WhatsApp">W</a>}
                    </div>
                  )}
                </header>
                {featured.image_url && (
                  <img src={featured.image_url} alt={featured.image_alt || featured.title} className="blog-featured-image" />
                )}
                {(bodyParagraphs.length > 0 || bodySections.length > 0) && (
                  <div className="blog-article-body">
                    {bodyParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                    {bodySections.map((section, index) => (
                      <section key={section.id || index}>
                        {section.heading && <h2>{section.heading}</h2>}
                        {Array.isArray(section.paragraphs)
                          ? section.paragraphs.filter(Boolean).map((paragraph, paragraphIndex) => (
                              <p key={paragraphIndex}>{paragraph}</p>
                            ))
                          : section.content && <p>{section.content}</p>}
                        {Array.isArray(section.items) && section.items.length > 0 && (
                          <ul>{section.items.filter(Boolean).map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ul>
                        )}
                      </section>
                    ))}
                  </div>
                )}
              </article>
            )}

            {posts.length > 0 && (
              <section className="blog-latest" aria-labelledby="latest-blog-heading">
                {blog?.latest_heading && <h2 id="latest-blog-heading">{blog.latest_heading}</h2>}
                <div className="blog-posts-grid">
                  {posts.slice(0, 3).map((post) => (
                    <article className="blog-post-card" key={post.id || post.slug || post.title}>
                      {post.image_url && (
                        <img src={post.image_url} alt={post.image_alt || post.title} className="blog-post-image" loading="lazy" />
                      )}
                      <div className="blog-post-content">
                        {post.category && <span className="blog-post-category">{post.category}</span>}
                        <h3 className="blog-post-title">{post.title}</h3>
                        {post.published_at && <div className="blog-post-date">{formatDate(post.published_at)}</div>}
                        {post.excerpt && <p className="blog-post-excerpt">{post.excerpt}</p>}
                        {post.slug && (
                          <a href={`/blog/${post.slug}`} className="blog-read-more">
                            {post.read_more_label || 'Read More'}
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
