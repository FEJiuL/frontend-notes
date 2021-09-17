/**
 * @param {character[][]} board
 * @return {character[][]} board
 */
var solveSudoku = function (board) {
  let h = board.length;
  let w = board[0].length;
  let m = { row: [], col: [], grid: [], blank: [] };

  // 初始化宫格信息
  for (let i = 0; i < h; i++) {
    m.row[i] = new Set();
    m.col[i] = new Set();
    m.grid[i] = new Set();
  }

  // 遍历收集宫格图信息
  for (let x = 0; x < h; x++) {
    for (let y = 0; y < w; y++) {
      let val = board[x][y];
      let z = Math.floor(x / 3) * 3 + Math.floor(y / 3);
      // 收集空格
      if (val == ".") m.blank.push([x, y, z]);
      // 收集已存在数字
      else {
        m.row[x].add(val);
        m.col[y].add(val);
        m.grid[z].add(val);
      }
    }
  }

  // 遍历填值
  let s = 0;
  let { blank } = m;
  while (s != blank.length) {
    s = blank.length;
    for (let i = 0; i < blank.length; i++) {
      let set = new Set();
      const [x, y, z] = blank[i];
      for (v = 1; v <= 9; v++) {
        let val = v.toString();
        // 存在则跳过
        if (m.row[x].has(val) || m.col[y].has(val) || m.grid[z].has(val))
          continue;
        else set.add(val);
      }
      // 判断是否取到唯一解
      if (set.size == 1) {
        let val = set.values().next().value;
        board[x][y] = val;
        m.row[x].add(val);
        m.col[y].add(val);
        m.grid[z].add(val);
        // 有解移除空白节点
        blank.splice(i, 1);
        i -= 1;
      }
    }
  }
  if (s > 0) return "未找到最优解";
  return board;
};
