/**
 * == 顺序执行promise ==
 * @param {*} funcs - 执行队列
 * @returns
 */
export function runPromiseInSequence(funcs) {
  return function (ctx = {}) {
    return funcs.reduce(
      (china, func) => china.then(() => func(ctx)),
      Promise.resolve(ctx)
    );
  };
}
