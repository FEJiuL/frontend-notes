// ==UserScript==
// @name         构建版本分支-禅道
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://zentao.babycare.com/build-view-*.html
// @icon         https://zentao.babycare.com/favicon.ico
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_openInTab
// ==/UserScript==
(function () {
  "use strict";
  // Your code here...
  const Gitlab_Token = "you token";
  const LogInfoStyle = "color: green";
  const LogWarnStyle = "color: #ff9800";
  const LogErrorStyle = "color: red";

  /**
   * == gitlab请求封装 ==
   * @param param0
   * @returns
   */
  const Gitlab_xmlhttpRequest = ({ url, method = "GET" }) =>
    new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        url: `http://gitlab.babycare.com/api/v4` + url,
        method,
        headers: {
          "PRIVATE-TOKEN": Gitlab_Token,
        },
        onload({ response, status }) {
          let ret = null;
          if (response) ret = JSON.parse(response);
          // 判断接口是否成功
          if ([200, 201].includes(status)) resolve(ret);
          else reject(ret);
        },
      });
    });

  /**
   * == 获取gitlab项目详情 ==
   * @param payload
   * @returns
   */
  function getProjectByName(payload) {
    let { pname = "" } = payload;
    return Gitlab_xmlhttpRequest({
      url: `/projects?search=${pname}&simple=true`,
    }).then((list) => {
      let item = list.find((item) => item.name === pname);
      // 存在项目信息
      if (item) {
        payload.project = item;
        payload.pid = item.id;
        // 打印日志
        console.log(
          `%c【项目${pname}】：详情获取成功，pid：${item.id}`,
          LogInfoStyle
        );
        return payload;
      } else {
        return Promise.reject({
          message: `【项目${pname}】：详情获取失败，请重试！`,
        });
      }
    });
  }

  /**
   * == 获取任务分支信息 ==
   * @param payload
   * @returns
   */
  function getBranchList(payload) {
    return Gitlab_xmlhttpRequest({
      url: `/projects/${payload.pid}/repository/branches?per_page=100&search=task-`,
    }).then((list) => {
      if (list.length > 0) {
        payload.branch_list = list;
        // 打印日志
        console.log(
          `%c【项目${payload.pname}】：任务分支列表获取成功`,
          LogInfoStyle
        );
        return payload;
      } else {
        return Promise.reject({
          message: `【项目${payload.pname}】：未找到相关task分支`,
        });
      }
    });
  }

  /**
   * == 创建分支 ==
   * @param payload
   * @returns
   */
  function createBranch(payload) {
    return Gitlab_xmlhttpRequest({
      url: `/projects/${payload.pid}/repository/branches?branch=${payload.buildId}&ref=master`,
      method: "POST",
    })
      .then(() => {
        // 打印日志
        console.log(
          `%c【项目${payload.pname}】：目标分支${payload.buildId}创建成功`,
          LogInfoStyle
        );
        return payload;
      })
      .catch((err) => {
        return Promise.reject({
          message: `【项目${payload.pname}】：目标分支${payload.buildId}创建失败，原因：${err.message}`,
        });
      });
  }

  /**
   * == 提交mr ==
   * @param payload
   * @returns
   */
  function submitMR(payload) {
    const { demand, branch_list, buildId, pid, statistics } = payload;
    let arr = branch_list.reduce((arr, { name = "" }) => {
      let code = name.split("-")[1];
      if (demand.includes(code)) {
        // 统计相关任务分支数
        statistics.taskBranch += 1;
        // 发起mr请求
        let ret = Gitlab_xmlhttpRequest({
          url: `/projects/${pid}/merge_requests?source_branch=${name}&target_branch=${buildId}&title=版本构建[${name}]->[${buildId}]`,
          method: "POST",
        })
          .then((ret) => {
            // 打印日志
            console.log(
              `%c【项目${payload.pname}】：分支[${name}->${buildId}]合并请求提交成功`,
              LogInfoStyle
            );
            return ret;
          })
          .catch((err) => {
            console.log(
              `%c【项目${payload.pname}】：分支[${name}->${buildId}]合并请求提交失败，原因：${err.message}`,
              LogWarnStyle
            );
            return err;
          });
        arr.push(ret);
      }
      return arr;
    }, []);
    return Promise.allSettled(arr).then(() => payload);
  }

  /**
   * == 获取打开的mr ==
   * @param payload
   * @returns
   * @todo 这里可能需要设置下延时获取（提交mr后检查冲突还需要点时间）
   */
  function getOpenedMR(payload) {
    // 设置3s延时
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        Gitlab_xmlhttpRequest({
          url: `/projects/${payload.pid}/merge_requests?state=opened&search=版本构建`,
        })
          .then((list) => {
            if (list.length > 0) {
              // 待处理的merge request列表
              payload.opened_mr = list;
              // 打印日志
              console.log(
                `%c【项目${payload.pname}】：获取opened merge request成功`,
                LogInfoStyle
              );
              resolve(payload);
            } else {
              reject({ message: "没有未合并分支" });
            }
          })
          .catch((err) => {
            return Promise.reject({
              message: `【项目${payload.pname}】：获取opened merge request失败，原因：${err.message}`,
            });
          });
      }, 2000);
    });
  }

  /**
   * == 接受mr ==
   * @param payload
   * @returns
   * @todo 合并要串行执行，不然容易出现合并冲突问题
   */
  function acceptMR(payload) {
    let unmerged = [],
      promise = Promise.resolve();
    const { opened_mr: list, pid } = payload;
    while (list.length > 0) {
      let item = list.shift();
      // 标记可合并的提交自动合并
      // 这里使用串行执行，每个任务间隔1s执行为了给合并后代码重新checking，时间可根据checking时长调整
      if ("can_be_merged" === item.merge_status) {
        promise = promise.then(
          () =>
            new Promise((resolve) =>
              setTimeout(
                () =>
                  Gitlab_xmlhttpRequest({
                    url: `/projects/${pid}/merge_requests/${item.iid}/merge`,
                    method: "PUT",
                  })
                    .then((res) => {
                      // 合并失败的统一存放到未合并队列
                      if (res.state !== "merged") {
                        unmerged.push(item);
                        // 打印日志
                        console.log(
                          `%c【项目${payload.pname}】：分支[${item.source_branch}]自动合并处理失败，原因：${res.merge_error}`,
                          LogWarnStyle
                        );
                      } else {
                        // 打印日志
                        console.log(
                          `%c【项目${payload.pname}】：分支[${item.source_branch}]自动合并处理成功`,
                          LogInfoStyle
                        );
                      }
                      resolve();
                    })
                    .catch((err) => {
                      // 合并失败的统一存放到未合并队列
                      unmerged.push(item);
                      // 打印日志
                      console.log(
                        `%c【项目${payload.pname}】：分支[${
                          item.source_branch
                        }]自动合并处理失败，原因：${err.message || "未知"} `,
                        LogWarnStyle
                      );
                      resolve();
                    }),
                1000
              )
            )
        );
      }
      // 将checking中的分支放到队列尾部执行
      else if (["checking", "unchecked"].includes(item.merge_status)) {
        item.merge_status = "can_be_merged";
        list.push(item);
      }
      // 不可合并的存放到未合并队列
      else {
        unmerged.push(item);
        // 打印日志
        console.log(
          `%c【项目${payload.pname}】：分支[${item.source_branch}]无法自动合并，原因：${item.merge_status}`,
          LogWarnStyle
        );
      }
    }
    return promise.then(() => {
      payload.unmerged = unmerged;
      console.log(
        `%c【版本${payload.buildId}】：共${payload.statistics.demand}需求，涉及${payload.statistics.taskBranch}个任务分支`,
        "color: #0c64eb"
      );
      return payload;
    });
  }

  /**
   * == 关闭mr ==
   * @param payload
   * @returns
   */
  function closeMR(payload) {
    const { opened_mr: list, pid } = payload;
    const arr = list.reduce((arr, item) => {
      const ret = Gitlab_xmlhttpRequest({
        url: `/projects/${pid}/merge_requests/${item.iid}`,
        method: "DELETE",
      })
        .then((res) => {
          console.log(res);
          return res;
        })
        .catch((err) => {
          console.log(err.message);
          return Promise.resolve(err);
        });
      arr.push(ret);
      return arr;
    }, []);
    return Promise.allSettled(arr);
  }


  // 页面添加一键关联按钮
  var $target = $("#stories .actions")[0];
  var $btn = $(
    `<a href="javascript:void(0);" class="btn btn-primary">构建版本分支</a>`
  );
  var $closeBtn = $(
    `<a href="javascript:void(0);" class="btn btn-primary">关闭mr</a>`
  );
  // 绑定点击事件
  $btn.click((evt) => {
    // gitlab项目名
    var pname = window.prompt("请输入Gitlab项目名", "");
    // 获取版本编号
    var buildId =
      "release/-v" + $(".page-title span.text").attr("title").split("-")[1];
    // 获取版本内需求id列表
    var $elems = $("#stories .text-center td.c-id");
    var demand = [].map.call($elems, ($el) => $el.innerText.trim());
    var len = demand.length;
    // 有需求则处理分支
    if (demand.length > 0) {
      Promise.resolve({
        pname,
        demand, // 需求id列表
        buildId, // 版本id
        // 统计数据
        statistics: {
          demand: len, // 需求数
          taskBranch: 0, // 任务分支数
        },
      })
        .then((payload) => {
          console.log(`==== 构建开始 ====`);
          return payload;
        })
        .then(getProjectByName) // 获取项目信息
        .then(getBranchList) // 获取分支信息
        .then(createBranch) // 创建版本分支
        .then((payload) => {
          console.log(`==== 等待处理merge request ====`);
          return payload;
        })
        .then(submitMR) // 提交mr
        .then(getOpenedMR) // 获取opened mr
        .then(acceptMR) // 接受mr
        .then((payload) => {
          const { unmerged, project } = payload;
          if (unmerged.length > 0) {
            if (
              window.confirm(
                `${unmerged.length}个分支无法自动合并,是否前往手动处理`
              )
            )
              // 新窗口打开gitlab
              GM_openInTab(`${project.web_url}/-/merge_requests`, {
                active: true,
              });
          } else window.alert("处理成功");
        })
        .catch((err) => {
          console.log(`%c${err.message}`, LogErrorStyle);
          window.alert(err.message);
        })
        .finally(() => console.log(`==== 构建结束 ====`));
    }
  });
  $closeBtn.click((evt) => {
    // gitlab项目名
    var pname = window.prompt("请输入Gitlab项目名", "");
    // 获取版本编号
    var buildId = $(".page-title span.text").attr("title");
    Promise.resolve({ pname, buildId })
      .then(getProjectByName)
      .then(getOpenedMR)
      .then(closeMR)
      .then((payload) => {
        console.log("删除成功");
      })
      .catch((err) => {
        console.error(`删除失败：${err.message}`);
      });
  });
  $btn.appendTo($target);
  // $closeBtn.appendTo($target);
})();
