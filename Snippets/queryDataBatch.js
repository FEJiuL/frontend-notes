/**
* == vuex action 批量查询缓存（抽象伪代码） ==
*/
function queryDataBatch(
    { state, commit },
    { module, keys = [], key, callback }
  ) {
    // 加载器
    let loader = (function (func) {
      let req,
        arr = [];
      return (cKey) => {
        // 已缓存
        let val = _.get(state, [module, cKey]);
        if (val) return Promise.resolve(val);
        // 加载中
        let loadKey = ["load", module, cKey].join("__");
        if (state[loadKey]) return state[loadKey];
        // 未缓存
        arr.push(cKey);
        if (!req) req = Promise.resolve().then(func.bind(null, { keys: arr }));
        // 缓存数据
        req = req.then((data) => {
          let val = key ? data : data[cKey];
          commit(TYPES.SET_CACHE_VAL, { module, key: cKey, val });
          return data;
        });
        // 添加加载中状态
        commit(TYPES.SET_CACHE_LOAD, { loadKey, val: req });
        // 移除加载状态
        req.finally(() => commit(TYPES.SET_CACHE_LOAD, { loadKey }));
        return req;
      };
    })(callback);

    // 单值查询
    if (key) return loader(key);
    // 多值查询（如果传字符串则转换为数组）
    if (_.isString(keys)) keys = keys.split(",");
    return Promise.all(keys.map(loader)).then(() => _.pick(state[module], keys));
  }
