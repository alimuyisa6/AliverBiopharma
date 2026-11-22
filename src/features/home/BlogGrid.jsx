/* features/home/BlogGrid.jsx */
import React from 'react';
import StorysetIllustration from '../../components/StorysetIllustration';

export function BlogGrid({ posts }) {
  if (!posts || !Array.isArray(posts)) return null;

  return (
    <section id="blog" className="section alt-bg reveal home-blog-section">
      
      <div className="mb-8 flex items-center justify-between gap-6">
        <div className="min-w-0">
          <h2 className="section-title">
            What Our Writers Have<br />Been Digging Into
          </h2>
          <p className="section-subtitle mt-8">
            Short reads on biology, pharmacy, and the occasional science story that caught our attention.
          </p>
        </div>
        <StorysetIllustration name="blogging" alt="Writer preparing a science article" className="hidden w-32 shrink-0 object-contain sm:block md:w-44" />
      </div>

      <div className="grid-3 home-blog-grid">
        {posts.filter(Boolean).map((post) => (
          <article key={post.title} className="card card-surface-solid card-elevation-soft card-density-comfortable card-interactive home-blog-card">
            {post.image_url && <img src={post.image_url} alt={post.title} className="home-blog-image" />}

            <div className="blog-meta">
              <span><i className="fa-regular fa-calendar" /> {post.date}</span>
              <span><i className="fa-regular fa-user" /> {post.author}</span>
            </div>

            <h3 className="blog-title">{post.title}</h3>
            <p className="blog-excerpt">{post.excerpt}</p>

            <a href="#" className="card-link-arrow">
              Keep reading <i className="fa-solid fa-arrow-right" />
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
