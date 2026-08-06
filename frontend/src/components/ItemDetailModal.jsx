import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, Check, Trash2 } from 'lucide-react';
import { getItemMetadata, updateItemMetadata, updateItemCategory, getOutfitSuggestions, deleteItem } from '../lib/api.js';

const SEASON_OPTIONS = ['spring', 'summer', 'fall', 'winter', 'all seasons'];

const CLOTHING_TAXONOMY = {
  top: ['t-shirt', 'blouse', 'sweater', 'hoodie', 'blazer', 'jacket'],
  bottom: ['jeans', 'trousers', 'shorts', 'skirt'],
  dress: ['casual dress', 'formal dress'],
  'eastern wear': ['shalwar kameez', 'kurta'],
  other: [],
};

const CATEGORY_OPTIONS = Object.keys(CLOTHING_TAXONOMY);

export default function ItemDetailModal({ item, onClose, onDeleted, onUpdated }) {
  const [metadata, setMetadata] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({});
  const [pairsWith, setPairsWith] = useState([]);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
  if (!item) return;

  // Reset modal state when opening a different item
  setConfirmingDelete(false);
  setIsEditing(false);
  setDeleting(false);

  getItemMetadata(item.id)
      .then((data) => {
        setMetadata(data);
        setForm({
          color: data.color || '',
          season: data.season || [],
          notes: data.notes || '',
          category: item.category || '',
          subcategory: item.subcategory || '',
        });
      })
      .catch((err) => console.error('Failed to load metadata', err));

    getOutfitSuggestions()
      .then((data) => {
        const outfits = data.outfits || [];
        const matches = [];

        outfits.forEach((outfit) => {
          if (outfit.type === 'top_bottom') {
            if (outfit.top?.id === item.id) matches.push(outfit.bottom);
            if (outfit.bottom?.id === item.id) matches.push(outfit.top);
          }
        });

        const seen = new Set();

        const unique = matches.filter((m) => {
          if (!m || seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });

        setPairsWith(unique);
      })
      .catch((err) => console.error('Failed to load pairs-with', err));
  }, [item]);

  const toggleSeason = (season) => {
    setForm((prev) => ({
      ...prev,
      season: prev.season.includes(season)
        ? prev.season.filter((s) => s !== season)
        : [...prev.season, season],
    }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const normalizedColor = form.color.trim().toLowerCase();

      const updated = await updateItemMetadata(item.id, {
        color: normalizedColor,
        season: form.season,
        notes: form.notes,
      });

      await updateItemCategory(item.id, {
        category: form.category,
        subcategory: form.subcategory,
      });

      setMetadata(updated);
      setIsEditing(false);

      onUpdated?.(item.id, {
        color: normalizedColor,
        category: form.category,
        subcategory: form.subcategory,
      });
    } catch (err) {
      console.error('Failed to save metadata', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      await deleteItem(item.id);
      onDeleted?.(item.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete item', err);
    } finally {
      setDeleting(false);
    }
  };

  if (!item) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        style={{
          backgroundColor: 'rgba(186, 162, 138, 0.28)',
          backdropFilter: 'blur(8px)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden relative max-h-[85vh] overflow-y-auto"
          initial={{ scale: 0.3, rotateY: 0, opacity: 0 }}
          animate={{ scale: 1, rotateY: 360, opacity: 1 }}
          exit={{ scale: 0.3, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/90 rounded-full hover:bg-stone-100 transition"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2"
          >
            {/* IMAGE */}
            <div className="bg-stone-100 flex items-center justify-center p-8">
              <img
                src={item.image_url}
                alt={item.subcategory || item.category}
                className="max-h-80 max-w-full object-contain"
              />
            </div>

            {/* DETAILS */}
            <div className="p-6 flex flex-col gap-5">

              {/* TITLE */}
              <div className="flex items-start justify-between pr-12">
                <div>
                  <p className="text-xs font-semibold text-[#8B6B4A] uppercase tracking-wider mb-1">
                    {item.category}
                  </p>

                  <h2 className="font-display text-2xl font-bold text-neutral-900 capitalize">
                    {item.subcategory || item.category}
                  </h2>
                </div>
              </div>

              {/* DELETE CONFIRMATION */}
              {confirmingDelete && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                  <p className="text-red-700 mb-2">
                    Delete this item permanently?
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="flex-1 border border-neutral-300 text-neutral-700 text-xs font-medium py-1.5 rounded-lg hover:bg-white transition"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 bg-red-600 text-white text-xs font-medium py-1.5 rounded-lg hover:bg-red-700 transition disabled:opacity-60"
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              )}

              {/* NORMAL VIEW / EDIT VIEW */}
              {!isEditing ? (
                <div className="space-y-3 text-sm">

                  <div className="flex justify-between py-2 border-b border-neutral-100">
                    <span className="text-neutral-500">Color</span>
                    <span className="font-medium text-neutral-800 capitalize">
                      {metadata?.color || 'Not specified'}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-neutral-100">
                    <span className="text-neutral-500">Best time to wear</span>
                    <span className="font-medium text-neutral-800 capitalize">
                      {metadata?.season?.length
                        ? metadata.season.join(', ')
                        : 'Not specified'}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-neutral-100">
                    <span className="text-neutral-500">Date added</span>
                    <span className="font-medium text-neutral-800">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString()
                        : 'Not specified'}
                    </span>
                  </div>

                  <div className="py-2 border-b border-neutral-100">
                    <span className="text-neutral-500 block mb-1">
                      Notes
                    </span>

                    <span className="font-medium text-neutral-400 italic">
                      {metadata?.notes || 'Add a note'}
                    </span>
                  </div>

                  {/* PAIRS WITH */}
                  {pairsWith.length > 0 && (
                    <div className="pt-2">
                      <span className="text-neutral-500 block mb-2">
                        Pairs well with
                      </span>

                      <div className="flex gap-2 overflow-x-auto">
                        {pairsWith.map((pair) => (
                          <div
                            key={pair.id}
                            className="flex-shrink-0 w-16"
                          >
                            <img
                              src={pair.image_url}
                              alt={pair.subcategory || pair.category}
                              className="w-16 h-16 object-contain bg-stone-100 rounded-lg"
                            />

                            <p className="text-xs text-center mt-1 truncate capitalize">
                              {pair.subcategory || pair.category}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* EDIT FORM */
                <div className="space-y-3">

                  <FormField label="Category">
                    <select
                      value={form.category}
                      onChange={(e) => {
                        const newCategory = e.target.value;
                        const validSubs = CLOTHING_TAXONOMY[newCategory] || [];
                        setForm({
                          ...form,
                          category: newCategory,
                          subcategory: validSubs.includes(form.subcategory)
                            ? form.subcategory
                            : (validSubs[0] || ''),
                        });
                      }}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-[#A67C52]"
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat} className="capitalize">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Subcategory">
                    <select
                      value={form.subcategory}
                      onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                      disabled={(CLOTHING_TAXONOMY[form.category] || []).length === 0}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-[#A67C52] disabled:opacity-50"
                    >
                      {(CLOTHING_TAXONOMY[form.category] || []).length === 0 ? (
                        <option value="">No subcategories</option>
                      ) : (
                        CLOTHING_TAXONOMY[form.category].map((sub) => (
                          <option key={sub} value={sub} className="capitalize">
                            {sub}
                          </option>
                        ))
                      )}
                    </select>
                  </FormField>

                  <FormField label="Color">
                    <input
                      type="text"
                      value={form.color}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          color: e.target.value,
                        })
                      }
                      placeholder="e.g. navy blue"
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A67C52]"
                    />
                  </FormField>

                  <FormField label="Best time to wear">
                    <div className="flex flex-wrap gap-1.5">
                      {SEASON_OPTIONS.map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => toggleSeason(s)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition ${
                            form.season.includes(s)
                              ? 'bg-[#8B6B4A] text-white'
                              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </FormField>

                  <FormField label="Notes">
                    <textarea
                      value={form.notes}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          notes: e.target.value,
                        })
                      }
                      placeholder="e.g. gift from mom, dry clean only"
                      rows={2}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#A67C52]"
                    />
                  </FormField>

                  {/* SAVE / CANCEL */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 border border-neutral-300 text-neutral-700 py-2 rounded-lg text-sm font-medium hover:bg-neutral-50 transition"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 bg-[#8B6B4A] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#70553A] transition disabled:opacity-60"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              )}

              {/* EDIT + DELETE BUTTONS */}
              {!isEditing && (
                <div className="flex justify-end gap-2 mt-auto pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-neutral-400 hover:text-[#8B6B4A] rounded-full hover:bg-stone-100 transition"
                    title="Edit details"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className="p-2 text-neutral-400 hover:text-red-600 rounded-full hover:bg-red-50 transition"
                    title="Delete item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}

            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}