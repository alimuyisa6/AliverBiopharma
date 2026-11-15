import DOMPurify from 'dompurify';

const biologyTerms = [
  'active transport', 'aerobic respiration', 'anaerobic respiration', 'cell membrane',
  'cell wall', 'food chain', 'food web', 'natural selection', 'selective breeding',
  'sexual reproduction', 'asexual reproduction', 'root hair cells', 'root hair cell',
  'guard cells', 'guard cell', 'red blood cells', 'white blood cells', 'nerve cells',
  'nerve cell', 'nerve impulse', 'blood vessels', 'blood plasma', 'small intestine',
  'large intestine', 'surface area', 'gas exchange', 'water potential', 'cell division',
  'cellular respiration', 'protein synthesis', 'genetic variation', 'trophic level',
  'ecological succession', 'carrying capacity', 'homeostasis', 'photosynthesis',
  'transpiration', 'translocation', 'fertilisation', 'pollination', 'germination',
  'respiration', 'diffusion', 'osmosis', 'chlorophyll', 'chloroplast', 'mitochondria',
  'cytoplasm', 'nucleus', 'ribosome', 'vacuole', 'epidermis', 'endodermis',
  'vascular tissue', 'vascular bundle', 'xylem', 'phloem', 'stomata', 'stoma',
  'lignin', 'enzyme', 'enzymes', 'catalyst', 'substrate', 'haemoglobin', 'antibody',
  'antibodies', 'antigen', 'pathogen', 'immunity', 'neuron', 'neurone', 'synapse',
  'hormone', 'insulin', 'glucagon', 'nephron', 'filtration', 'excretion', 'alveoli',
  'diaphragm', 'ventilation', 'ecosystem', 'habitat', 'population', 'community',
  'producer', 'consumer', 'decomposer', 'biodiversity', 'adaptation', 'variation',
  'allele', 'gene', 'chromosome', 'genotype', 'phenotype', 'dominant', 'recessive',
  'mitosis', 'meiosis', 'zygote', 'embryo', 'DNA', 'RNA', 'mutation', 'mineral ions',
  'transpiration pull', 'capillarity', 'cohesion', 'evaporation', 'condensation',
  'nutrition', 'assimilation', 'egestion', 'ingestion', 'digestion', 'absorption',
  'reabsorption', 'reflex action', 'reflex arc', 'receptor', 'effector', 'stimulus',
  'response', 'vaccination', 'phagocytosis', 'antibiotic', 'antibiotics'
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const orderedTerms = [...new Set(biologyTerms)].sort((a, b) => b.length - a.length);
const termPattern = new RegExp(
  '(^|[^\\p{L}\\p{N}])(' + orderedTerms.map(escapeRegex).join('|') + ')(?=$|[^\\p{L}\\p{N}])',
  'giu'
);
const excludedTags = 'a,code,pre,script,style,textarea,button';

export function highlightBiologyTerms(html) {
  if (!html || typeof document === 'undefined') return html || '';

  const template = document.createElement('template');
  template.innerHTML = DOMPurify.sanitize(String(html), { USE_PROFILES: { html: true } });
  const seenTerms = new Set();
  const containers = template.content.querySelectorAll('p, li, td, blockquote');

  containers.forEach(container => {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (!parent || parent.closest('.term-bubble') || parent.closest(excludedTags)) continue;
      if (node.nodeValue.trim()) textNodes.push(node);
    }

    textNodes.forEach(node => {
      const source = node.nodeValue;
      const expression = new RegExp(termPattern.source, termPattern.flags);
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let match;
      let changed = false;

      while ((match = expression.exec(source)) !== null) {
        const key = match[2].toLocaleLowerCase();
        if (seenTerms.has(key)) continue;
        const termStart = match.index + match[1].length;
        const termEnd = termStart + match[2].length;
        fragment.append(document.createTextNode(source.slice(lastIndex, termStart)));
        const bubble = document.createElement('span');
        bubble.className = 'term-bubble';
        bubble.textContent = source.slice(termStart, termEnd);
        fragment.append(bubble);
        lastIndex = termEnd;
        seenTerms.add(key);
        changed = true;
      }

      if (changed) {
        fragment.append(document.createTextNode(source.slice(lastIndex)));
        node.replaceWith(fragment);
      }
    });
  });

  return DOMPurify.sanitize(template.innerHTML, { USE_PROFILES: { html: true } });
}
