import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

function dataUrlToMedia(dataUrl) {
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.*)$/.exec(dataUrl);
  if (!match) return null;
  return { mediaType: match[1], data: match[2] };
}

function mockGroups(photos) {
  return [{ name: 'All Photos', indices: photos.map((_, i) => i) }];
}

// Pass 1: Describe each photo individually (batches of 20)
async function describePhotos(photos, offset = 0) {
  const content = [];
  photos.forEach((photo, i) => {
    const media = dataUrlToMedia(photo.thumbSrc);
    content.push({ type: 'text', text: `[Photo ${offset + i}]` });
    if (media) {
      content.push({ type: 'image', source: { type: 'base64', media_type: media.mediaType, data: media.data } });
    } else {
      content.push({ type: 'text', text: '(unavailable)' });
    }
  });

  content.push({
    type: 'text',
    text: `Analyse each of the ${photos.length} photos above carefully and return a JSON array with one object per photo (in order, starting at index ${offset}).

These photos are from a professional shoot and are already sorted by filename (chronological shoot order). Photos with nearby indices were likely shot within seconds of each other and may be very similar.

For each photo provide:
{
  "index": <photo number>,
  "filename": "<filename>",
  "shotType": "detail" | "portrait" | "half-body" | "full-body" | "landscape",
  "subjects": "<who/what — e.g. 'couple', 'solo woman', 'hands with ring', 'family of four'>",
  "pose": "<brief pose — e.g. 'forehead touch', 'hands clasped', 'embracing from behind', 'looking up'>",
  "background": "<brief background — e.g. 'blue cloudy sky', 'warm garden bokeh', 'dark temple interior', 'golden hour field'>"
}

shotType rules:
- "detail" = close-up of hands, rings, flowers, jewellery, feet — no face visible
- "portrait" = face/head/shoulders dominant
- "half-body" = waist-up visible
- "full-body" = entire body visible
- "landscape" = no main human subject

Return ONLY a JSON array of ${photos.length} objects. No explanation.`,
  });

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: photos.length * 120,
    messages: [{ role: 'user', content }],
  });

  const text = message.content.find((c) => c.type === 'text')?.text ?? '';
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('No JSON array in description response');
  return JSON.parse(match[0]);
}

// Pass 2: Group by comparing descriptions — text only, no images
async function groupByDescriptions(descriptions) {
  const descText = descriptions
    .map((d) => `Photo ${d.index} (${d.filename ?? ''}): type=${d.shotType} | subjects=${d.subjects} | pose=${d.pose} | bg=${d.background}`)
    .join('\n');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Group these ${descriptions.length} photos into clusters based on their descriptions.

IMPORTANT: Photos are sorted by filename (shoot order). Consecutive photo numbers were taken close together in time and are strong candidates for the same group.

Photos:
${descText}

Grouping rules — photos belong together ONLY if they share ALL of:
1. Same shotType ("detail" shots NEVER go with "portrait", "half-body", or "full-body")
2. Same subjects (same people/objects, same count)
3. Similar pose (very close match — "forehead touch" ≠ "looking away")
4. Similar background/location

Use filename proximity as a strong hint: if two photos have consecutive or near-consecutive numbers AND similar descriptions, they almost certainly belong together.

Additional rules:
- Be strict on pose/background — different location or pose = different group even if subjects are same
- Order indices within each group by filename order (ascending) so similar shots stay adjacent
- Give each group a short descriptive name (2–4 words) e.g. "Hands — Ring Detail", "Sky — Couple Silhouette", "Temple — Family Seated"
- Every photo index must appear in exactly one group

Return ONLY valid JSON:
{
  "groups": [
    { "name": "Group name", "indices": [0, 1, 2] },
    { "name": "Another group", "indices": [3, 4] }
  ]
}`,
    }],
  });

  const text = message.content.find((c) => c.type === 'text')?.text ?? '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in grouping response');
  return JSON.parse(match[0]).groups;
}

app.post('/api/classify', async (req, res) => {
  const { photos } = req.body ?? {};
  if (!Array.isArray(photos) || photos.length === 0) {
    return res.status(400).json({ error: 'photos array required' });
  }

  if (!anthropic) {
    return res.json({ groups: mockGroups(photos), mocked: true });
  }

  try {
    // Pass 1: Describe photos in batches of 20
    const BATCH = 20;
    const allDescriptions = [];
    for (let i = 0; i < photos.length; i += BATCH) {
      const batch = photos.slice(i, i + BATCH);
      const descs = await describePhotos(batch, i);
      allDescriptions.push(...descs);
    }

    // Pass 2: Group using descriptions only (cheap text-only call)
    const groups = await groupByDescriptions(allDescriptions);

    // Validate all indices present
    const seen = new Set(groups.flatMap((g) => g.indices));
    const missing = photos.map((_, i) => i).filter((i) => !seen.has(i));
    if (missing.length > 0) groups.push({ name: 'Other', indices: missing });

    res.json({ groups, mocked: false });
  } catch (err) {
    console.error('classify error', err);
    res.json({ groups: mockGroups(photos), mocked: true, error: String(err) });
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`Snapsort backend listening on :${PORT}`));
