'use strict';

import { data } from '@ampt/data';
import session from 'express-session';

const oneDayInSeconds = 86400;

export default class CustomStore extends session.Store {
  constructor(options = {}) {
    super();
    this.prefix = options.prefix || 'sess:';
    this.reapInterval = options.reapInterval || 0;
    if (this.reapInterval > 0) {
      this._reap = setInterval(this.reap.bind(this), this.reapInterval);
    }
  }

  async get(sid) {
    try {
      const result = await data.get(`${this.prefix}${sid}`);
      console.log('Session get:', { sid, hasSession: !!result });
      return result ? JSON.parse(result) : null;
    } catch (err) {
      console.error('Session get error:', err);
      return null;
    }
  }

  async set(sid, session) {
    try {
      await data.set(`${this.prefix}${sid}`, JSON.stringify(session));
      console.log('Session set:', { sid, session });
    } catch (err) {
      console.error('Session set error:', err);
      throw err;
    }
  }

  async touch(sessionId, session, callback) {
    try {
      session.lastAccess = Date.now();
      this.set(sessionId, session, callback);
    } catch (error) {
      callback(error);
    }
  }

  async destroy(sessionId, callback) {
    try {
      const key = this.prefix + sessionId;
      await data.remove(key);
      callback(null, true);
    } catch (error) {
      callback(error);
    }
  }

  getExpiresValue(sess) {
    const now = Math.floor(Date.now() / 1000);
    return typeof sess.cookie.maxAge === 'number'
      ? now + (sess.cookie.maxAge / 1000)
      : now + oneDayInSeconds;
  }

  async reap(callback = () => {}) {
    try {
      const now = Math.floor(Date.now() / 1000);
      const allSessions = await data.get(this.prefix + '*');
      
      for (const [key, value] of Object.entries(allSessions)) {
        const sess = JSON.parse(value);
        if (sess.expires && now >= sess.expires) {
          await data.remove(key);
        }
      }
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  clearInterval() {
    if (this._reap) clearInterval(this._reap);
  }
}