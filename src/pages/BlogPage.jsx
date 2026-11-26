import { useEffect, useState } from 'react';
import { useLayout } from '../contexts/LayoutContext';
import { useParams } from 'react-router-dom';
import { getSections } from '../api/sections';
import { getArticleBySlug, listArticles } from '../api/cachedClient';
import Icon from '../components/Icon/Icon';
import Card from '../components/Card/Card';
import StorysetIllustration from '../components/StorysetIllustration';

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
    <main className="blog-page min-h-screen w-full overflow-x-clip bg-primary-50 text-foreground">
      {!slug && !loading && !error && featured && (
        <section className="relative isolate overflow-hidden bg-primary-900 px-4 py-12 text-white sm:px-6 sm:py-16 lg:py-20">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full border-[36px] border-white/10" />
            <div className="absolute -bottom-36 left-[8%] h-72 w-72 rounded-full border-[28px] border-secondary-300/20" />
            <div className="absolute inset-0 bg-primary-800/30" />
          </div>
          <div className="mx-auto grid w-full max-w-7xl gap-10 md:grid-cols-[minmax(0,1fr)_minmax(15rem,22rem)] md:items-center">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-extrabold uppercase tracking-[.16em] text-blue-100">
                <Icon name="book-open-reader" size="1.15rem" plain />
                Aliver knowledge journal
              </span>
              <h1 className="mt-6 text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Ideas that make <span className="text-secondary-200">medicine clearer.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg sm:leading-8">
                Practical learning, pharmacy insights and science explained for curious minds.
              </p>
              <a href="#latest-articles" className="mt-8 inline-flex min-h-12 w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-primary-900 no-underline shadow-lg transition hover:-translate-y-0.5 hover:bg-primary-50 focus-visible:outline-white">
                Explore articles <Icon name="arrow-right" size="1.15rem" plain />
              </a>
            </div>
            {featured && (
              <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-2 shadow-2xl backdrop-blur-sm">
                <img src={getArticleImage(featured)} alt={featured.image_alt || featured.title} className="aspect-[4/3] w-full rounded-2xl object-cover" loading="lazy" />
                <div className="p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary-200">Featured reading</span>
                  <p className="mt-2 line-clamp-2 text-lg font-bold leading-snug text-white">{featured.title}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {loading ? (
        <div className="mx-auto flex min-h-64 max-w-4xl items-center justify-center px-4 py-16" aria-busy="true" aria-live="polite">
          <div className="flex items-center gap-3 rounded-2xl border border-primary-100 bg-white px-5 py-4 text-primary-800 shadow-sm">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-200 border-t-primary-700" aria-hidden="true" />
            <span className="font-semibold">Loading articles…</span>
          </div>
        </div>
      ) : error ? (
        <div className="mx-auto my-16 max-w-3xl px-4 sm:px-6" role="alert">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800 sm:p-7">
            <div className="flex items-start gap-3">
              <Icon name="alert-circle" size="1.5rem" plain />
              <div><h2 className="text-lg font-bold text-red-900">Articles unavailable</h2><p className="mt-1">{error}</p></div>
            </div>
          </div>
        </div>
      ) : !featured && posts.length === 0 ? (
        <div className="mx-auto my-16 max-w-3xl px-4 sm:px-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <StorysetIllustration name="blogging" alt="Writing and publishing an article" className="mx-auto mb-5 w-full max-w-[240px] object-contain" />
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-700"><Icon name="book-open" size="2rem" plain /></span>
            <h2 className="mt-5 text-2xl font-extrabold text-primary-900">No articles yet</h2>
            <p className="mt-2 text-slate-600">New articles and learning insights will appear here when published.</p>
          </div>
        </div>
      ) : (
        <>
          {!slug && topics.length > 0 && (
            <section className="mx-auto my-8 w-full max-w-6xl px-4 sm:px-6 lg:my-10" aria-label="Explore blog topics">
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-primary-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap justify-center gap-2">
                  {topics.map((topic) => {
                    const label = typeof topic === 'string' ? topic : topic?.label || topic?.name || '';
                    if (!label) return null;
                    return <span className="inline-flex min-h-9 items-center rounded-full border border-primary-100 bg-primary-50 px-4 py-2 text-sm font-bold text-primary-800" key={label}>{label}</span>;
                  })}
                </div>
                {blog?.explore_label && (
                  <a href="#latest-articles" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary-700 bg-primary-800 px-5 py-2.5 text-sm font-bold text-white no-underline shadow-sm transition hover:bg-primary-900">
                    {blog.explore_label}<Icon name="arrow-right" size="1rem" plain />
                  </a>
                )}
              </div>
            </section>
          )}

          {featured && (
            <article className={slug ? 'mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8' : 'mx-auto w-full max-w-5xl px-4 pb-12 sm:px-6 lg:px-8'}>
              {slug && (
                <a href="/blog" className="mb-7 inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-primary-700 no-underline transition hover:bg-primary-50 hover:text-primary-900">
                  <Icon name="arrow-left" size="1rem" plain /> Back to articles
                </a>
              )}
              <header className="mx-auto mb-7 max-w-3xl text-center">
                <h1 className="text-3xl font-black leading-tight tracking-tight text-primary-900 sm:text-4xl lg:text-5xl">{featured.title}</h1>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-500">
                  {featured.category && <span className="rounded-full bg-primary-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-800">{featured.category}</span>}
                  {featured.author && <span>By {featured.author}</span>}
                  {featured.published_at && <span className="inline-flex items-center gap-1.5"><Icon name="calendar" size="1rem" plain />{formatDate(featured.published_at)}</span>}
                  {featured.read_time_minutes && <span className="inline-flex items-center gap-1.5"><Icon name="clock" size="1rem" plain />{featured.read_time_minutes} min read</span>}
                </div>
                {hasShare && (
                  <div className="mt-5 flex items-center justify-center gap-2.5" aria-label="Share article">
                    {share.facebook && <a href={share.facebook} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 no-underline transition hover:border-primary-700 hover:bg-primary-800 hover:text-white" aria-label="Share on Facebook"><Icon name="facebook" size="1.2rem" plain /></a>}
                    {share.x && <a href={share.x} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 no-underline transition hover:border-primary-700 hover:bg-primary-800 hover:text-white" aria-label="Share on X"><Icon name="x-twitter" size="1.2rem" plain /></a>}
                    {share.linkedin && <a href={share.linkedin} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 no-underline transition hover:border-primary-700 hover:bg-primary-800 hover:text-white" aria-label="Share on LinkedIn"><Icon name="linkedin" size="1.2rem" plain /></a>}
                    {share.whatsapp && <a href={share.whatsapp} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 no-underline transition hover:border-primary-700 hover:bg-primary-800 hover:text-white" aria-label="Share on WhatsApp"><Icon name="whatsapp" size="1.2rem" plain /></a>}
                  </div>
                )}
              </header>

              <img src={getArticleImage(featured)} alt={featured.image_alt || featured.title} className="mx-auto mb-9 block max-h-[32rem] w-full rounded-3xl border border-slate-200 object-cover shadow-xl" loading="lazy" />

              {(bodyParagraphs.length > 0 || bodySections.length > 0) && (
                <div className="mx-auto w-full max-w-3xl pb-12 text-base leading-8 text-slate-700 sm:text-lg">
                  {bodyParagraphs.map((paragraph, index) => <p key={index} className={index === 0 ? 'mb-8 rounded-2xl border border-l-4 border-primary-100 border-l-primary-500 bg-primary-50 p-5 text-lg font-medium leading-8 text-primary-900 sm:p-6 sm:text-xl' : 'mb-6'}>{paragraph}</p>)}
                  {bodySections.map((section, index) => (
                    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" key={section.id || index}>
                      {section.heading && <h2 className="mb-4 border-b border-slate-100 pb-3 text-2xl font-bold leading-snug text-primary-900">{section.heading}</h2>}
                      {Array.isArray(section.paragraphs)
                        ? section.paragraphs.filter(Boolean).map((paragraph, paragraphIndex) => <p className="mb-5 last:mb-0" key={paragraphIndex}>{paragraph}</p>)
                        : section.content && <p className="mb-5 last:mb-0">{section.content}</p>}
                      {Array.isArray(section.items) && section.items.length > 0 && (
                        <ul className="mt-4 grid list-none gap-2.5 p-0">
                          {section.items.filter(Boolean).map((item, itemIndex) => <li className="relative rounded-xl bg-slate-50 py-3 pl-10 pr-4 leading-7 text-slate-800 before:absolute before:left-4 before:top-5 before:h-2 before:w-2 before:rounded-full before:bg-primary-500" key={itemIndex}>{item}</li>)}
                        </ul>
                      )}
                    </section>
                  ))}
                </div>
              )}
            </article>
          )}

          {!slug && posts.length > 0 && (
            <section id="latest-articles" className="border-y border-slate-200 bg-slate-50 px-4 py-12 sm:px-6 sm:py-16">
              <div className="mx-auto w-full max-w-6xl">
                <div className="mb-8 flex flex-col gap-2 text-center sm:mb-10">
                  <span className="text-xs font-extrabold uppercase tracking-[.18em] text-primary-600">Keep exploring</span>
                  <h2 className="text-3xl font-black tracking-tight text-primary-900 sm:text-4xl">{blog?.latest_heading || 'Latest articles'}</h2>
                  <p className="mx-auto max-w-2xl text-slate-600">Browse more ideas, practical guides and science-backed learning.</p>
                </div>
                <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-stretch gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                  {posts.slice(0, 3).map((post) => (
                    <Card className="!m-0 flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-lg" key={post.id || post.slug || post.title} media={<img src={getArticleImage(post)} alt={post.image_alt || post.title} className="aspect-[16/10] w-full object-cover" loading="lazy" />}>
                      <div className="flex flex-1 flex-col items-start gap-3 p-5 sm:p-6">
                        {post.category && <span className="inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-800">{post.category}</span>}
                        <h3 className="break-words text-xl font-bold leading-snug text-primary-900">{post.title}</h3>
                        {post.published_at && <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500"><Icon name="calendar" size=".95rem" plain />{formatDate(post.published_at)}</div>}
                        {post.excerpt && <p className="line-clamp-3 text-sm leading-6 text-slate-600">{post.excerpt}</p>}
                        {post.slug && <a href={`/blog/${post.slug}`} className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary-700 bg-primary-800 px-5 py-2.5 text-sm font-bold text-white no-underline shadow-sm transition hover:bg-primary-900 hover:shadow-md">{post.read_more_label || 'Read article'}<Icon name="arrow-right" size="1rem" plain /></a>}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
