//真实用户环境前端性能报告
const performanceReport = ({threshold = 1000}) => {
  window.onload = () => {
    const report = window.performance;
    const {loadEventStart, navigationStart} = report.timing;
    //当前端加载时长超过阈值时上报
    if (loadEventStart - navigationStart > threshold) {
      const img = document.createElement('img');
      img.src = `/proxy/report/performance?data=${encodeURIComponent(
        JSON.stringify(report)
      )}`;
      img.onload = () => (img = null);
    }
  };
  return '';
};

export default performanceReport;
