import axios from "axios";
import qs from 'qs';
import { isTypeOf } from "./util";

const arr = [], 
        _slice = arr.slice;
const reg_get = /get/i, 
        reg_rquery = /\?/, 
        reg_repl = /\{\{(\w+)\}\}/g;

//响应数据拦截器，判断服务器状态
axios.interceptors.response.use(function( response ){
    // http code = 200 时进入
    return response;
}, function(error){
    // http code != 200 时进入 
    const { response = { } } = error;
    let { data = { }, status = 500 } = response;
    let { message, code = 500 } = data;

    if( /(503|504)/.test(status) ){
        code = status, message = $GLOBAL.DICT.TIPS.NETWORK["503"];
    }else if(status >= 500){
        code = status, message = $GLOBAL.DICT.TIPS.NETWORK["5XX"];
    }else if( /(404)/.test(status) ){
        code = status, message = $GLOBAL.DICT.TIPS.NETWORK["404"];
    }
    
    Object.assign(data, { message, code });
    return Object.assign( response, { data } );
});

//重新封装axios return ajax 组件
class Ajax {
    constructor( opts ){
        this.init( opts );
    }
    propertys() {
        this.contentType = 'application/json';
        this.isSerialize = false;
        this.isParse = false;
        this.type = 'GET';
        this.params = {};
    }
    init( opts ) {
        this.propertys();
        this.setOption( opts );
    }
    setOption( opts = { } ){
        Object.assign(this, opts);
        return this;
    }
    setParame(key, val) {
        if(typeof key === 'object'){
            Object.assign(this.param, key);
        }else{
            this.param[key] = val;
        }
        return this;
    }
    removeParame(key) {
        delete  this.param[key];
    }
    getParam() {
        return this.params;
    }
    updateParams( params ){
        if(isTypeOf( params ) === "string"){
            this.params = params;
        }else{
            const temp = isTypeOf(params) === "function" ? 
                                params( this.params ) : params;
            Object.assign(this.params, temp);
        }
        return this;
    }
    updateUrlParams(url = ""){
        //解析url地址参数变量
        const self = this;
        return url.replace(/\{[\w_\.]+\}/g, function( key ){
            key = key.replace(/[\{\}]*/g, "");
            const val = self.params[key];
            val && delete self.params[key];
            return val;
        });
    }
    parse(params){
        if(typeof params === 'string'){
            try {
                params = JSON.parse(params);
            }catch (e){
                throw new Error(e);
                //暂不处理
            }
        }
        return params;
    }
    serialize(params) {
        params = this.parse( params );
        let temp = [];
        for(let key in params){
            temp.push(key + '=' + encodeURIComponent(params[key]));
        }
        return temp.join("&");
    }
    get(str = "") {

        const argus = _slice.apply(arguments, [2]);
        let than = this, url = than.url,
            isSerialize = than.isSerialize,
            isParse = than.isParse,
            isGet = reg_get.test(than.type),
            params = than.getParam(),
            options = {
                "url" : than.updateUrlParams( url ),
                "json" : true,
                "method" : than.type,
                "timeout" : 150000,
                "headers" : {
                    "Content-Type" : than.contentType,
                }
            }, t = new Date();

        const rKey = Math.random().toString(32).substr(2);

        if(isGet){
            options.url +=  (reg_rquery.test(url) ? "&" : "?") + qs.stringify(params) + "&_t=" + rKey;        // 添加时间戳.(只给get请求添加时间戳)
        } else if (isSerialize){
            options.data = than.serialize(params);
        } else if(isParse){
            options.data = than.parse(params);
        } else {
            options.data = JSON.stringify(params);
        }

        return axios(options).then((res) => {
            let { data = { } } = res;
            return handle(str, this.parse(data));            //数据过滤处理
        }).catch( failure );

    }
}

const handle = (str, data) => {
    let parts;
    if (str) {
        parts = str.split('.');
        parts.every(( skey ) => {
            data = data[skey] !== null ? data[skey] : undefined;
            return toString.call(data) == "[object Object]";
        })
    }
    return data;
}

//请求失败句柄  catch
const failure = ( err ) => {
    console.error("请求出错", err);
    return err;
}

module.exports = ( opts ) => {
    if(opts instanceof Array){
        const list = opts.map(opt => new Ajax(opt) );
        return (strs = []) => axios.all( list.map( (ajax, key) => {
                            const str = strs[key] || "";
                            return ajax.get(str);
                        })
                    ).catch( failure );
    }else{
        return new Ajax( opts );
    }
}
