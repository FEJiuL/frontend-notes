
/**
 * ==== 微信分享 ====
 */
export const WeChatShare = withRouter( 
    class Component extends PureComponent{
        constructor(props){
            super(props)
            this.state = { load : true };
            this.loadJSSDK();
        }
        /**
         * == 加载微信 JS SDK ==
         */
        loadJSSDK(){
            if( window.wx ) return ;
            const dom = document.createElement("script");
            dom.src = "https://res.wx.qq.com/open/js/jweixin-1.2.0.js";
            dom.type = "text/javascript";
            dom.onload = () => { 
                this.setState({ load : false });
                this.initShare();
            };
            document.body.appendChild(dom);
        }
        /**
         * == 初始化微信分享配置 ==
         */
        initShare(){
            wx.ready(() => {
                const opts = this.getShareOpts();
                wx.hideMenuItems({ menuList : this.menuList })
                wx.onMenuShareAppMessage( opts );      //分享给朋友
                wx.onMenuShareTimeline( opts );        //分享到朋友圈
            });
        }
        URLSign = Ajax(API.DICT.WECHAT.APPID)
        menuList = [
            "menuItem:copyUrl",
            "menuItem:share:qq",
            "menuItem:share:QZone",
            "menuItem:share:weiboApp",
            "menuItem:share:facebook",
            "menuItem:openWithQQBrowser",
            "menuItem:openWithSafari"
        ]
        /**
         * == 默认分享参数 ==
         */
        defOpts = {
            title  : 'share itle',                            
            desc   : 'share desc', 
            imgUrl : `share icon url`,     
            shareLink : `share link`
        }
        /**
         * == 应用分享配置 ==
         * @param {*} data 
         */
        applyConfig( data = { } ){
            wx.config({ 
                ...data, 
                debug : false,       
                appId : BASE.APPID, 
                jsApiList : [
                    "showMenuItems",
                    "hideMenuItems",
                    "onMenuShareTimeline",
                    "onMenuShareAppMessage"
                ]
            });
        }
        /**
         * == 合并分享参数 ==
         * @param {*} opts 
         */
        getShareOpts( opts = { } ){
            return Object.assign({ }, this.defOpts, opts);
        }
        /**
         * == 获取微信分享url签名 ==
         */
        getShareURLSign(){
            //SDK 加载完成后再请求接口签名
            if( !this.state.load ){
                const url = location.href.split("#")[0];
                this.URLSign.updateParams({ appId : appId,  url })
                        .get("data")
                        .then( this.applyConfig.bind(this) )
            }
        }
        render(){
            this.getShareURLSign();
            return null;
        }
    }
)
