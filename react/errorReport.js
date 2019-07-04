//用户端全局错误捕获事件
const errorReport = () => {
  let ua = window.navigator.userAgent;
  window.onerror = (msg, file, line, col, err) => {
    const time = +new Date(); //用户系统时间
    const stack = err.stack; //错误js堆栈
    const report = {msg, file, line, col, stack, time, ua}; //错误上报报文
    const img = document.createElement('img');
    img.src = `/proxy/report/error?data=${encodeURIComponent(
      JSON.stringify(report)
    )}`;
    img.onload = () => (img = null);
  };
  return '';
};

export default errorReport;
