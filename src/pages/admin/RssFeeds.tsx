import { useState, useMemo, FormEvent } from 'react';
import { Rss, Plus, Trash2, Edit3, X, Globe, Check } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useRssFeeds, useGlobalSettings } from '../../lib/hooks';
import type { RssFeed } from '../../lib/types';

const CATEGORIES: RssFeed['category'][] = ['cybersecurity', 'webdev', 'general', 'local', 'safety'];
const CAT_LABELS: Record<string, string> = {
  cybersecurity: 'Cybersecurity', webdev: 'Web Dev', general: 'General Tech', local: 'Local (AU)', safety: 'Safety & WHS',
};

const RIBBON_PRESETS = [
  { hex: '#1a3a2a', label: 'EQC Dark' },
  { hex: '#70457b', label: 'Purple' },
  { hex: '#47798e', label: 'Teal Blue' },
  { hex: '#ff8a3d', label: 'TDC Orange' },
  { hex: '#2f9ea0', label: 'TDC Teal' },
  { hex: '#1f2937', label: 'Charcoal' },
  { hex: '#dc2626', label: 'Red' },
];

const CURATED_FEEDS: Array<{ label: string; url: string; category: RssFeed['category'] }> = [
  { label: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews', category: 'cybersecurity' },
  { label: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/', category: 'cybersecurity' },
  { label: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/feed/', category: 'cybersecurity' },
  { label: 'Dark Reading', url: 'https://www.darkreading.com/rss.xml', category: 'cybersecurity' },
  { label: 'CISA Alerts', url: 'https://www.cisa.gov/cybersecurity-advisories/all.xml', category: 'cybersecurity' },
  { label: 'SANS ISC', url: 'https://isc.sans.edu/rssfeed.xml', category: 'cybersecurity' },
  { label: 'Smashing Magazine', url: 'https://www.smashingmagazine.com/feed/', category: 'webdev' },
  { label: 'Dev.to', url: 'https://dev.to/feed', category: 'webdev' },
  { label: 'freeCodeCamp', url: 'https://www.freecodecamp.org/news/rss/', category: 'webdev' },
  { label: 'CSS-Tricks', url: 'https://css-tricks.com/feed/', category: 'webdev' },
  { label: 'Web.dev', url: 'https://web.dev/feed.xml', category: 'webdev' },
  { label: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'general' },
  { label: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', category: 'general' },
  { label: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'general' },
  { label: 'Wired', url: 'https://www.wired.com/feed/rss', category: 'general' },
  { label: 'Hacker News', url: 'https://hnrss.org/frontpage', category: 'general' },
  { label: 'ABC News Perth', url: 'https://www.abc.net.au/news/feed/51120/rss.xml', category: 'local' },
  { label: 'PerthNow', url: 'https://www.perthnow.com.au/rss', category: 'local' },
  { label: 'WA Today', url: 'https://www.watoday.com.au/rss/feed.xml', category: 'local' },
  { label: 'Safe Work Australia', url: 'https://www.safeworkaustralia.gov.au/rss.xml', category: 'safety' },
  { label: 'WorkSafe WA News', url: 'https://www.commerce.wa.gov.au/worksafe/rss.xml', category: 'safety' },
];

export default function AdminRssFeeds() {
  const feeds = useRssFeeds();
  const [settings, updateSettings] = useGlobalSettings();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RssFeed | null>(null);

  const feedUrlSet = useMemo(() => new Set(feeds.map(f => f.url)), [feeds]);
  const customFeeds = useMemo(() =>
    feeds.filter(f => !CURATED_FEEDS.some(c => c.url === f.url))
  , [feeds]);

  const toggleCurated = async (curated: typeof CURATED_FEEDS[0]) => {
    const existing = feeds.find(f => f.url === curated.url);
    if (existing) {
      try {
        await deleteDoc(doc(db, 'rssFeeds', existing.id));
      } catch (err: any) { toast.error(err.message || 'Remove failed'); }
    } else {
      const id = `feed_${Date.now()}`;
      try {
        await setDoc(doc(db, 'rssFeeds', id), {
          id, label: curated.label, url: curated.url,
          category: curated.category, active: true,
          createdAt: new Date().toISOString(),
        } as RssFeed);
      } catch (err: any) { toast.error(err.message || 'Add failed'); }
    }
  };

  const toggleActive = async (feed: RssFeed) => {
    try {
      await setDoc(doc(db, 'rssFeeds', feed.id), { active: !feed.active }, { merge: true });
    } catch (err: any) { toast.error(err.message || 'Update failed'); }
  };

  const handleDelete = async (feed: RssFeed) => {
    if (!confirm(`Delete RSS feed "${feed.label}"?`)) return;
    try {
      await deleteDoc(doc(db, 'rssFeeds', feed.id));
      toast.success('Feed removed');
    } catch (err: any) { toast.error(err.message || 'Delete failed'); }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Toaster position="bottom-right" />

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold serif flex items-center gap-3">
            <Rss size={26} className="text-eqc-green" />
            RSS Feeds Library
          </h2>
          <p className="text-sm text-eqc-muted mt-1">Sources for the news ticker. Toggle feeds on or off to control what appears.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-eqc-green text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-eqc-green/90 transition-colors text-sm">
          <Plus size={16} /> Custom Feed
        </button>
      </div>

      {/* Ticker controls + ribbon colour */}
      <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-600">Ticker Controls</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1">Status</label>
            <button onClick={() => updateSettings({ rssEnabled: !settings.rssEnabled })}
              className={`w-full px-3 py-2 text-sm font-bold rounded-lg ${settings.rssEnabled ? 'bg-eqc-green text-white' : 'bg-gray-200 text-gray-500'}`}>
              {settings.rssEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Refresh (min)</label>
            <input type="number" min={1} max={120} value={settings.rssRefreshIntervalMin}
              onChange={(e) => updateSettings({ rssRefreshIntervalMin: Number(e.target.value) || 15 })}
              className="w-full p-2 border border-gray-200 rounded text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Scroll speed</label>
            <select value={settings.rssScrollSpeed} onChange={(e) => updateSettings({ rssScrollSpeed: e.target.value as any })}
              className="w-full p-2 border border-gray-200 rounded text-sm">
              <option value="slow">Slow</option>
              <option value="medium">Medium</option>
              <option value="fast">Fast</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold mb-2">Ribbon colour</label>
          <div className="flex items-center gap-3 flex-wrap">
            {RIBBON_PRESETS.map(p => (
              <button key={p.hex} onClick={() => updateSettings({ rssRibbonColor: p.hex })} title={p.label}
                className={`w-9 h-9 rounded-full border-2 transition-all shrink-0 flex items-center justify-center ${
                  settings.rssRibbonColor === p.hex ? 'border-eqc-green scale-110 ring-2 ring-eqc-green/30' : 'border-gray-200 hover:border-gray-400'
                }`}
                style={{ backgroundColor: p.hex }}>
                {settings.rssRibbonColor === p.hex && <Check size={14} className="text-white" />}
              </button>
            ))}
            <div className="flex items-center gap-2 ml-2">
              <input type="color" value={settings.rssRibbonColor || '#1a3a2a'}
                onChange={(e) => updateSettings({ rssRibbonColor: e.target.value })}
                className="w-9 h-9 rounded cursor-pointer border border-gray-200 p-0.5" />
              <input type="text" value={settings.rssRibbonColor || '#1a3a2a'}
                onChange={(e) => updateSettings({ rssRibbonColor: e.target.value })}
                className="w-24 px-2 py-1.5 border rounded text-sm font-mono" placeholder="#000000" />
            </div>
          </div>
          <div className="mt-2 h-8 rounded-lg overflow-hidden" style={{ backgroundColor: settings.rssRibbonColor || '#1a3a2a' }}>
            <p className="text-white text-xs font-bold uppercase tracking-widest px-3 py-2 opacity-80">Ribbon preview</p>
          </div>
        </div>
      </div>

      {/* Curated sources by category */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Globe size={16} className="text-eqc-green" /> Curated Sources
        </h3>
        <p className="text-xs text-eqc-muted -mt-2">Tick to add a source to your ticker. Untick to remove it.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CATEGORIES.map(cat => {
            const catFeeds = CURATED_FEEDS.filter(c => c.category === cat);
            if (catFeeds.length === 0) return null;
            return (
              <div key={cat} className="bg-white rounded-xl border p-4 space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{CAT_LABELS[cat] || cat}</h4>
                {catFeeds.map(cf => {
                  const isActive = feedUrlSet.has(cf.url);
                  return (
                    <label key={cf.url} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={isActive} onChange={() => toggleCurated(cf)}
                        className="w-4 h-4 accent-eqc-green cursor-pointer shrink-0" />
                      <span className={`text-sm ${isActive ? 'font-bold' : 'text-gray-600'}`}>{cf.label}</span>
                    </label>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom feeds */}
      {customFeeds.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Plus size={16} className="text-eqc-green" /> Custom Feeds ({customFeeds.length})
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {customFeeds.map(feed => (
              <div key={feed.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0">
                <input type="checkbox" checked={feed.active} onChange={() => toggleActive(feed)}
                  className="w-4 h-4 accent-eqc-green cursor-pointer shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{feed.label}</p>
                  <p className="text-xs text-eqc-muted truncate flex items-center gap-1"><Globe size={11} /> {feed.url}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-100 px-2 py-1 rounded shrink-0">
                  {feed.category}
                </span>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditing(feed); setShowForm(true); }} className="text-blue-500 p-1.5 hover:bg-blue-50 rounded"><Edit3 size={16} /></button>
                  <button onClick={() => handleDelete(feed)} className="text-red-500 p-1.5 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <FeedForm existing={editing} onCancel={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); }} />
      )}
    </div>
  );
}

function FeedForm({ existing, onCancel, onSaved }: { existing: RssFeed | null; onCancel: () => void; onSaved: () => void }) {
  const [label, setLabel] = useState(existing?.label || '');
  const [url, setUrl] = useState(existing?.url || '');
  const [category, setCategory] = useState<RssFeed['category']>(existing?.category || 'general');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !url.trim()) { toast.error('Label and URL are required'); return; }
    setSaving(true);
    try {
      const id = existing?.id || `feed_${Date.now()}`;
      await setDoc(doc(db, 'rssFeeds', id), {
        id, label: label.trim(), url: url.trim(), category,
        active: existing?.active ?? true,
        createdAt: existing?.createdAt || new Date().toISOString(),
      } as RssFeed, { merge: true });
      toast.success(existing ? 'Feed updated' : 'Feed added');
      onSaved();
    } catch (err: any) { toast.error(err.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        <div className="p-5 border-b flex justify-between items-center">
          <h3 className="text-lg font-bold">{existing ? 'Edit feed' : 'Add custom feed'}</h3>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Label *</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} required className="w-full p-3 border rounded-lg" placeholder="e.g. My Blog" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Feed URL *</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} required className="w-full p-3 border rounded-lg" placeholder="https://example.com/feed.xml" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as RssFeed['category'])} className="w-full p-3 border rounded-lg">
              {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c] || c}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2 text-sm font-bold text-white bg-eqc-green rounded-lg hover:bg-eqc-green/90 disabled:opacity-50">
              {saving ? 'Saving...' : (existing ? 'Save' : 'Add Feed')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
