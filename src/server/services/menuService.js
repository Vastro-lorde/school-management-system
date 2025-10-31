const MenuItem = require('../db/models/MenuItem.js');
const Permission = require('../db/models/Permission.js');

function buildTree(items) {
  const byId = new Map(items.map(i => [i._id.toString(), { ...i, children: [] }]));
  const roots = [];
  for (const item of byId.values()) {
    if (item.parent) {
      const p = byId.get(item.parent.toString());
      if (p) p.children.push(item);
      else roots.push(item); // Orphaned parent, treat as root
    } else {
      roots.push(item);
    }
  }
  // sort by order within siblings
  const sortRecursive = (nodes) => {
    nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    nodes.forEach(n => sortRecursive(n.children));
  };
  sortRecursive(roots);
  return roots;
}

async function getAllActiveFlat() {
  const docs = await MenuItem.find({ active: true }).lean();
  return docs.map(d => ({
    _id: d._id,
    label: d.label,
    url: d.url,
    icon: d.icon,
    active: d.active,
    parent: d.parent,
    order: d.order ?? 0,
  }));
}

async function getMenuForRole(role) {
  // Admins see all active menu items
  const all = await getAllActiveFlat();
  if (role === 'admin') {
    return buildTree(all);
  }

  // For other roles, filter by permissions
  const permitted = await Permission.find({ role, allowed: true }).select('menuItem').lean();
  const allowedIds = new Set(permitted.map(p => p.menuItem.toString()));

  // Determine which items to include: allowed items + their ancestor chain
  const byId = new Map(all.map(i => [i._id.toString(), i]));
  const includeIds = new Set();

  function includeWithAncestors(id) {
    const key = id.toString();
    if (!byId.has(key) || includeIds.has(key)) return;
    includeIds.add(key);
    const item = byId.get(key);
    if (item.parent) includeWithAncestors(item.parent);
  }

  for (const id of allowedIds) includeWithAncestors(id);

  const filtered = all
    .filter(i => includeIds.has(i._id.toString()))
    .map(i => ({
      ...i,
      // mark items that are included only because they are ancestors (not directly permitted)
      isAncestorOnly: !allowedIds.has(i._id.toString()),
    }));
  return buildTree(filtered);
}

module.exports = {
  getMenuForRole,
};
