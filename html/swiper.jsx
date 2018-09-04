
export class TRCSwiper extends PureComponent{
    constructor(props){
        super(props);
        this.initChildBullet();
    }
    state = { activeIndex : 0 }
    initChildBullet(){
        this.bullet = [ ]
        let { children = [ ] } = this.props;
        return children.map((child, index) => {
            const { label = "", value = index } = child.props;
            this.bullet.push({ label, value });
        })
    }
    defConf = {
        freeMode : false,
        bulletClass : "bullet", 
        slidesPerView : 1,
        slideNextClass : "next",
        slidePrevClass : "prev",
        slideActiveClass : "activity",
        bulletActiveClass : "activity",
        paginationCurrentClass : "current",
        paginationClickable : true,
        paginationBulletRender : ( swiper, index, className ) => {
            if( swiper.slides.length > 1 ){
                return `<li class="${className}">${ this.bullet[index].label }</li>`;
            }else{
                return "";
            }
        },
        onSlideChangeEnd : ( swiper ) => {
            const { historyKey } = this.props;
            const { activeIndex = 0 } = swiper;
            if( historyKey ){   //如果有设置historyKey则保存slide切换状态
                history.replaceState(this.merge(
                    this.getHistoryState(),
                    { [ historyKey ] : activeIndex }
                ), null, location.pathname);
            }
            this.setState({ activeIndex })
        }
    }
    getHistoryState(){
        return history.state || { };
    }
    merge( ...rest ){
        return rest.reduce( ( object, current ) => {
            return Object.assign( object, current )
        }, { });
    }
    componentWillMount(){
        const { historyKey = "tabs", conf = { } } = this.props;
        const { [ historyKey ] : activeIndex = 0 } = this.getHistoryState();    //获取history堆栈中state用以定位到指定slide
        this.setState({ activeIndex, conf });                                   //设置初始化默认值
    }
    componentDidMount() {
        const { activeIndex, conf } = this.state;
        const swiper = new Swiper(
            this.refs.container, 
            this.merge(this.defConf, {          //合并conf参数
                initialSlide : activeIndex,
                pagination : this.refs.tabs,
            }, conf)
        );
    }
    hasActivity( index, activity = true ){
        return activity && (this.state.activeIndex == index);
    }
    renderChildren(){
        const { children, activity } = this.props;
        return React.Children.map(children, ( child, index ) => {
            return React.cloneElement(child, {
                activity : this.hasActivity( index, activity )
            })
        })
    }
    render(){
        const { className = "" } = this.props;
        return (
            <div className={ `${className} swiper-subassembly` }>
                <div className="swiper-tab">
                    <ul className="clearfix" ref="tabs">

                    </ul>
                </div>
                <div className="swiper-container" ref="container">
                    <div className="swiper-wrapper clearfinx">
                        { this.renderChildren() }
                    </div>
                </div>
            </div>
        )
    }
}
