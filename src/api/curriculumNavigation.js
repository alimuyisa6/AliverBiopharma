import { getRequest } from './client';

export function getCurriculumNode(unitId) {
  return getRequest('curriculum-navigation', 'node', {
    unit_id: unitId
  });
}

export function getCurriculumNodeByPath(groupId, path) {
  return getRequest('curriculum-navigation', 'node_by_path', {
    group_id: groupId,
    path
  });
}

export function getCurriculumTree(groupId) {
  return getRequest('curriculum-navigation', 'tree', {
    group_id: groupId
  });
}
