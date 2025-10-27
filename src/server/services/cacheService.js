const cache = new Map();

function set(key, value) {
  cache.set(key, value);
}

function get(key) {
  return cache.get(key);
}

function has(key) {
  return cache.has(key);
}

function del(key) {
    cache.delete(key);
}

const cacheService = {
  set,
  get,
  has,
  del,
};

export default cacheService;
