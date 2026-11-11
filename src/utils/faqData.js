export function slugify(value = '') {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeFaqData(data) {
  const questions = Array.isArray(data?.questions) ? data.questions.filter(Boolean) : [];
  const categories = Array.isArray(data?.categories) ? data.categories.filter(Boolean) : [];
  const normalizedCategories = categories.length
    ? categories
    : [{ id: 'all', label: 'All questions', description: 'Find answers to common questions.', icon: 'fa-circle-question', tone: 'blue' }];

  return {
    hero: data?.hero || {
      eyebrow: 'HELP CENTRE',
      title: 'What can we help you with?',
      description: 'Find answers about learning, your account, courses, and using AliverBiopharm.',
      search_placeholder: 'Search questions and answers…',
    },
    categories: normalizedCategories,
    questions,
    resources: Array.isArray(data?.resources) ? data.resources.filter(Boolean) : [],
    support: data?.support || {
      title: 'Still have questions?',
      description: 'If you can’t find the answer here, our support team is ready to help.',
      button: 'Contact support',
      href: '/contact',
    },
    illustrations: data?.illustrations || {},
  };
}

export function getIllustration(illustrations, key, fallback) {
  const illustration = illustrations?.[key] || {};
  const imageUrl = illustration.image_url || illustration.url || illustration.src || fallback;
  return {
    imageUrl,
    alt: illustration.alt || illustration.image_alt || '',
  };
}

