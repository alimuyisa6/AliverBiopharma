/* pages/BlogPage.jsx */
import { useEffect, useState } from 'react';
import { useLayout } from '../contexts/LayoutContext';
import { getSections } from '../api/sections';

const fallbackPosts = [
  {
    title: 'Building the Skills for a Career in Modern Biopharmaceutical Science',
    date: 'Jun 10, 2026',
    author: 'AliverBiopharm Editorial Team',
    excerpt: 'Explore the scientific, technical, and professional capabilities that can help learners prepare for opportunities across the biopharmaceutical sector.',
    image_url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=900&q=80',
    category: 'Career Development',
  },
  {
    title: 'Understanding the Role of Clinical Research in Modern Medicine',
    date: 'Jun 15, 2026',
    author: 'AliverBiopharm Editorial Team',
    excerpt: 'Learn how clinical research contributes to the evaluation of medicines, therapies, and healthcare interventions before wider patient use.',
    image_url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=80',
    category: 'Clinical Research',
  },
  {
    title: 'Emerging Directions in mRNA Therapeutics and Precision Medicine',
    date: 'Jun 20, 2026',
    author: 'AliverBiopharm Editorial Team',
    excerpt: 'Examine how mRNA technology and precision medicine are contributing to new approaches in therapeutic development and patient care.',
    image_url: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=900&q=80',
    category: 'Pharmaceutical Science',
  },
];

export default function BlogPage() {
  const { level } = useLayout();
  const [sections, setSections] = useState({});

  useEffect(() => {
    if (level?.id) {
      getSections(level.id).then(setSections).catch(() => {});
    }
  }, [level]);

  const posts = Array.isArray(sections?.blog?.posts) && sections.blog.posts.length
    ? sections.blog.posts.filter(Boolean)
    : fallbackPosts;

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
        <section className="blog-topic-area" aria-label="Blog topics">
          <div className="blog-topic-buttons">
            <button type="button" className="blog-topic-button">🧬 Research &amp; Development</button>
            <button type="button" className="blog-topic-button">🔬 Clinical Research</button>
            <button type="button" className="blog-topic-button">💊 Pharmaceutical Science</button>
          </div>
          <button type="button" className="blog-explore-button">
            Explore Biopharmaceutical Insights
          </button>
        </section>

        <article>
          <header className="blog-article-header">
            <h1>Biopharmaceutical Research: Key Developments and Industry Outlook for 2026</h1>
            <div className="blog-article-meta">
              <strong>ALIVER IN ACTION</strong> · by AliverBiopharm Editorial Team · Jun 3, 2026
            </div>

            <div className="blog-share" aria-label="Share article">
              <a href="#" className="blog-share-link" aria-label="Share on Facebook">f</a>
              <a href="#" className="blog-share-link" aria-label="Share on X">X</a>
              <a href="#" className="blog-share-link" aria-label="Share on LinkedIn">in</a>
              <a href="#" className="blog-share-link" aria-label="Share on WhatsApp">W</a>
            </div>
          </header>

          <img
            src="https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80"
            alt="Biopharmaceutical laboratory research"
            className="blog-featured-image"
          />

          <div className="blog-article-body">
            <p>
              Biopharmaceutical research remains one of the most dynamic areas of modern life science.
              In 2026, advances in drug development, personalized medicine, biotechnology, and artificial
              intelligence continue to influence how new therapies are researched, developed, evaluated,
              and delivered to patients.
            </p>

            <p>
              As the industry becomes increasingly data driven, professionals across research, clinical
              development, pharmaceutical science, quality assurance, and regulatory affairs require a
              combination of scientific knowledge, digital competence, and strong documentation practices.
            </p>

            <h2>Building Core Skills for Biopharmaceutical Careers</h2>

            <p>
              Professionals entering biopharmaceutical research benefit from developing a strong
              foundation in scientific principles together with practical workplace skills. These
              capabilities support accurate laboratory work, reliable data handling, effective
              communication, and compliance with established quality standards.
            </p>

            <p>Important professional capabilities include:</p>

            <ul>
              <li>Scientific data analysis and interpretation</li>
              <li>Accurate laboratory documentation and record keeping</li>
              <li>Foundational molecular biology and pharmaceutical science</li>
              <li>Clinical research and data management principles</li>
              <li>Scientific writing and professional communication</li>
              <li>Good Laboratory Practice and Good Manufacturing Practice</li>
              <li>Regulatory science and pharmaceutical compliance</li>
            </ul>

            <h2>Technology Shaping Modern Biopharmaceutical Practice</h2>

            <p>
              Digital systems now support many stages of pharmaceutical and clinical research.
              Laboratory Information Management Systems, electronic data capture platforms, statistical
              software, and artificial intelligence tools are increasingly integrated into scientific
              workflows.
            </p>

            <p>
              Developing familiarity with these technologies can help learners understand how scientific
              information moves from experimental work and clinical research into structured datasets,
              analysis, documentation, and regulatory decision making.
            </p>

            <p>
              AliverBiopharm's educational resources are designed to introduce learners to important
              concepts in biology, pharmacy, biopharmaceutical science, clinical research, and related
              professional fields.
            </p>

            <p>
              Our goal is to make high quality scientific education accessible to students, career
              starters, and professionals who want to strengthen their understanding of modern biology
              and pharmacy.
            </p>
          </div>
        </article>

        <section className="blog-latest" aria-labelledby="latest-blog-heading">
          <h2 id="latest-blog-heading">Latest Biopharmaceutical Insights</h2>

          <div className="blog-posts-grid">
            {posts.slice(0, 3).map((post, index) => (
              <article className="blog-post-card" key={post.title || index}>
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt={post.title || 'AliverBiopharm article'}
                    className="blog-post-image"
                    loading="lazy"
                  />
                )}

                <div className="blog-post-content">
                  <span className="blog-post-category">
                    {post.category || 'Biopharmaceutical Science'}
                  </span>

                  <h3 className="blog-post-title">
                    {post.title}
                  </h3>

                  <div className="blog-post-date">
                    {post.date || 'AliverBiopharm Editorial'}
                  </div>

                  <p className="blog-post-excerpt">
                    {post.excerpt || 'Explore biology, pharmacy, clinical research, and biopharmaceutical science through AliverBiopharm.'}
                  </p>

                  <a href="#" className="blog-read-more">
                    Read More
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
