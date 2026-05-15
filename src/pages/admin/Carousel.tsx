import { useState, useCallback, type ChangeEvent } from 'react';
import { Image as ImageIcon, Plus, Trash2, ChevronUp, ChevronDown, Upload, X, Check } from 'lucide-react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import toast, { Toaster } from 'react-hot-toast';
import { doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useCarousel } from '../../lib/hooks';
import { uploadImage, deleteImage, readFileAsDataURL, getCroppedBlob } from '../../lib/storage';
import type { CarouselItem } from '../../lib/types';

// Carousel tile on the lobby is rendered with `aspect-video` (16:9).
const CAROUSEL_ASPECT = 16 / 9;
const CAROUSEL_OUTPUT_WIDTH = 1600;

// Hand-coded inline SVGs for crop controls.
const RotateIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const ResetIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);

const ZoomInIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

interface CropState {
  srcDataUrl: string;
  fileName: string;
}

export default function AdminCarousel() {
  const items = useCarousel();
  const [uploading, setUploading] = useState(false);
  const [captionEditId, setCaptionEditId] = useState<string | null>(null);
  const [captionDraft, setCaptionDraft] = useState('');

  // Crop modal state
  const [cropState, setCropState] = useState<CropState | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const resetCropControls = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const onCropComplete = useCallback((_: Area, croppedAreaPx: Area) => {
    setCroppedAreaPixels(croppedAreaPx);
  }, []);

  const handleSelectFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    try {
      const dataUrl = await readFileAsDataURL(file);
      setCropState({ srcDataUrl: dataUrl, fileName: file.name });
      resetCropControls();
    } catch {
      toast.error('Could not read file');
    }
  };

  const handleCropConfirm = async () => {
    if (!cropState || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const outputHeight = Math.round(CAROUSEL_OUTPUT_WIDTH / CAROUSEL_ASPECT);
      const blob = await getCroppedBlob(
        cropState.srcDataUrl,
        croppedAreaPixels,
        CAROUSEL_OUTPUT_WIDTH,
        outputHeight,
        rotation
      );
      const id = `carousel_${Date.now()}`;
      const path = `carousel/${id}.jpg`;
      const imageUrl = await uploadImage(blob, path);
      await setDoc(doc(db, 'carousel', id), {
        id,
        imageUrl,
        caption: '',
        order: items.length,
        createdAt: new Date().toISOString(),
      } as CarouselItem);
      toast.success('Image cropped and uploaded');
      setCropState(null);
      resetCropControls();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item: CarouselItem) => {
    if (!confirm('Delete this image from the carousel?')) return;
    try {
      await deleteDoc(doc(db, 'carousel', item.id));
      if (item.imageUrl) {
        try { await deleteImage(item.imageUrl); } catch { /* ignore */ }
      }
      toast.success('Image removed');
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const handleReorder = async (item: CarouselItem, direction: 'up' | 'down') => {
    const idx = items.findIndex(i => i.id === item.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    const swap = items[swapIdx];
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'carousel', item.id), { order: swap.order }, { merge: true });
      batch.set(doc(db, 'carousel', swap.id), { order: item.order }, { merge: true });
      await batch.commit();
    } catch (err: any) {
      toast.error(err.message || 'Reorder failed');
    }
  };

  const saveCaption = async (item: CarouselItem) => {
    try {
      await setDoc(doc(db, 'carousel', item.id), { caption: captionDraft }, { merge: true });
      setCaptionEditId(null);
      setCaptionDraft('');
      toast.success('Caption saved');
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <Toaster position="bottom-right" />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-3">
            <ImageIcon size={26} className="text-eqc-green" />
            Campus Life Carousel
          </h2>
          <p className="text-sm text-eqc-muted mt-1">Photos rotate on the lobby dashboard. Each image is cropped to the carousel tile (16:9) before upload.</p>
        </div>
        <label className="cursor-pointer bg-eqc-green text-white px-4 py-3 min-h-[44px] rounded-lg font-bold flex items-center gap-2 hover:bg-eqc-green/90 transition-colors w-full sm:w-auto justify-center">
          <Upload size={18} />
          {uploading ? 'Uploading…' : 'Upload Image'}
          <input type="file" accept="image/*" className="hidden" onChange={handleSelectFile} disabled={uploading} />
        </label>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
          <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-700 mb-2">No photos yet</h3>
          <p className="text-sm text-eqc-muted">Upload campus life photos to display in rotation on the lobby screen.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, idx) => (
            <div key={item.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="aspect-video bg-gray-100">
                <img src={item.imageUrl} alt={item.caption || 'Carousel image'} className="w-full h-full object-cover" />
              </div>
              <div className="p-3 space-y-2">
                {captionEditId === item.id ? (
                  <div className="flex gap-2">
                    <input value={captionDraft} onChange={(e) => setCaptionDraft(e.target.value)} className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm" placeholder="Caption…" autoFocus />
                    <button onClick={() => saveCaption(item)} className="px-3 py-1.5 bg-eqc-green text-white text-xs font-bold rounded">Save</button>
                    <button onClick={() => { setCaptionEditId(null); setCaptionDraft(''); }} className="px-3 py-1.5 text-gray-500 text-xs font-bold">Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setCaptionEditId(item.id); setCaptionDraft(item.caption || ''); }}
                    className="text-sm w-full text-left hover:text-eqc-green transition-colors"
                  >
                    {item.caption || <span className="italic text-eqc-muted">Add caption…</span>}
                  </button>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleReorder(item, 'up')} disabled={idx === 0} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30">
                      <ChevronUp size={16} />
                    </button>
                    <button onClick={() => handleReorder(item, 'down')} disabled={idx === items.length - 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30">
                      <ChevronDown size={16} />
                    </button>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-2">#{idx + 1}</span>
                  </div>
                  <button onClick={() => handleDelete(item)} className="text-red-500 p-1.5 hover:bg-red-50 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Crop Modal */}
      {cropState && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-4 sm:p-5 border-b flex justify-between items-center shrink-0">
              <div className="min-w-0">
                <h3 className="text-lg font-display font-bold truncate">Crop carousel image</h3>
                <p className="text-xs text-eqc-muted mt-0.5">Locked to the lobby tile ratio (16:9).</p>
              </div>
              <button
                onClick={() => { setCropState(null); resetCropControls(); }}
                className="p-2 hover:bg-gray-100 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
                disabled={uploading}
                aria-label="Cancel crop"
              >
                <X size={20} />
              </button>
            </div>
            <div className="relative h-[55vh] sm:h-96 bg-gray-100 shrink-0">
              <Cropper
                image={cropState.srcDataUrl}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={CAROUSEL_ASPECT}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
                objectFit="contain"
              />
            </div>
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1 shrink-0">
                  <ZoomInIcon /> Zoom
                </span>
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-eqc-green"
                  aria-label="Zoom"
                />
                <span className="text-xs font-mono text-gray-500 w-10 text-right tabular-nums">{zoom.toFixed(2)}x</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1 shrink-0">
                  <RotateIcon /> Rotate
                </span>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="flex-1 accent-eqc-green"
                  aria-label="Rotate"
                />
                <span className="text-xs font-mono text-gray-500 w-10 text-right tabular-nums">{rotation}°</span>
              </div>
              <div className="flex flex-wrap gap-2 justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={resetCropControls}
                  disabled={uploading}
                  className="px-3 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 flex items-center gap-1.5 min-h-[44px]"
                >
                  <ResetIcon /> Reset
                </button>
                <div className="flex gap-2 sm:gap-3 ml-auto">
                  <button
                    onClick={() => { setCropState(null); resetCropControls(); }}
                    disabled={uploading}
                    className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCropConfirm}
                    disabled={uploading}
                    className="px-5 sm:px-6 py-2 text-sm font-bold text-white bg-eqc-green rounded-lg hover:bg-eqc-green/90 flex items-center gap-2 disabled:opacity-50 min-h-[44px]"
                  >
                    <Check size={16} /> {uploading ? 'Uploading…' : 'Save crop'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
