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

  async get(sessionId, callback) {
    try {
      const key = this.prefix + sessionId;
      const sessionData = await data.get(key);

      if (!sessionData) {
        return callback(null, null);
      }

      const sess = JSON.parse(sessionData);
      const now = Math.floor(Date.now() / 1000);
      
      if (sess.expires && now >= sess.expires) {
        return callback(null, null);
      }
      
      callback(null, sess);
    } catch (error) {
      callback(error);
    }
  }

  async set(sessionId, session, callback) {
    try {
      const key = this.prefix + sessionId;
      
      if (session.cookie) {
        session.cookie.expires = new Date(session.cookie.expires);
      }
      
      const expires = this.getExpiresValue(session);
      const payload = JSON.stringify({...session, expires});

      await data.set(key, payload);
      callback(null);
    } catch (error) {
      callback(error);
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