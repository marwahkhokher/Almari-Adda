import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, AlertCircle, ArrowLeft, Pencil, Save, Loader2 } from 'lucide-react';

import {
  uploadClothingItem,
  getItemMetadata,
  updateItemMetadata,
  updateItemCategory,
} from '../lib/api.js';

const BG_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cg transform='rotate(-10 100 100)' fill='none' stroke='%23D4537E' stroke-width='2'%3E%3Cpath d='M28 18l-8 6-8-6-8 6v8l8-2v22h16V26l8 2v-8z'/%3E%3Cg transform='translate(90 10)'%3E%3Cpath d='M2 2h26v14l-6 2v50h-6V34l-2 2-2-2v34h-6V18l-6-2z'/%3E%3C/g%3E%3Cg transform='translate(20 100)'%3E%3Cpath d='M2 20c0-10 8-18 18-18s18 8 18 18H2z'/%3E%3Cellipse cx='20' cy='20' rx='24' ry='4'/%3E%3C/g%3E%3Cg transform='translate(110 105)'%3E%3Ccircle cx='8' cy='10' r='8'/%3E%3Ccircle cx='32' cy='10' r='8'/%3E%3Cpath d='M16 10h8M0 8l-6-4M40 8l6-4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")";

const SEASON_OPTIONS = ['spring', 'summer', 'fall', 'winter'];

const CLOTHING_TAXONOMY = {
  top: ['t-shirt', 'blouse', 'sweater', 'hoodie', 'blazer', 'jacket'],
  bottom: ['jeans', 'trousers', 'shorts', 'skirt'],
  dress: ['casual dress', 'formal dress'],
  'eastern wear': ['shalwar kameez', 'kurta'],
  other: [],
};

const CATEGORY_OPTIONS = Object.keys(CLOTHING_TAXONOMY);

