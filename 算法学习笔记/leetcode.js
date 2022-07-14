/**
 * == 1252. 奇数值单元格的数目 ==
 * @param {number} m
 * @param {number} n
 * @param {number[][]} indices
 * @return {number}
 */
var oddCells = function (m, n, indices) {
  let matrix = { row: new Array(m).fill(0), col: new Array(n).fill(0) };
  // 计算行列操作次数
  indices.forEach(([r, c]) => {
    matrix.row[r] += 1;
    matrix.col[c] += 1;
  });
  // 计算行列奇数个数
  ["row", "col"].forEach(
    (key) =>
      (matrix[key] = matrix[key].reduce((t, val) => {
        if (val % 2) t += 1;
        return t;
      }, 0))
  );
  let sum = 0;
  const { row, col } = matrix;
  if (row > 0 && n - col > 0) sum += row * (n - col);
  if (m - row > 0 && col > 0) sum += (m - row) * col;
  return sum;
};


/**
* == 735. 行星碰撞 ==
 * @param {number[]} asteroids
 * @return {number[]}
 */
var asteroidCollision = function (asteroids) {
  let stack = [],
    i = 0;
  while (asteroids.length > 0) {
    let start = asteroids[0];
    let idx = stack.length - 1;
    // 满足相撞条件
    if (start < 0 && idx >= 0 && stack[idx] > 0) {
      let right = stack[idx];
      if (start + right <= 0) stack.pop();
      if (start + right >= 0) asteroids.shift();
    }
    // 无满足相撞条件
    else stack.push(asteroids.shift());
  }
  return stack;
};
