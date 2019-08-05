import React, {PureComponent} from 'react';
import propTypes from 'prop-types';
/**
 * ==== 滚动加载更多 ====
 */
export default class ScrollView extends PureComponent {
  static propTypes = {
    loading: propTypes.bool, //scroll 触发后状态
    isMore: propTypes.bool, //是否加载更多
    scrollChange: propTypes.func.isRequired, //滚动回调函数
    renderAnchor: propTypes.func.isRequired, //滚动监听锚点节点
  };
  static defaultProps = {
    loading: false,
    isMore: false,
  };
  componentDidMount() {
    this.addScrollEvent()
  }
  addScrollEvent(){
    //添加滚动监听
    if (this.props.isMore) {
      const handle = this.scrollHandle();
      window.addEventListener('scroll', handle);
      this.removeScrollEvent = () =>
        window.removeEventListener('scroll', handle);
    }
  }
  componentDidUpdate() {
    if(!this.removeScrollEvent){
      this.addScrollEvent()
    }else if(!this.props.isMore){
      this.removeEventListener()
    }
  }
  scrollHandle = () => {
    return (e) => {
      this.isSole() && !this.props.loading && this.props.scrollChange();
    };
  };
  isSole(threshold = 20) {
    //window height
    const wh =
      window.innerHeight ||
      document.documentElement.clientHeight ||
      document.body.clientHeight;
    //scroll height
    const sh =
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop;
    //anchor coord
    const ay = this.refs.anchor.offsetTop;
    return wh + sh >= ay - threshold;
  }
  componentWillUnmount() {
    //卸载滚动监听
    this.removeScrollEvent && this.removeScrollEvent();
  }
  render() {
    const {loading, isMore, renderAnchor} = this.props;
    return (
      <React.Fragment>
        {this.props.children}
        <div ref='anchor'>{renderAnchor(loading, isMore)}</div>
      </React.Fragment>
    );
  }
}
