 import { useEffect, useState } from 'react';
import { useLayout } from '../contexts/LayoutContext';
import { useParams } from 'react-router-dom';
import { getSections } from '../api/sections';
import { getArticleBySlug, listArticles } from '../api/cachedClient';
import Icon from '../components/Icon/Icon';

const blogPageCache = new Map();

export default function BlogPage() {
  const { level } = useLayout();
  const { slug } = useParams();
  const [sections, setSections] = useState(null);
  const [article, setArticle] = useState(null);
  const [databasePosts, setDatabasePosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheKey = slug ? `article:${slug}` : `list:${level?.id || 'default'}`;

  useEffect(() => {
    let cancelled = false;

    const cached = blogPageCache.get(cacheKey);
    setLoading(!cached);
    setError(null);
    if (cached) {
      setSections(cached.sections);
      setArticle(cached.article);
      setDatabasePosts(cached.databasePosts);
    }

    const request = slug
      ? getArticleBySlug(slug).then((data) => {
          if (cancelled) return;
          const next = { article: data || null, sections: null, databasePosts: [] };
          blogPageCache.set(cacheKey, next);
          setArticle(next.article);
          setSections(next.sections);
          setDatabasePosts(next.databasePosts);
        })
      : Promise.all([
          level?.id ? getSections(level.id) : Promise.resolve({}),
          listArticles({ page: 1, limit: 12 }),
        ]).then(([sectionData, articleData]) => {
          if (cancelled) return;
          const next = {
            sections: sectionData || {},
            article: null,
            databasePosts: Array.isArray(articleData?.articles) ? articleData.articles : [],
          };
          blogPageCache.set(cacheKey, next);
          setSections(next.sections);
          setArticle(next.article);
          setDatabasePosts(next.databasePosts);
        });

    request
      .catch((err) => {
        if (cancelled) return;
        if (!cached) {
          setArticle(null);
          setSections(null);
          setError(err?.message || "We couldn’t load the articles. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [level?.id, slug]);

  const blog = sections?.blog;
  const posts = databasePosts.length > 0
    ? databasePosts
    : Array.isArray(blog?.posts)
      ? blog.posts.filter(Boolean)
      : [];
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

  const getArticleImage = (item) => {
    if (item?.image_url) return item.image_url;
    const category = String(item?.category || '').toLowerCase();
    if (/pharmacy|medicine|medication|drug/.test(category)) {
      return 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop';
    }
    if (/biology|cell|science|anatomy/.test(category)) {
      return 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop';
    }
    return 'https://images.pexels.com/photos/8199770/pexels-photo-8199770.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop';
  };

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

  const share = featured?.share;
  const hasShare = share?.facebook || share?.x || share?.linkedin || share?.whatsapp;

  return (
    <div className="blog-page journal-page">
      {!slug && !loading && !error && (featured || posts.length > 0) && (
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-700 px-4 py-12 text-white sm:px-6 sm:py-16 lg:py-20">
          <div className="pointer-events-none absolute inset-0 opacity-20" aria-hidden="true">
            <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border-[36px] border-white/20" />
            <div className="absolute -bottom-28 left-8 h-64 w-64 rounded-full border-[28px] border-secondary-200/30" />
          </div>
          <div className="relative mx-auto grid max-w-6xl gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[.18em] text-blue-100">
                <Icon name="book-open-reader" size="1.1rem" plain /> Aliver knowledge journal
              </span>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Ideas that make <span className="text-secondary-200">medicine clearer.</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">
                Explore practical learning, pharmacy insights and science explained for curious minds.
              </p>
            </div>
            <a
              href="#latest-articles"
              className="inline-flex min-h-12 w-fit items-center gap-2 rounded-xl border border-white/20 bg-white px-5 py-3 font-bold text-primary-900 no-underline shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
            >
              Browse articles <Icon name="arrow-right" size="1.15rem" plain />
            </a>
          </div>
        </section>
      )}

      {loading ? (
        <p className="journal-state" aria-busy="true" aria-live="polite">Loading blog content…</p>
      ) : error ? (
        <p className="journal-state journal-state-error" role="alert">{error}</p>
      ) : !featured && posts.length === 0 ? (
        <p className="journal-state">No articles have been published yet.</p>
      ) : (
        <>
          {topics.length > 0 && (
            <section className="journal-topics" aria-label="Blog topics">
              <div className="journal-topic-list">
                {topics.map((topic) => {
                  const label = typeof topic === 'string' ? topic : topic?.label || topic?.name || '';
                  if (!label) return null;
                  return <span className="journal-topic-chip" key={label}>{label}</span>;
                })}
              </div>
              {blog?.explore_label && (
                <a href="#latest-articles" className="journal-explore">
                  {blog.explore_label}
                  <Icon name="arrow-right" size="1.1rem" plain />
                </a>
              )}
            </section>
          )}

          {featured && (
            <article>
              <header className="journal-article-header">
                <h1 className="journal-title">{featured.title}</h1>
                <div className="journal-meta">
                  {featured.category && <strong className="journal-category">{featured.category}</strong>}
                  {featured.author && <span className="journal-meta-item">By {featured.author}</span>}
                  {featured.published_at && (
                    <span className="journal-meta-item">
                      <Icon name="calendar" size="1rem" plain />
                      {formatDate(featured.published_at)}
                    </span>
                  )}
                  {featured.read_time_minutes && (
                    <span className="journal-meta-item">
                      <Icon name="clock" size="1rem" plain />
                      {featured.read_time_minutes} min read
                    </span>
                  )}
                </div>
                {hasShare && (
                  <div className="journal-share" aria-label="Share article">
                    {share.facebook && <a href={share.facebook} className="journal-share-link" aria-label="Share on Facebook"><Icon name="facebook" size="1.2rem" plain /></a>}
                    {share.x && <a href={share.x} className="journal-share-link" aria-label="Share on X"><Icon name="x-twitter" size="1.2rem" plain /></a>}
                    {share.linkedin && <a href={share.linkedin} className="journal-share-link" aria-label="Share on LinkedIn"><Icon name="linkedin" size="1.2rem" plain /></a>}
                    {share.whatsapp && <a href={share.whatsapp} className="journal-share-link" aria-label="Share on WhatsApp"><Icon name="whatsapp" size="1.2rem" plain /></a>}
                  </div>
                )}
              </header>

              <img
                src={getArticleImage(featured)}
                alt={featured.image_alt || featured.title}
                className="journal-cover"
                loading="lazy"
              />

              {(bodyParagraphs.length > 0 || bodySections.length > 0) && (
                <div className="journal-prose">
                  {bodyParagraphs.map((paragraph, index) => (
                    <p key={index} className={index === 0 ? 'journal-lead' : undefined}>{paragraph}</p>
                  ))}
                  {bodySections.map((section, index) => (
                    <section className="journal-section" key={section.id || index}>
                      {section.heading && <h2>{section.heading}</h2>}
                      {Array.isArray(section.paragraphs)
                        ? section.paragraphs.filter(Boolean).map((paragraph, paragraphIndex) => (
                            <p key={paragraphIndex}>{paragraph}</p>
                          ))
                        : section.content && <p>{section.content}</p>}
                      {Array.isArray(section.items) && section.items.length > 0 && (
                        <ul>
                          {section.items.filter(Boolean).map((item, itemIndex) => (
                            <li key={itemIndex}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </section>
                  ))}
                </div>
              )}
            </article>
          )}

          {posts.length > 0 && (
            <section id="latest-articles" className="journal-latest" aria-labelledby="latest-blog-heading">
              <h2 id="latest-blog-heading" className="journal-latest-title">
                {blog?.latest_heading || 'Latest articles'}
              </h2>
              <div className="journal-grid">
                {posts.slice(0, 3).map((post) => (
                  <article className="journal-card" key={post.id || post.slug || post.title}>
                    <img
                      src={getArticleImage(post)}
                      alt={post.image_alt || post.title}
                      className="journal-card-image"
                      loading="lazy"
                    />
                    <div className="journal-card-body">
                      {post.category && <span className="journal-card-category">{post.category}</span>}
                      <h3 className="journal-card-title">{post.title}</h3>
                      {post.published_at && (
                        <div className="journal-card-date">
                          <Icon name="calendar" size=".95rem" plain />
                          {formatDate(post.published_at)}
                        </div>
                      )}
                      {post.excerpt && <p className="journal-card-excerpt">{post.excerpt}</p>}
                      {post.slug && (
                        <a href={`/blog/${post.slug}`} className="journal-card-link">
                          {post.read_more_label || 'Read article'}
                          <Icon name="arrow-right" size="1rem" plain />
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
  );
}
