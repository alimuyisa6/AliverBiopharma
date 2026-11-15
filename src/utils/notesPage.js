export function normalizeCurriculumResponse(data) {
  const payload = data?.node?.node ? data.node : data;
  return {
    node: payload?.node || null,
    ancestors: Array.isArray(payload?.ancestors) ? payload.ancestors : [],
    children: Array.isArray(payload?.children) ? payload.children : [],
    resourceCounts: payload?.resource_counts || {},
  };
}

export function buildCurriculumPath(context) {
  const groupId = context?.node?.group_id;
  const parts = [
    ...(context?.ancestors || []).map((item) => item.slug).filter(Boolean),
    context?.node?.slug,
  ].filter(Boolean);

  if (!groupId || !parts.length) return null;
  return `/curriculum/${encodeURIComponent(groupId)}/${parts.join('/')}`;
}

export function formatResourceCount(value) {
  const count = Number(value || 0);
  return count === 1 ? '1 note' : `${count} notes`;
}
