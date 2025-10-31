const MenuItem = require('../db/models/MenuItem.js');
const Permission = require('../db/models/Permission.js');

async function listActiveMenuItems() {
  const docs = await MenuItem.find({ active: true }).lean();
  return docs.map(d => ({ _id: d._id, label: d.label, url: d.url, parent: d.parent, order: d.order ?? 0 }));
}

async function getRolePermissionIds(role) {
  const docs = await Permission.find({ role, allowed: true }).select('menuItem').lean();
  return docs.map(d => d.menuItem.toString());
}

async function setRolePermissionIds(role, allowedIds = []) {
  // Replace strategy: remove all then add allowed
  await Permission.deleteMany({ role });
  if (allowedIds.length === 0) return;
  const ops = allowedIds.map(id => ({ role, menuItem: id, allowed: true }));
  await Permission.insertMany(ops, { ordered: false });
}

async function hasAccessToUrl(role, url) {
  if (role === 'admin') return true;
  const item = await MenuItem.findOne({ url }).select('_id').lean();
  if (!item) return false;
  const perm = await Permission.findOne({ role, menuItem: item._id, allowed: true }).lean();
  return !!perm;
}

module.exports = {
  listActiveMenuItems,
  getRolePermissionIds,
  setRolePermissionIds,
  hasAccessToUrl,
};
