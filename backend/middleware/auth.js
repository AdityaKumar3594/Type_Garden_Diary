const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const { JWT_SECRET, NODE_ENV } = process.env;

const signToken = (res, user) => {
  const token = jwt.sign({ sub: String(user._id) }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('tg', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: NODE_ENV === 'production',
    maxAge: 7 * 864e5,
  });
};

const auth = (req, res, next) => {
  try {
    req.uid = jwt.verify(req.cookies.tg, JWT_SECRET).sub;
    next();
  } catch {
    res.status(401).json({ error: 'Not signed in' });
  }
};

const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again later.' },
});

module.exports = {
  signToken,
  auth,
  authLimit,
};