export default function UploadScreen() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [metadata, setMetadata] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editCategory, setEditCategory] = useState('');
  const [editSubcategory, setEditSubcategory] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editSeasons, setEditSeasons] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG).');
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setError(null);
    setResult(null);
    setMetadata(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const response = await uploadClothingItem(file);

      setResult(response);

      if (response.item?.id) {
        const meta = await getItemMetadata(response.item.id);
        setMetadata(meta);

        setEditCategory(response.item.category || '');
        setEditSubcategory(response.item.subcategory || '');
        setEditColor(response.color || meta?.color || '');
        setEditSeasons(response.season || meta?.season || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload item. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setMetadata(null);
    setError(null);
    setIsEditing(false);
    setSaveError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleSeason = (season) => {
    setEditSeasons((prev) =>
      prev.includes(season)
        ? prev.filter((s) => s !== season)
        : [...prev, season]
    );
  };

  const handleSaveEdits = async () => {
    if (!result?.item?.id) return;

    setSaving(true);
    setSaveError(null);

    try {
      const updatedItem = await updateItemCategory(result.item.id, {
        category: editCategory,
        subcategory: editSubcategory,
      });

      const normalizedColor = editColor.trim().toLowerCase();

      const updatedMeta = await updateItemMetadata(result.item.id, {
        color: normalizedColor,
        season: editSeasons,
      });

      setResult((prev) => ({
        ...prev,
        item: { ...prev.item, ...updatedItem },
        color: editColor,
        season: editSeasons,
      }));
      setMetadata(updatedMeta);
      setIsEditing(false);
    } catch (err) {
      setSaveError(err.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatSeason = (season) => {
    if (!season || season.length === 0) {
      return 'All seasons';
    }

    return season
      .map((s) => String(s).replace(/_/g, ' '))
      .join(', ');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-white flex flex-col relative overflow-hidden"
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.14]"
        style={{
          backgroundImage: BG_PATTERN,
          backgroundSize: '200px 200px',
        }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-200 relative z-10 bg-white">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-neutral-500 hover:text-pink-600 transition-colors rounded-full hover:bg-pink-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <span className="font-display text-lg font-bold text-neutral-900">
          Upload item
        </span>
      </div>

      <main className="flex-1 w-full max-w-5xl mx-auto p-6 flex flex-col items-center justify-center relative z-10">

        {/* ================= EMPTY STATE ================= */}
        {!preview && !result && (
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <h1 className="font-display text-2xl font-bold text-neutral-900 mb-2">
                Add a new item
              </h1>

              <p className="text-sm text-neutral-500">
                Snap a photo of any clothing item and we'll handle the rest.
              </p>
            </div>

            <div
              className={`w-full border-2 border-dashed rounded-2xl p-12 md:p-20 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 backdrop-blur-xl shadow-lg ${
                isDragging
                  ? 'border-pink-500 bg-pink-100/60'
                  : 'border-pink-400 bg-pink-50/50 hover:border-pink-500 hover:bg-pink-100/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="w-16 h-16 rounded-2xl bg-pink-100 flex items-center justify-center mb-4 text-pink-600">
                <Upload className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-bold text-neutral-900 mb-2 text-center font-display">
                Drag and drop or click to upload
              </h3>

              <p className="text-xs text-neutral-500 text-center">
                Supports JPG, PNG photos
              </p>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                capture="environment"
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-8">
              <div className="text-center">
                <div className="w-9 h-9 rounded-lg bg-pink-100 flex items-center justify-center mx-auto mb-2">
                  <span className="text-xs font-bold text-pink-700">1</span>
                </div>

                <p className="text-xs font-medium text-neutral-900">
                  Upload a photo
                </p>

                <p className="text-[11px] text-neutral-400 mt-0.5">
                  One item at a time
                </p>
              </div>

              <div className="text-center">
                <div className="w-9 h-9 rounded-lg bg-pink-100 flex items-center justify-center mx-auto mb-2">
                  <span className="text-xs font-bold text-pink-700">2</span>
                </div>

                <p className="text-xs font-medium text-neutral-900">
                  We tag it
                </p>

                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Background removed, categorized
                </p>
              </div>

              <div className="text-center">
                <div className="w-9 h-9 rounded-lg bg-pink-100 flex items-center justify-center mx-auto mb-2">
                  <span className="text-xs font-bold text-neutral-900">3</span>
                </div>

                <p className="text-xs font-medium text-neutral-900">
                  It's in your closet
                </p>

                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Ready for outfits
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= PREVIEW STATE ================= */}
        {preview && !result && (
          <div className="w-full max-w-lg flex flex-col items-center gap-6">

            <div className="relative w-full aspect-[3/4] max-h-[480px] rounded-2xl overflow-hidden bg-white border border-neutral-200 shadow-md">

              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-contain p-3"
              />

              {uploading && (
                <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center backdrop-blur-md z-10">
                  <div className="w-10 h-10 border-2 border-pink-200 border-t-pink-600 rounded-full animate-spin mb-4" />

                  <div className="text-center">
                    <p className="text-neutral-900 font-semibold text-sm">
                      Analyzing your item...
                    </p>

                    <p className="text-neutral-500 text-xs mt-1">
                      Detecting category, color, style, and other details...
                    </p>
                  </div>
                </div>
              )}

            </div>

            {!uploading && (
              <div className="w-full">

                <p className="text-center text-xs text-neutral-500 mb-4">
                  {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </p>

                <div className="flex gap-3">

                  <button
                    onClick={resetState}
                    className="flex-1 border border-neutral-300 text-neutral-700 font-medium text-sm py-2.5 rounded-lg hover:bg-neutral-50 transition"
                  >
                    Change
                  </button>

                  <button
                    onClick={handleUpload}
                    className="flex-1 bg-pink-600 text-white font-medium text-sm py-2.5 rounded-lg hover:bg-pink-700 transition"
                  >
                    Upload photo
                  </button>

                </div>

              </div>
            )}

          </div>
        )}

        {/* ================= RESULT STATE ================= */}
        {result && result.item && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full flex flex-col items-center gap-6"
          >

            {/* Item image */}
            <div className="w-full aspect-square max-h-[400px] rounded-2xl overflow-hidden bg-white border border-pink-200 shadow-md relative p-4 flex items-center justify-center">

              <img
                src={result.item.image_url || preview}
                alt="Uploaded item"
                className="max-h-full max-w-full object-contain"
              />

              <div className="absolute top-4 right-4 bg-pink-100 text-pink-700 rounded-full p-1.5">
                <CheckCircle className="w-5 h-5" />
              </div>

            </div>

            {/* Information */}
            <div className="w-full bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">

              <div className="grid grid-cols-1 md:grid-cols-2">

                {/* LEFT */}
                <div className="p-6 border-b md:border-b-0 md:border-r border-neutral-200">

                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-pink-600">
                      Item details
                    </p>

                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1 text-xs font-medium text-pink-600 hover:text-pink-700"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditing(false)}
                        className="text-xs font-medium text-neutral-500 hover:text-neutral-700"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {!isEditing ? (
                    <div className="space-y-4">

                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-neutral-400">
                          Category
                        </p>

                        <p className="mt-1 text-sm font-semibold text-neutral-900 capitalize">
                          {result.item.category || '—'}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-neutral-400">
                          Subcategory
                        </p>

                        <p className="mt-1 inline-block capitalize text-xs font-semibold bg-pink-100 text-pink-700 px-2.5 py-1 rounded-full">
                          {result.item.subcategory || '—'}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-neutral-400">
                          Color
                        </p>

                        <p className="mt-1 text-sm font-semibold text-neutral-900 capitalize">
                          {result.color || metadata?.color || '—'}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-neutral-400">
                          Date added
                        </p>

                        <p className="mt-1 text-sm font-semibold text-neutral-900">
                          {formatDate(
                            result.date_added ||
                              result.item.created_at ||
                              metadata?.created_at
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-neutral-400">
                          Best time to wear
                        </p>

                        <p className="mt-1 text-sm font-semibold text-neutral-900 capitalize">
                          {formatSeason(result.season || metadata?.season)}
                        </p>
                      </div>

                    </div>
                  ) : (
                    <div className="space-y-4">

                      <div>
                        <label className="text-[10px] uppercase tracking-wide text-neutral-400">
                          Category
                        </label>
                        <select
                          value={editCategory}
                          onChange={(e) => {
                            const newCategory = e.target.value;
                            setEditCategory(newCategory);
                            const validSubs = CLOTHING_TAXONOMY[newCategory] || [];
                            if (!validSubs.includes(editSubcategory)) {
                              setEditSubcategory(validSubs[0] || '');
                            }
                          }}
                          className="mt-1 w-full rounded-lg bg-neutral-50 px-3 py-2 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm capitalize"
                        >
                          {CATEGORY_OPTIONS.map((cat) => (
                            <option key={cat} value={cat} className="capitalize">
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-wide text-neutral-400">
                          Subcategory
                        </label>
                        <select
                          value={editSubcategory}
                          onChange={(e) => setEditSubcategory(e.target.value)}
                          disabled={(CLOTHING_TAXONOMY[editCategory] || []).length === 0}
                          className="mt-1 w-full rounded-lg bg-neutral-50 px-3 py-2 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm capitalize disabled:opacity-50"
                        >
                          {(CLOTHING_TAXONOMY[editCategory] || []).length === 0 ? (
                            <option value="">No subcategories</option>
                          ) : (
                            CLOTHING_TAXONOMY[editCategory].map((sub) => (
                              <option key={sub} value={sub} className="capitalize">
                                {sub}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-wide text-neutral-400">
                          Color
                        </label>
                        <input
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="mt-1 w-full rounded-lg bg-neutral-50 px-3 py-2 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-wide text-neutral-400 block mb-1.5">
                          Best time to wear
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {SEASON_OPTIONS.map((season) => (
                            <button
                              key={season}
                              type="button"
                              onClick={() => toggleSeason(season)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-medium capitalize transition ${
                                editSeasons.includes(season)
                                  ? 'bg-pink-600 text-white'
                                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                              }`}
                            >
                              {season}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handleSaveEdits}
                        disabled={saving}
                        className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save changes
                      </button>

                      {saveError && (
                        <p className="text-xs text-red-600 font-medium">{saveError}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* RIGHT */}
                <div className="p-6 bg-pink-50/40 flex flex-col justify-center">

                  <div className="w-11 h-11 rounded-xl bg-pink-100 flex items-center justify-center mb-4">
                    <CheckCircle className="w-5 h-5 text-pink-600" />
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-wider text-pink-600 mb-2">
                    Automatically detected
                  </p>

                  <h3 className="font-display text-xl font-bold text-neutral-900 mb-3">
                    Your item is ready!
                  </h3>

                  <p className="text-sm leading-relaxed text-neutral-500">
                    We automatically identified the category, subcategory,
                    color, and best time to wear based on your uploaded item.
                    Not quite right? Click Edit to correct it.
                  </p>

                </div>

              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 w-full">

              <button
                onClick={resetState}
                className="flex-1 border border-neutral-300 text-neutral-700 font-medium text-sm py-2.5 rounded-lg hover:bg-neutral-50 transition"
              >
                Upload another
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-pink-600 text-white font-medium text-sm py-2.5 rounded-lg hover:bg-pink-700 transition"
              >
                View closet
              </button>

            </div>

          </motion.div>
        )}

        {/* ================= ERROR ================= */}
        {error && !uploading && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-6 w-full max-w-lg p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col items-center gap-3 text-center"
          >

            <AlertCircle className="w-6 h-6 text-red-600" />

            <p className="text-red-700 text-xs font-medium">
              {error}
            </p>

            <button
              onClick={() => setError(null)}
              className="text-sm font-medium text-pink-600 hover:underline"
            >
              Try again
            </button>

          </motion.div>
        )}

      </main>
    </motion.div>
  );
}
