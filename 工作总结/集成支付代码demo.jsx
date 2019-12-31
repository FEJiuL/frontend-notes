//乐课支付集成支付组件化（可支持扩展其他支付方式）

import React from 'react';
import {
    Button,
    InputItem,
    WingBlank,
    View,
    Toast
} from 'antd-mobile';
import {
    LekeResult
} from '../style';
import {
    FormWrap,
    FormField,
    PaymentNoticeBar
} from './style';
import Ajax from '../../utils/ajax';

//获取用户终端类型
const getUserAgent = () => {
    let ua = navigator.userAgent;
    if(/micromessenger/i.test(ua))
        return "wechat";
    else if( /alipayclient/i.test(ua) )
        return "alipay";
    else
        return "null";
}

/**
 * ==== 集成支付 ====
 */
const IntegratedPay = (component) => {
    let ua = getUserAgent();
    switch(ua){
        case "wechat":
            return WeChatPayPal(component);
        case "alipay":
            return AliPayPal(component);
        default :
            return Nonsupport;
    }
}

/**
 * ==== 终端不支持展示 ====
 */
const Nonsupport = () => {
    return <LekeResult describe="请使用微信或支付宝扫一扫" />
}

/**
 * ==== 支付宝支付 ====
 */
const AliPayPal = (Component) => {

    //支付宝支付完成回跳地址
    const returnUrl = "https://webapp.leke.cn/leke-pay-h5/#/scanPay/result";

    //统一下单
    const createOrder = ({
        id,
        parentName,
        studentName,
        studentClassName,
        parentPhoneNumber,
        amount: paymentAmount
    }) => {
        Ajax({
            url: "/pay/alipay/mobileSitePay/payStart.htm",
            type: "POST"
        })
        .updateParams({
            id,
            returnUrl,
            parentName,
            studentName,
            studentClassName,
            parentPhoneNumber,
            paymentAmount
        })
        .send()
        .then(({data, message}) => {
            if( data && data.payUrl ){
                window.location.href = data.payUrl; //注： payUrl 中不带returnUrl支付结束后会直接关闭页面
            }else{
                Toast.fail(message)
            }
        })
    }

    return (props) => {
        return <Component {...props} payment={createOrder} />
    }
}

/**
 * ==== 微信支付 ====
 */
const WeChatPayPal = (Component) => {

    //唤起 wechat 支付
    const payment = ({
        appId,
        timeStamp,
        nonceStr,
        package: pg,  //关键字不能当变量
        signType,
        paySign
    }) => {
        window.WeixinJSBridge
            .invoke("getBrandWCPayRequest", {
                appId,
                timeStamp,
                nonceStr,
                "package": pg,
                signType,
                paySign
            }, (res) => {
                const { err_msg } = res;
                if( err_msg === "get_brand_wcpay_request:ok" ){
                    window.WeixinJSBridge.call('closeWindow');  //wechat 关闭页面
                }else{
                    Toast.fail("支付失败");
                }
            })
    }

    //统一下单
    const createOrder = ({
        id,
        parentName,
        studentName,
        studentClassName,
        parentPhoneNumber,
        amount: paymentAmount
    }) => {
        Ajax({
            url: "/pay/wx/mobileSitePay/order/pay.htm",
            type: "POST"
        })
        .updateParams({
            id,
            parentName,
            studentName,
            paymentAmount,
            studentClassName,
            parentPhoneNumber
        })
        .send()
        .then(({ data, message }) => {
            data ? payment(data) : Toast.fail(message);
        })
    }

    return (props) => {
        return <Component {...props} payment={createOrder} />
    }
}

class Main extends React.PureComponent{
    constructor(props){
        super(props);
        this.onSubmitHandle = this.onSubmitHandle.bind(this);
    }
    state = { amount: "" }
    componentWillMount(){
        const { state } = this.props.location;
        this.setState({ ...state });
        document.title = "确认金额";
    }
    onSubmitHandle(){   
        const { 
            id,
            amount = 0, 
            studentClassName,
            parentPhoneNumber,
            parentName,
            studentName
        } = this.state;

        this.props.payment({
            id,
            amount,
            parentName,
            studentName,
            studentClassName,
            parentPhoneNumber
        })
    }
    render(){
        const { pname = "", amount } = this.state;
        return (
            <View>
                <PaymentNoticeBar className="notice" icon={<span className="globalIcon icon-global-notice"></span>}>
                    您正在为<span className="pname">{pname}</span>付款
                </PaymentNoticeBar>
                <FormWrap>
                    <WingBlank size="20">
                        <FormField>
                            <div className="label">付款金额</div>
                            <InputItem type="money" 
                                    editable={false}
                                    moneyKeyboardAlign="left"
                                    value={amount} 
                                    placeholder="请输入付款金额" />
                        </FormField>
                        <div className="">
                            <Button type="primary" onClick={this.onSubmitHandle}>提交</Button>
                        </div>
                    </WingBlank >
                </FormWrap>
            </View>
        )
    }
}

export default IntegratedPay(Main);
