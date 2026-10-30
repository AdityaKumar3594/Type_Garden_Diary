const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../middleware/auth');

const DUMMY_HASH = bcrypt.hashSync('dummy-password', 12);

const extractCredentials = body => {
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  return { username, password };
};

exports.signup = async (req, res) => {
  const { username, password } = extractCredentials(req.body);
  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    return res.status(400).json({ error: 'Username: 3-24 letters, numbers or _' });
  }
  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: 'Password must be 8-72 characters' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, passwordHash });
    signToken(res, user);
    res.json({ username });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ error: 'Username is taken' });
    }
    console.error('Signup error:', e);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = extractCredentials(req.body);
  const user = await User.findOne({ username: String(username) });
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok) {
    return res.status(401).json({ error: 'Wrong username or password' });
  }
  signToken(res, user);
  res.json({ username });
};

exports.logout = (req, res) => {
  res.clearCookie('tg');
  res.json({ ok: true });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.uid).lean();
    if (!user) {
      return res.status(401).json({ error: 'Not signed in' });
    }
    res.json({ username: user.username });
  } catch (e) {
    console.error('getMe error:', e);
    res.status(500).json({ error: 'Server error' });
  }
};
