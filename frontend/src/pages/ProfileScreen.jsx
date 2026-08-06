import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Cropper from 'react-easy-crop';
import {
  X,
  User,
  Mail,
  Calendar,
  LogOut,
  Trash2,
  Camera,
  Save,
  Loader2,
  Check,
  Shirt,
  Sparkles,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { getCatalogue, deleteItem } from '../lib/api.js';

export default function ProfileDrawer({ isOpen, onClose }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState(
    user?.user_metadata?.first_name || ''
  );

  const [lastName, setLastName] = useState(
    user?.user_metadata?.last_name || ''
  );

  const [avatarUrl, setAvatarUrl] = useState(
    user?.user_metadata?.avatar_url || null
  );

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToProcess, setImageToProcess] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [itemCount, setItemCount] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  /* ============================================================
     KEEP PROFILE DATA IN SYNC
     ============================================================ */

  useEffect(() => {
    if (!user) return;

    setFirstName(user.user_metadata?.first_name || '');
    setLastName(user.user_metadata?.last_name || '');
    setAvatarUrl(user.user_metadata?.avatar_url || null);
  }, [user]);

  /* ============================================================
     LOAD WARDROBE COUNT
     ============================================================ */

  useEffect(() => {
    if (!isOpen) return;

    const fetchCount = async () => {
      try {
        const response = await getCatalogue();

        const items =
          response?.items ||
          response?.data ||
          response ||
          [];

        setItemCount(Array.isArray(items) ? items.length : 0);
      } catch (error) {
        console.error('Could not load wardrobe count:', error);
        setItemCount(null);
      }
    };

    fetchCount();
  }, [isOpen]);

  /* ============================================================
     SAVE NAME
     ============================================================ */

  const handleSaveName = async () => {
    setSaving(true);
    setSaveMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      });

      if (error) throw error;

      setSaveMessage({
        type: 'success',
        text: 'Profile updated.',
      });
    } catch (err) {
      setSaveMessage({
        type: 'error',
        text: err.message || 'Could not update profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     UPLOAD PROFILE PICTURE
     ============================================================ */

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageToProcess(reader.result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const onCropComplete = (_croppedArea, croppedAreaPixelsValue) => {
    setCroppedAreaPixels(croppedAreaPixelsValue);
  };

  const getCroppedImageBlob = (imageSrc, cropPixels) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = cropPixels.width;
        canvas.height = cropPixels.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(
          image,
          cropPixels.x,
          cropPixels.y,
          cropPixels.width,
          cropPixels.height,
          0,
          0,
          cropPixels.width,
          cropPixels.height
        );
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Could not process image'));
            return;
          }
          resolve(blob);
        }, 'image/jpeg', 0.92);
      };
      image.onerror = reject;
      image.src = imageSrc;
    });
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    setImageToProcess(null);
  };

  const handleCropConfirm = async () => {
    if (!imageToProcess || !croppedAreaPixels || !user) return;
    setAvatarUploading(true);
    setSaveMessage(null);
    try {
      const blob = await getCroppedImageBlob(imageToProcess, croppedAreaPixels);
      const filePath = `${user.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          upsert: true,
          contentType: 'image/jpeg',
        });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      const avatarUrlValue = publicUrlData.publicUrl;
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: avatarUrlValue,
        },
      });
      if (updateError) throw updateError;
      setAvatarUrl(avatarUrlValue);
      setSaveMessage({
        type: 'success',
        text: 'Profile photo updated.',
      });
      setCropModalOpen(false);
      setImageToProcess(null);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setSaveMessage({
        type: 'error',
        text: 'Could not upload photo.',
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  /* ============================================================
     SIGN OUT
     ============================================================ */

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  /* ============================================================
     CLEAR WARDROBE
     ============================================================ */

  const handleClearWardrobe = async () => {
    setClearing(true);

    try {
      const response = await getCatalogue();

      const items =
        response?.items ||
        response?.data ||
        response ||
        [];

      if (Array.isArray(items)) {
        for (const item of items) {
          await deleteItem(item.id);
        }
      }

      setItemCount(0);
      setShowClearConfirm(false);

      setSaveMessage({
        type: 'success',
        text: 'Wardrobe cleared.',
      });
    } catch (err) {
      console.error('Could not clear wardrobe:', err);

      setSaveMessage({
        type: 'error',
        text: 'Could not clear wardrobe.',
      });
    } finally {
      setClearing(false);
    }
  };

  /* ============================================================
     MEMBER SINCE
     ============================================================ */

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null;

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ========================================================
              BACKDROP
              ======================================================== */}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={onClose}
            className="
              fixed
              inset-0
              z-40
              bg-[#33231c]/25
              backdrop-blur-[1px]
            "
          />

          {/* ========================================================
              RIGHT PANEL
              ======================================================== */}

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{
              duration: 0.7,
              ease: [0.76, 0, 0.24, 1],
            }}
            className="
              fixed
              top-0
              right-0
              bottom-0
              z-50
              w-[25vw]
              min-w-[360px]
              max-w-[480px]
              overflow-hidden
              shadow-[-15px_0_45px_rgba(93,59,33,0.25)]
            "
          >
            {/* ======================================================
                PANEL BACKGROUND — warm cream/tan, matching the
                boutique closet theme instead of the old pink curtain
                ====================================================== */}

            <div
              className="
                absolute
                inset-0
                bg-gradient-to-l
                from-[#c9a876]
                via-[#dbc3a0]
                to-[#ecdcc2]
              "
            />

            {/* ======================================================
                SUBTLE FABRIC-FOLD TEXTURE
                ====================================================== */}

            <div className="absolute inset-0 opacity-30 pointer-events-none">

              <div
                className="
                  absolute
                  inset-y-0
                  left-[8%]
                  w-[10%]
                  bg-white/20
                  skew-x-[-3deg]
                "
              />

              <div
                className="
                  absolute
                  inset-y-0
                  left-[25%]
                  w-[7%]
                  bg-[#5d3b21]/10
                  skew-x-[3deg]
                "
              />

              <div
                className="
                  absolute
                  inset-y-0
                  left-[43%]
                  w-[11%]
                  bg-white/15
                  skew-x-[-3deg]
                "
              />

              <div
                className="
                  absolute
                  inset-y-0
                  left-[65%]
                  w-[8%]
                  bg-[#5d3b21]/10
                  skew-x-[3deg]
                "
              />

              <div
                className="
                  absolute
                  inset-y-0
                  left-[84%]
                  w-[10%]
                  bg-white/15
                  skew-x-[-3deg]
                "
              />

            </div>

            {/* ======================================================
                MOVING LIGHT
                ====================================================== */}

            <motion.div
              initial={{
                x: '100%',
                opacity: 0,
              }}
              animate={{
                x: '-120%',
                opacity: [0, 0.2, 0],
              }}
              transition={{
                duration: 1.1,
                ease: 'easeInOut',
              }}
              className="
                absolute
                inset-y-0
                w-[30%]
                bg-gradient-to-r
                from-transparent
                via-white/35
                to-transparent
                blur-xl
                pointer-events-none
              "
            />

            {/* ======================================================
                TOP RAIL
                ====================================================== */}

            <div
              className="
                absolute
                top-0
                left-0
                right-0
                h-3
                z-20
                bg-gradient-to-b
                from-[#f0e0c4]
                to-[#a87339]
                shadow-[0_2px_8px_rgba(93,59,33,0.3)]
              "
            />

            {/* ======================================================
                PROFILE CONTENT
                ====================================================== */}

            <div
              className="
                relative
                z-10
                h-full
                flex
                flex-col
              "
            >

              {/* ====================================================
                  HEADER
                  ==================================================== */}

              <div
                className="
                  shrink-0
                  flex
                  items-center
                  justify-between
                  px-6
                  py-5
                  bg-[#fffaf3]/95
                  backdrop-blur-md
                  border-b
                  border-[#e6d9c8]
                "
              >
                <div className="flex items-center gap-3">

                  <div
                    className="
                      w-10
                      h-10
                      rounded-2xl
                      bg-[#f2e5d8]
                      border
                      border-[#e6d9c8]
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <Shirt className="w-5 h-5 text-[#8d3d3d]" />
                  </div>

                  <div>
                    <h1 className="font-serif text-lg font-bold text-[#33231c]">
                      Profile
                    </h1>

                    <p className="text-[11px] text-[#9c8f83]">
                      Your closet, your style
                    </p>
                  </div>

                </div>

                <button
                  onClick={onClose}
                  className="
                    p-2
                    rounded-full
                    text-[#9c8f83]
                    hover:text-[#8d3d3d]
                    hover:bg-[#f2e5d8]
                    transition
                  "
                  aria-label="Close profile"
                >
                  <X className="w-5 h-5" />
                </button>

              </div>

              {/* ====================================================
                  SCROLLABLE CONTENT
                  ==================================================== */}

              <div
                className="
                  flex-1
                  overflow-y-auto
                  bg-[#fffaf3]
                "
              >

                <div className="px-6 py-7 space-y-7">

                  {/* ==================================================
                      PROFILE PHOTO
                      ================================================== */}

                  <section className="flex flex-col items-center">

                    <div className="relative">

                      <div
                        className="
                          w-24
                          h-24
                          rounded-full
                          bg-gradient-to-br
                          from-[#f2e5d8]
                          to-[#ecdcc2]
                          border-4
                          border-white
                          ring-2
                          ring-[#e6d9c8]
                          overflow-hidden
                          flex
                          items-center
                          justify-center
                          shadow-lg
                        "
                      >
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 text-[#c3a678]" />
                        )}
                      </div>

                      <label
                        className="
                          absolute
                          bottom-0
                          right-0
                          w-8
                          h-8
                          rounded-full
                          bg-[#8d3d3d]
                          hover:bg-[#6f2f2f]
                          flex
                          items-center
                          justify-center
                          cursor-pointer
                          border-4
                          border-white
                          shadow-md
                          transition
                        "
                      >
                        {avatarUploading ? (
                          <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                        ) : (
                          <Camera className="w-3.5 h-3.5 text-white" />
                        )}

                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileSelect}
                          disabled={avatarUploading}
                        />
                      </label>

                    </div>

                    <p className="text-[11px] text-[#9c8f83] mt-3 text-center">
                      Click the camera to update your photo
                    </p>

                  </section>

                  {/* ==================================================
                      NAME
                      ================================================== */}

                  <section
                    className="
                      rounded-2xl
                      bg-[#f2e5d8]/60
                      border
                      border-[#e6d9c8]
                      p-4
                    "
                  >

                    <div className="flex items-center gap-2 mb-4">

                      <Sparkles className="w-4 h-4 text-[#8d3d3d]" />

                      <h2 className="text-sm font-bold text-[#33231c] font-serif">
                        Your name
                      </h2>

                    </div>

                    <div className="space-y-3">

                      <input
                        value={firstName}
                        onChange={(e) =>
                          setFirstName(e.target.value)
                        }
                        placeholder="First name"
                        className="
                          w-full
                          rounded-xl
                          bg-white
                          px-4
                          py-3
                          border
                          border-[#e6d9c8]
                          focus:outline-none
                          focus:ring-2
                          focus:ring-[#c9a876]/60
                          focus:border-[#c9a876]
                          text-sm
                          text-[#33231c]
                        "
                      />

                      <input
                        value={lastName}
                        onChange={(e) =>
                          setLastName(e.target.value)
                        }
                        placeholder="Last name"
                        className="
                          w-full
                          rounded-xl
                          bg-white
                          px-4
                          py-3
                          border
                          border-[#e6d9c8]
                          focus:outline-none
                          focus:ring-2
                          focus:ring-[#c9a876]/60
                          focus:border-[#c9a876]
                          text-sm
                          text-[#33231c]
                        "
                      />

                    </div>

                    <button
                      onClick={handleSaveName}
                      disabled={saving}
                      className="
                        mt-4
                        w-full
                        flex
                        items-center
                        justify-center
                        gap-2
                        bg-[#8d3d3d]
                        hover:bg-[#6f2f2f]
                        text-white
                        text-sm
                        font-semibold
                        px-5
                        py-2.5
                        rounded-xl
                        shadow-sm
                        transition
                        disabled:opacity-50
                      "
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}

                      Save changes
                    </button>

                    {saveMessage && (
                      <p
                        className={`mt-3 text-xs font-medium ${
                          saveMessage.type === 'success'
                            ? 'text-emerald-700'
                            : 'text-red-600'
                        }`}
                      >
                        {saveMessage.text}
                      </p>
                    )}

                  </section>

                  {/* ==================================================
                      ACCOUNT
                      ================================================== */}

                  <section>

                    <h2 className="text-sm font-bold text-[#33231c] font-serif mb-3">
                      Account
                    </h2>

                    <div
                      className="
                        rounded-2xl
                        border
                        border-[#e6d9c8]
                        overflow-hidden
                        bg-white
                      "
                    >

                      {/* EMAIL */}

                      <div className="flex items-center gap-3 px-4 py-4">

                        <div className="w-9 h-9 rounded-xl bg-[#f7f0e7] flex items-center justify-center shrink-0">
                          <Mail className="w-4 h-4 text-[#9c8f83]" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[11px] text-[#9c8f83]">
                            Email
                          </p>

                          <p className="text-sm text-[#514036] truncate">
                            {user?.email}
                          </p>
                        </div>

                      </div>

                      {/* MEMBER SINCE */}

                      {memberSince && (
                        <div
                          className="
                            flex
                            items-center
                            gap-3
                            px-4
                            py-4
                            border-t
                            border-[#e6d9c8]
                          "
                        >

                          <div className="w-9 h-9 rounded-xl bg-[#f7f0e7] flex items-center justify-center shrink-0">
                            <Calendar className="w-4 h-4 text-[#9c8f83]" />
                          </div>

                          <div>
                            <p className="text-[11px] text-[#9c8f83]">
                              Member since
                            </p>

                            <p className="text-sm text-[#514036]">
                              {memberSince}
                            </p>
                          </div>

                        </div>
                      )}

                      {/* WARDROBE */}

                      <div
                        className="
                          flex
                          items-center
                          gap-3
                          px-4
                          py-4
                          border-t
                          border-[#e6d9c8]
                        "
                      >

                        <div className="w-9 h-9 rounded-xl bg-[#f2e5d8] flex items-center justify-center shrink-0">
                          <Shirt className="w-4 h-4 text-[#8d3d3d]" />
                        </div>

                        <div>
                          <p className="text-[11px] text-[#9c8f83]">
                            Wardrobe
                          </p>

                          <p className="text-sm text-[#514036]">
                            {itemCount === null
                              ? 'Loading...'
                              : `${itemCount} item${
                                  itemCount === 1 ? '' : 's'
                                } in your wardrobe`}
                          </p>
                        </div>

                      </div>

                    </div>

                  </section>

                  {/* ==================================================
                      SETTINGS
                      ================================================== */}

                  <section>

                    <h2 className="text-sm font-bold text-[#33231c] font-serif mb-3">
                      Settings
                    </h2>

                    <div className="space-y-3">

                      {/* SIGN OUT */}

                      <button
                        onClick={handleSignOut}
                        className="
                          w-full
                          flex
                          items-center
                          gap-3
                          border
                          border-[#e6d9c8]
                          hover:border-[#c9a876]
                          hover:bg-[#f7f0e7]
                          text-[#514036]
                          text-sm
                          font-semibold
                          px-4
                          py-3
                          rounded-xl
                          transition
                        "
                      >
                        <LogOut className="w-4 h-4 text-[#9c8f83]" />

                        <span>Sign out</span>
                      </button>

                      {/* CLEAR WARDROBE */}

                      {!showClearConfirm ? (
                        <button
                          onClick={() =>
                            setShowClearConfirm(true)
                          }
                          className="
                            w-full
                            flex
                            items-center
                            gap-3
                            border
                            border-red-200
                            hover:bg-red-50
                            text-red-600
                            text-sm
                            font-semibold
                            px-4
                            py-3
                            rounded-xl
                            transition
                          "
                        >
                          <Trash2 className="w-4 h-4" />

                          <span>Clear wardrobe</span>
                        </button>
                      ) : (
                        <motion.div
                          initial={{
                            opacity: 0,
                            height: 0,
                          }}
                          animate={{
                            opacity: 1,
                            height: 'auto',
                          }}
                          className="
                            border
                            border-red-200
                            bg-red-50/60
                            rounded-2xl
                            p-4
                            space-y-4
                            overflow-hidden
                          "
                        >

                          <div>

                            <p className="text-sm text-red-700 font-semibold">
                              Clear your wardrobe?
                            </p>

                            <p className="text-xs text-red-600/80 mt-1 leading-relaxed">
                              This will permanently delete all{' '}
                              {itemCount ?? 0} items from your wardrobe.
                              This cannot be undone.
                            </p>

                          </div>

                          <div className="flex gap-2">

                            <button
                              onClick={handleClearWardrobe}
                              disabled={clearing}
                              className="
                                flex-1
                                bg-red-600
                                hover:bg-red-700
                                text-white
                                text-sm
                                font-semibold
                                px-3
                                py-2.5
                                rounded-xl
                                transition
                                disabled:opacity-50
                              "
                            >
                              {clearing ? (
                                <span className="flex items-center justify-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Clearing...
                                </span>
                              ) : (
                                'Yes, clear'
                              )}
                            </button>

                            <button
                              onClick={() =>
                                setShowClearConfirm(false)
                              }
                              className="
                                flex-1
                                border
                                border-[#e6d9c8]
                                bg-white
                                hover:bg-[#f7f0e7]
                                text-[#514036]
                                text-sm
                                font-semibold
                                px-3
                                py-2.5
                                rounded-xl
                                transition
                              "
                            >
                              Cancel
                            </button>

                          </div>

                        </motion.div>
                      )}

                    </div>

                  </section>

                  <div className="h-4" />

                </div>

              </div>

            </div>

          </motion.aside>

          {cropModalOpen && imageToProcess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-[#33231c]/70 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl overflow-hidden w-full max-w-sm shadow-2xl">
                <div className="px-5 py-4 border-b border-[#e6d9c8]">
                  <p className="font-serif text-base font-bold text-[#33231c]">
                    Adjust your photo
                  </p>
                </div>

                <div className="relative w-full h-72 bg-[#33231c]">
                  <Cropper
                    image={imageToProcess}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>

                <div className="px-5 py-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#9c8f83] font-medium">Zoom</span>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.05}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="flex-1 accent-[#8d3d3d]"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleCropCancel}
                      disabled={avatarUploading}
                      className="flex-1 border border-[#e6d9c8] text-[#514036] text-sm font-semibold px-4 py-2.5 rounded-xl transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCropConfirm}
                      disabled={avatarUploading}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#8d3d3d] hover:bg-[#6f2f2f] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition disabled:opacity-50"
                    >
                      {avatarUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Save photo
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
