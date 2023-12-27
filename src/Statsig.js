const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

const djb2 = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const character = value.charCodeAt(i);
    hash = (hash << 5) - hash + character;
    hash = hash & hash; // Convert to 32bit integer
  }
  return String(hash >>> 0);
};

const sortObject = (obj) => {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  return Object.keys(obj)
    .sort()
    .reduce(
      (acc, key) => ({
        ...acc,
        [key]: obj[key] instanceof Object ? sortObject(obj[key]) : obj[key],
      }),
      {}
    );
};

var Statsig = (() => {
  const BASE_URL = "https://api.statsig.com/v1/";
  const DEFAULT_OPTIONS = {
    cacheTtlSeconds: 60,
  };
  const STORE_KEY = "statsig-store";

  var _sdkKey = "";
  var _user = {};
  var _options = {};
  var _store = {};
  var _events = [];

  const post = (endpoint, data) => {
    return fetch(BASE_URL + endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "STATSIG-API-KEY": _sdkKey,
        "STATSIG-SDK-TYPE": "js-xs",
        "STATSIG-SDK-VERSION": "1.0.0",
      },
      body: JSON.stringify(data),
    });
  };

  const flush = () => {
    if (_events.length === 0) {
      return;
    }

    const response = post("rgstr", { events: _events, user: _user });
    _events = [];
    return response;
  };

  const deboucedFlush = debounce(flush, 5000);
  const log = (eventName, value, metadata, secondaryExposures) => {
    _events.push({ eventName, metadata, value, secondaryExposures });
    _events.length > 10 ? flush() : deboucedFlush();
  };

  const getFromStore = (type, name) => {
    const key = type == "config" ? "dynamic_configs" : "feature_gates";
    const result = _store[key]?.[djb2(name)];
    if (result) {
      log(`statsig::${type}_exposure`, null, { ...result, [type]: name });
    }

    return result;
  };

  const loadCache = (userHash) => {
    const cacheStr = localStorage.getItem(STORE_KEY);
    const cache = cacheStr ? JSON.parse(cacheStr) : {};

    if (
      cache.userHash === userHash &&
      cache.hashed_sdk_key_used === djb2(_sdkKey)
    ) {
      _store = cache;
    }

    return (
      _store.cacheTime &&
      Date.now() - _store.cacheTime < 1000 * _options.cacheTtlSeconds
    );
  };

  // Public
  return {
    /**
     * Initalizes the Statsig SDK, fetching the latest configurations for the given user.
     * @param {string} sdkKey
     * @param {?object} user
     * @param {?object} options
     * @returns
     */
    init: async (sdkKey, user, options) => {
      _sdkKey = sdkKey;
      _user = user ?? {};
      _options = { ...DEFAULT_OPTIONS, ...options };

      const userHash = djb2(JSON.stringify(sortObject(_user)));
      if (loadCache(userHash)) {
        return;
      }

      const result = await post("initialize", { user, hash: "djb2" });
      _store = await result.json();
      _store.userHash = userHash;
      _store.cacheTime = Date.now();

      localStorage.setItem(STORE_KEY, JSON.stringify(_store));
    },

    /**
     * Checks if a gate is enabled for the current user
     * @param {string} gate - The name of the gate being checked
     * @returns {boolean}
     */
    gate: (gate) => {
      const result = getFromStore("gate", gate);
      return result?.value === true;
    },

    /**
     * Gets the value of an experiment for the current user
     * @param {string} experiment - The name of the experiment being checked
     * @returns {?object}
     */
    experiment: (experiment) => {
      const result = getFromStore("config", experiment);
      return result?.value;
    },

    /**
     * Flushes any pending events to Statsig
     * @returns {Promise<Response>}
     */
    flush,

    /**
     * Logs an event to Statsig
     */
    log,
  };
})();

if (typeof window !== "undefined") {
  window.Statsig = Statsig;
}

export default Statsig;
