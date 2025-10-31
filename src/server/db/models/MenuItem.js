const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  label: { type: String, required: true },
  url: { type: String },
  icon: { type: String },
  active: { type: Boolean, default: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', default: null },
  order: { type: Number, default: 0 },
}, { timestamps: true });

// Helpful indexes for ordering and fetching by parent
MenuItemSchema.index({ parent: 1, order: 1 });
MenuItemSchema.index({ label: 1 }, { unique: false });

// Virtual children relation for easy population when needed
MenuItemSchema.virtual('children', {
  ref: 'MenuItem',
  localField: '_id',
  foreignField: 'parent',
});

module.exports = mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema);
