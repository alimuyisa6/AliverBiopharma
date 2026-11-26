import React from 'react';
import { Link } from 'react-router-dom';
import { UI } from '../../design-system';

export function BlogGrid({ posts }) {
  if (!Array.isArray(posts) || posts.length === 0) return null;

  return (
    <section id="blog" className="w-full bg-primary-50 py-12 sm:py-16">
      <div className={UI.container}>
        <header className={UI.sectionHeading}>
          <h2 className={UI.sectionHeadingTitle}>What our writers have been digging into</h2>
          <p className={UI.sectionHeadingDescription}>Short reads on biology, pharmacy, and the occasional science story that caught our attention.</p>
        </header>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.filter(Boolean).map((post) => (
            <article key={post.id || post.slug || post.title} className={UI.resourceCard}>
              {post.image_url && <img src={post.image_url} alt={post.title || ''} className={UI.resourceCardImage} loading="lazy" />}
              <div className={UI.resourceCardBody}>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-muted">
                  {post.date && <span className="inline-flex items-center gap-1.5"><i className="fa-regular fa-calendar" aria-hidden="true" />{post.date}</span>}
                  {post.author && <span className="inline-flex items-center gap-1.5"><i className="fa-regular fa-user" aria-hidden="true" />{post.author}</span>}
                </div>
                <h3 className="text-lg font-extrabold leading-snug text-primary-900">{post.title}</h3>
                {post.excerpt && <p className="text-sm leading-6 text-muted">{post.excerpt}</p>}
                <Link to={post.slug ? `/blog/${post.slug}` : '/blog'} className="mt-auto inline-flex min-h-10 items-center gap-2 text-sm font-bold text-primary-800 no-underline hover:text-primary-950">
                  Keep reading <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
