const Entry = require('../models/Entry');

const validDate = d => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const t = Date.parse(d + 'T00:00:00Z');
  return !isNaN(t) && new Date(t).toISOString().slice(0, 10) === d;
};

const nearToday = d => Math.abs(Date.parse(d + 'T00:00:00Z') - Date.now()) <= 2 * 864e5; // covers all timezones

exports.getEntries = async (req, res) => {
  try {
    const list = await Entry.find({ user: req.uid })
      .sort({ date: -1 })
      .limit(400)
      .select('date text palette')
      .lean();
    res.json(list.map(e => ({ date: e.date, snippet: e.text.slice(0, 80), palette: e.palette })));
  } catch (err) {
    console.error('getEntries error:', err);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
};

exports.getEntryByDate = async (req, res) => {
  const { date } = req.params;
  if (!validDate(date)) {
    return res.status(400).json({ error: 'Bad date' });
  }

  try {
    const entry = await Entry.findOne({ user: req.uid, date }).lean();
    res.json({
      date,
      text: entry ? entry.text : '',
      palette: entry ? entry.palette : null,
    });
  } catch (err) {
    console.error('getEntryByDate error:', err);
    res.status(500).json({ error: 'Failed to fetch entry' });
  }
};

exports.saveEntry = async (req, res) => {
  const { date } = req.params;
  const { text, palette } = req.body;

  if (!validDate(date) || !nearToday(date)) {
    return res.status(400).json({ error: 'You can only write today\u2019s entry' });
  }
  if (typeof text !== 'string' || text.length > 4000) {
    return res.status(400).json({ error: 'Entry too long' });
  }

  const pal = Number.isInteger(palette) && palette >= 0 && palette <= 9 ? palette : 0;

  try {
    if (!text.trim()) {
      await Entry.deleteOne({ user: req.uid, date });
      return res.json({ ok: true });
    }

    await Entry.updateOne(
      { user: req.uid, date },
      { $set: { text, palette: pal } },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('saveEntry error:', err);
    res.status(500).json({ error: 'Failed to save entry' });
  }
};
