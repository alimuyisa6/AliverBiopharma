const illustrations = {
  achievement: 'Achievement-rafiki.svg',
  blogging: 'Blogging-rafiki.svg',
  chatbot: 'Chat bot-rafiki.svg',
  chat: 'Chat-rafiki.svg',
  marketing: 'Marketing-rafiki.svg',
  medicalResearch: 'Medical research-rafiki.svg',
  onlineLearning: 'Online learning-rafiki (3).svg',
  onlineTest: 'Online test-rafiki.svg',
  personalGoals: 'Personal goals-rafiki.svg',
  studying: 'Studying-rafiki.svg',
  teaching: 'Teaching-rafiki.svg',
  workInProgress: 'Work in progress-rafiki.svg',
};

export default function StorysetIllustration({ name, alt = '', className = '', loading = 'lazy' }) {
  const filename = illustrations[name];
  if (!filename) return null;

  return (
    <img
      src={`/Svg%20illustrations/${encodeURIComponent(filename)}`}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      {...(alt ? {} : { 'aria-hidden': true })}
    />
  );
}

export { illustrations as storysetIllustrations };
