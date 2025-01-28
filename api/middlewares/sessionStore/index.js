import session from 'express-session';
import { v4 } from 'uuid';
import CustomStore from './customStore';
import config from '../../config/environment.js';

export default function() {
  return session({
    genid: req => req.sessionID = req.sessionID || v4(),
    secret: config.SESSION_ID,
    resave: false,
    saveUninitialized: false,
    store: new CustomStore({
      prefix: 'sessions:',
      reapInterval: 86400000
    }),
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
      domain: config.domain,
      maxAge: 24 * 60 * 60 * 1000,
      signed: true
    }
  });
}