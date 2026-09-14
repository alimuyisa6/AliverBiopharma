 import Icon from '../../components/Icon/Icon';
import Button from '../../components/Button/Button';
import { useLayout } from '../../contexts/LayoutContext';

const CONTENT_TYPES = [
  {
    key: 'notes',
    label: 'Notes',
    description: 'Structured topic notes with diagrams and summaries',
    icon: 'book-open',
    route: '/notes',
    color: 'blue'
  },
  {
    key: 'flashcards',
    label: 'Flashcards',
    description: 'Active recall with flip, typed, and MCQ modes',
    icon: 'layer-group',
    route: '/flashcards',
    color: 'teal'
  },
  {
    key: 'pdfs',
    label: 'PDF Library',
    description: 'Downloadable guides and reference sheets',
    icon: 'file-pdf',
    route: '/pdfs',
    color: 'grey'
  },
  {
    key: 'quizzes',
    label: 'Quizzes',
    description: 'Block-by-block testing across every unit',
    icon: 'clipboard-check',
    route: '/quiz',
    color: 'amber'
  },
  {
    key: 'past_papers',
    label: 'Past Papers',
    description: 'Real exam papers by year and board',
    icon: 'file-lines',
    route: '/past-papers',
    color: 'emerald'
  },
  {
    key: 'recall',
    label: 'Recall',
    description: 'Spaced repetition for lasting memory',
    icon: 'brain',
    route: '/recall',
    color: 'blue'
  }
];

export default function ResourcesView({ navigate, user, sections }) {
  const { bootstrap } = useLayout();
  const uiComponents = bootstrap?.ui_components || [];

  function getImage(key) {
    const component = uiComponents.find(
      (item) => item.component_key === `content_type_${key}`
    );

    return component?.properties?.image_url || null;
  }

  return (
    <div className="resources-page">
      <style>{`
        .resources-page {
          width: 100%;
        }

        .resources-hero {
          padding-bottom: var(--space-8);
        }

        .resources-hero h1 {
          margin-bottom: var(--space-4);
          line-height: 1.12;
        }

        .resources-hero .section-subtitle {
          max-width: 760px;
          margin: 0;
          line-height: 1.6;
        }

        .resources-grid-section {
          padding-top: var(--space-4);
        }

        .resources-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-6);
          align-items: stretch;
        }

        .resource-card {
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow: hidden;
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
        }

        .resource-card-image {
          width: 100%;
          height: 190px;
          overflow: hidden;
          background: var(--bg-card-hover);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .resource-card-image img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .resource-card-image > svg,
        .resource-card-image > .icon {
          font-size: var(--text-3xl);
          color: var(--text-muted);
        }

        .resource-card-body {
          display: flex;
          flex-direction: column;
          flex: 1;
          padding: var(--space-4);
          gap: var(--space-2);
        }

        .resource-card-title {
          font-size: var(--text-lg);
          line-height: 1.3;
          font-weight: var(--weight-bold);
          color: var(--text-main);
        }

        .resource-card-desc {
          font-size: var(--text-sm);
          line-height: 1.55;
          color: var(--text-dim);
        }

        .resource-card-actions {
          display: flex;
          align-items: center;
          padding: 0 var(--space-4) var(--space-4);
        }

        .resource-card-actions .button {
          min-height: 38px;
        }

        @media (max-width: 1024px) {
          .resources-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: var(--space-5);
          }
        }

        @media (max-width: 640px) {
          .resources-hero {
            padding-bottom: var(--space-6);
          }

          .resources-hero h1 {
            font-size: var(--text-3xl);
          }

          .resources-hero .section-subtitle {
            font-size: var(--text-base);
            line-height: 1.55;
          }

          .resources-grid {
            grid-template-columns: 1fr;
            gap: var(--space-4);
          }

          .resource-card-image {
            height: 170px;
          }

          .resource-card-body {
            padding: var(--space-4);
          }
        }
      `}</style>

      <section className="section resources-hero">
        <span className="eyebrow">Resources</span>

        <h1>
          Choose The Best Of You and <br />
          <span style={{ display: 'inline-block', marginTop: '8px' }}>
            Start Learning.
          </span>
        </h1>

        <p className="section-subtitle">
          {sections?.section_headings?.content_types_subtitle ||
            'Notes, flashcards, quizzes, past papers and recall — everything you need, all in one place.'}
        </p>
      </section>

      <section className="section resources-grid-section">
        <div className="resources-grid">
          {CONTENT_TYPES.map((type) => {
            const imageUrl = getImage(type.key);

            return (
              <div
                key={type.key}
                className={`resource-card resource-card-${type.color}`}
              >
                <div className="resource-card-image">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={type.label}
                      loading="lazy"
                    />
                  ) : (
                    <Icon name={type.icon} />
                  )}
                </div>

                <div className="resource-card-body">
                  <div className="resource-card-title">
                    {type.label}
                  </div>

                  <div className="resource-card-desc">
                    {type.description}
                  </div>
                </div>

                <div className="resource-card-actions">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      navigate(user ? type.route : '/login')
                    }
                  >
                    Browse
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
