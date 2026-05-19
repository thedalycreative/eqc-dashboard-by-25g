import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, Plus, Trash2, Wifi, Phone } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useGlobalSettings } from '../../lib/hooks';
import type { GlobalSettings, Contact } from '../../lib/types';
import { DEFAULT_SETTINGS } from '../../lib/types';

function msToSeconds(ms: number) { return Math.round(ms / 1000); }
function secondsToMs(s: number) { return s * 1000; }
function hourToTime(h: number) { return `${String(h).padStart(2, '0')}:00`; }
function timeToHour(t: string) { return parseInt(t.split(':')[0]) || 0; }

export default function AdminSettings() {
  const [settings, updateSettings] = useGlobalSettings();
  const [draft, setDraft] = useState<GlobalSettings>(settings);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { if (!dirty) setDraft(settings); }, [settings, dirty]);

  const patch = (p: Partial<GlobalSettings>) => {
    setDirty(true);
    setDraft(prev => ({ ...prev, ...p }));
  };

  const handleSave = async () => {
    try {
      await updateSettings(draft);
      setDirty(false);
      toast.success('Settings saved');
    } catch (err: any) { toast.error(err.message || 'Save failed'); }
  };

  const handleRevert = () => { setDraft(settings); setDirty(false); };

  const addContact = () => {
    patch({ contacts: [...draft.contacts, { name: '', role: '', email: '', phone: '' }] });
  };
  const updateContact = (idx: number, p: Partial<Contact>) => {
    const next = [...draft.contacts];
    next[idx] = { ...next[idx], ...p };
    patch({ contacts: next });
  };
  const removeContact = (idx: number) => {
    patch({ contacts: draft.contacts.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-6 max-w-4xl pb-24">
      <Toaster position="bottom-right" />

      <div>
        <h2 className="text-2xl font-bold serif flex items-center gap-3">
          <SettingsIcon size={26} className="text-eqc-green" />
          Global Settings
        </h2>
        <p className="text-sm text-eqc-muted mt-1">Configuration that affects the whole app.</p>
      </div>

      <section className="bg-white rounded-2xl border p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-600">Carousel</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1">Slide duration (seconds)</label>
            <input type="number" min={1} max={60} step={1}
              value={msToSeconds(draft.carouselSlideDurationMs)}
              onChange={(e) => patch({ carouselSlideDurationMs: secondsToMs(Math.max(1, Number(e.target.value) || msToSeconds(DEFAULT_SETTINGS.carouselSlideDurationMs))) })}
              className="w-full p-2.5 border rounded-lg" />
            <p className="text-xs text-eqc-muted mt-1">How long each slide is shown. Default: {msToSeconds(DEFAULT_SETTINGS.carouselSlideDurationMs)}s</p>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Transition</label>
            <select value={draft.carouselTransition}
              onChange={(e) => patch({ carouselTransition: e.target.value as 'fade' | 'slide' })}
              className="w-full p-2.5 border rounded-lg">
              <option value="fade">Fade</option>
              <option value="slide">Slide</option>
            </select>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-600">Daily Reset</h3>
        <div>
          <label className="block text-xs font-bold mb-1">Reset time</label>
          <input type="time" value={hourToTime(draft.resetTimeHour)}
            onChange={(e) => patch({ resetTimeHour: timeToHour(e.target.value) })}
            className="w-40 p-2.5 border rounded-lg" />
          <p className="text-xs text-eqc-muted mt-1">All rooms reset to "Available" at this time daily. Default: 10:00 PM.</p>
        </div>
      </section>

      <section className="bg-white rounded-2xl border p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-600 flex items-center gap-2"><Wifi size={16} /> Campus WiFi</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1">SSID</label>
            <input value={draft.wifiSsid} onChange={(e) => patch({ wifiSsid: e.target.value })}
              className="w-full p-2.5 border rounded-lg" placeholder="EQC-network" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Password</label>
            <input value={draft.wifiPassword} onChange={(e) => patch({ wifiPassword: e.target.value })}
              className="w-full p-2.5 border rounded-lg font-mono" placeholder="Leave blank for open network" />
          </div>
        </div>
        <p className="text-xs text-eqc-muted">Displayed on the lobby header and mobile companion view.</p>
      </section>

      <section className="bg-white rounded-2xl border p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-600 flex items-center gap-2"><Phone size={16} /> Contact Directory</h3>
          <button onClick={addContact} className="text-eqc-green font-bold text-sm flex items-center gap-1 hover:bg-eqc-green/5 px-3 py-1.5 rounded-lg">
            <Plus size={16} /> Add
          </button>
        </div>
        {draft.contacts.length === 0 ? (
          <p className="text-sm text-eqc-muted italic">No contacts yet.</p>
        ) : (
          <div className="space-y-3">
            {draft.contacts.map((c, idx) => (
              <div key={idx} className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input value={c.name} onChange={(e) => updateContact(idx, { name: e.target.value })} placeholder="Name" className="w-full px-2 py-1.5 border rounded text-sm bg-white" />
                  <input value={c.role} onChange={(e) => updateContact(idx, { role: e.target.value })} placeholder="Role" className="w-full px-2 py-1.5 border rounded text-sm bg-white" />
                  <input value={c.email} onChange={(e) => updateContact(idx, { email: e.target.value })} placeholder="email@example.com" className="w-full px-2 py-1.5 border rounded text-sm bg-white" />
                  <div className="flex gap-2">
                    <input value={c.phone || ''} onChange={(e) => updateContact(idx, { phone: e.target.value })} placeholder="Phone (optional)" className="flex-1 px-2 py-1.5 border rounded text-sm bg-white" />
                    <button onClick={() => removeContact(idx)} className="text-red-500 p-1.5 hover:bg-red-50 rounded shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {dirty ? (
            <><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /><span className="text-amber-700 font-bold">Unsaved changes</span></>
          ) : (
            <><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-gray-500">All changes saved</span></>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={handleRevert} disabled={!dirty} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">Revert</button>
          <button onClick={handleSave} disabled={!dirty} className="px-6 py-2 text-sm font-bold text-white bg-eqc-green rounded-lg hover:bg-eqc-green/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Save size={16} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
