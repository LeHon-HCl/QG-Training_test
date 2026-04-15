// src/middlewares/compose.js
function compose(middlewares) {
  if (!Array.isArray(middlewares)) {
    throw new TypeError('Middlewares stack must be an array!');
  }
  for (const fn of middlewares) {
    if (typeof fn !== 'function') {
      throw new TypeError('Middleware must be composed of functions!');
    }
  }

  return function (req, res, next) {
    let index = -1;
    function dispatch(i) {
      if (i <= index) {
        return Promise.reject(new Error('next() called multiple times'));
      }
      index = i;
      let fn = middlewares[i];
      if (i === middlewares.length) fn = next;
      if (!fn) return Promise.resolve();

      try {
        // ✅ 关键修改：等待 fn 返回的 Promise 完成
        return Promise.resolve(fn(req, res, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return dispatch(0);
  };
}

module.exports = compose;