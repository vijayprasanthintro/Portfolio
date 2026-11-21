import Content from '../models/Content.js';
import { defaultContent, sectionKeys } from '../config/defaultContent.js';

// images get stored as base64 strings, drop any single image that's
// way too big before it's written to the db
const MAX_IMAGE_CHARS = 4 * 1024 * 1024; // ~4MB of base64 text

const CACHE_TTL = 30 * 1000; // 30s—public content changes only from the admin panel
const ASSET_PREFIX = '/api/content/asset/';
const SEGMENT_RE = /^[\w-]+$/;

// Public responses are cached in memory so repeated visits don't hit MongoDB.
let publicCache = null;

function invalidateCache() {
  publicCache = null;
}

function hasOversizedImage(value) {
  if (typeof value === 'string') {
    return value.startsWith('data:image/') && value.length > MAX_IMAGE_CHARS;
  }
  if (Array.isArray(value)) return value.some(hasOversizedImage);
  if (value && typeof value === 'object') return Object.values(value).some(hasOversizedImage);
  return false;
}

function isImageDataUrl(value) {
  return typeof value === 'string' && /^data:image\/[a-z0-9.+-]+;base64,/i.test(value);
}

// Walk stored data and swap base64 images for small, separately cacheable URLs.
// The assets map keeps the original data urls keyed by the generated path so the
// asset route can stream them as real images with far-future cache headers.
function publicize(data, section, version, assets, path = [section]) {
  if (isImageDataUrl(data)) {
    const assetPath = path.join('/');
    const url = `${ASSET_PREFIX}${assetPath}?v=${version}`;
    assets.set(assetPath, data);
    return url;
  }
  if (Array.isArray(data)) {
    return data.map((item, i) => publicize(item, section, version, assets, [...path, i]));
  }
  if (data && typeof data === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(data)) {
      out[key] = publicize(value, section, version, assets, [...path, key]);
    }
    return out;
  }
  return data;
}

function getValueAtPath(data, segments) {
  let current = data;
  for (const segment of segments) {
    if (current == null || typeof current !== 'object') return null;
    current = current[/^\d+$/.test(segment) ? Number(segment) : segment];
  }
  return current;
}

function parseDataUrl(dataUrl) {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i.exec(dataUrl);
  if (!match) return null;
  return { mime: match[1], buffer: Buffer.from(match[2].replace(/\s/g, ''), 'base64') };
}

// Public: returns every stored section as { sectionKey: data }.
// Images are served through a dedicated endpoint instead of inflating the JSON.
export async function getPublicContent(req, res) {
  try {
    if (publicCache && Date.now() - publicCache.at < CACHE_TTL) {
      res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
      return res.json(publicCache.body);
    }

    const docs = await Content.find({}).select('section data updatedAt').lean();
    const sections = {};
    const assets = new Map();

    for (const doc of docs) {
      const version = doc.updatedAt ? new Date(doc.updatedAt).getTime() : 0;
      sections[doc.section] = publicize(doc.data, doc.section, version, assets);
    }

    const body = { success: true, content: sections };
    publicCache = { body, assets, at: Date.now() };
    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    return res.json(body);
  } catch (err) {
    console.error('[content] getPublicContent error:', err);
    return res.status(500).json({ success: false, message: 'Could not load content.' });
  }
}

// Public: streams a stored base64 image as a real image response.
export async function getAsset(req, res) {
  // Express 4 wildcard routes expose the captured path as params[0].
  const assetPath = req.params[0] || req.params.path || '';
  const segments = String(assetPath || '').split('/');

  if (segments.length < 2 || segments.length > 8 || segments.some((s) => !SEGMENT_RE.test(s))) {
    return res.status(400).json({ success: false, message: 'Invalid asset path.' });
  }

  try {
    let dataUrl = null;
    if (publicCache?.assets.has(assetPath)) {
      dataUrl = publicCache.assets.get(assetPath);
    } else {
      const doc = await Content.findOne({ section: segments[0] }).select('data').lean();
      if (doc) dataUrl = getValueAtPath(doc.data, segments.slice(1));
    }

    if (!isImageDataUrl(dataUrl)) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    const parsed = parseDataUrl(dataUrl);
    if (!parsed) {
      return res.status(400).json({ success: false, message: 'Invalid image data.' });
    }

    res.set('Content-Type', parsed.mime);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(parsed.buffer);
  } catch (err) {
    console.error('[content] getAsset error:', err);
    return res.status(500).json({ success: false, message: 'Could not load asset.' });
  }
}

// Admin: returns stored data for a section, falling back to the default seed
// so editors are always pre-filled.
export async function getSection(req, res) {
  const { section } = req.params;
  if (!sectionKeys.includes(section)) {
    return res.status(404).json({ success: false, message: 'Unknown section.' });
  }
  try {
    const doc = await Content.findOne({ section }).lean();
    res.set('Cache-Control', 'no-store');
    return res.json({
      success: true,
      section,
      data: doc ? doc.data : defaultContent[section],
    });
  } catch (err) {
    console.error('[content] getSection error:', err);
    return res.status(500).json({ success: false, message: 'Could not load section.' });
  }
}

// Admin: upserts the section's data.
export async function saveSection(req, res) {
  const { section } = req.params;
  const { data } = req.body || {};
  if (!sectionKeys.includes(section)) {
    return res.status(404).json({ success: false, message: 'Unknown section.' });
  }
  if (data === undefined || data === null) {
    return res.status(400).json({ success: false, message: 'No data provided.' });
  }
  if (hasOversizedImage(data)) {
    return res.status(413).json({
      success: false,
      message: 'Image is too large. Please upload a smaller image (max ~3MB).',
    });
  }

  try {
    const doc = await Content.findOneAndUpdate(
      { section },
      { section, data, updatedBy: req.adminName || 'admin' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    invalidateCache();
    return res.json({ success: true, section, data: doc.data });
  } catch (err) {
    console.error('[content] saveSection error:', err);
    return res.status(500).json({ success: false, message: 'Could not save section.' });
  }
}

// Admin: resets a section back to the default seed.
export async function resetSection(req, res) {
  const { section } = req.params;
  if (!sectionKeys.includes(section)) {
    return res.status(404).json({ success: false, message: 'Unknown section.' });
  }
  try {
    await Content.deleteOne({ section });
    invalidateCache();
    return res.json({ success: true, section, data: defaultContent[section] });
  } catch (err) {
    console.error('[content] resetSection error:', err);
    return res.status(500).json({ success: false, message: 'Could not reset section.' });
  }
}
