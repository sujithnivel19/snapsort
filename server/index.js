import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const POSE_GROUPS = ['Portrait — Solo', 'Couple — Close', 'Group — Family', 'Portrait — Candid'];

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

function dataUrlToMedia(dataUrl) {
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.*)$/.exec(dataUrl);
  if (!match) return null;
  return { mediaType: match[1], data: match[2] };
}

app.post('/api/classify', async (req, res) => {
  const { photos } = req.body ?? {};
  if (!Array.isArray(photos)) {
    return res.status(400).json({ error: 'photos array required' });
  }

  if (!anthropic) {
    // No API key configured — deterministic mock fallback.
    const labels = photos.map((_, i) => POSE_GROUPS[i % POSE_GROUPS.length]);
    return res.json({ labels, mocked: true });
  }

  try {
    const labels = [];
    for (const photo of photos) {
      const media = dataUrlToMedia(photo.thumbSrc);
      if (!media) {
        labels.push(POSE_GROUPS[POSE_GROUPS.length - 1]);
        continue;
      }
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 20,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: media.mediaType, data: media.data } },
              {
                type: 'text',
                text:
                  `Classify this wedding/portrait photo into exactly one of these pose categories: ` +
                  `${POSE_GROUPS.join(', ')}. Reply with only the category name, nothing else.`,
              },
            ],
          },
        ],
      });
      const text = message.content.find((c) => c.type === 'text')?.text?.trim() ?? '';
      const label = POSE_GROUPS.find((g) => text.includes(g)) ?? POSE_GROUPS[POSE_GROUPS.length - 1];
      labels.push(label);
    }
    res.json({ labels, mocked: false });
  } catch (err) {
    console.error('classify error', err);
    const labels = photos.map((_, i) => POSE_GROUPS[i % POSE_GROUPS.length]);
    res.json({ labels, mocked: true, error: String(err) });
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`Snapsort backend listening on :${PORT}`));
