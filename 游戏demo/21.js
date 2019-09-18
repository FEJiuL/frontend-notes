

/**
 * ==== 获取随机正整数 ====
 * @param {*} start 
 * @param {*} end 
 */
const getRandomNum = (start, end) => {
    let range = end - start;
    let num = Math.floor(Math.random() * range);
    return start + num;
}

/**
 * ==== 玩家 ====
 * @param { object } 玩家信息 
 */
class Player{
    constructor( opts ){
        //玩家名称
        this.name = opts.name;
        //角色： banker - 庄家， ordinary - 普通玩家
        this.role = opts.role || 'ordinary'; 
        //用户手牌 
        this.cards = [ ]; 
        //用户当前手牌点数
        this.count = 0;
        //是否摸排
        this.demand = true;
    }
    /** 
     * ==== 玩家获得手牌 ====
     * @param { card } 发到手的牌
    */
    getCard( card ){
        //将卡牌A放到第一位，计算点数时最后计算
        if(card.val !== 'A')
            this.cards.push(card);
        else
            this.cards.unshift(card);
        this.calculate();   //计算点数
        this.isBust();      //是否爆牌
        this.printInfo();
    }
    printInfo(){
        let cards = this.cards.reduce(( arr, card ) => {
            return arr.concat(`${card.type}${card.val}`)
        }, [ ]);
        console.table([this.name, cards.join(','), this.count]);
    }
    //判断是否爆牌，爆牌直接将点数重置&不可再摸排
    isBust(){
        if( this.count > 21 ){
            this.count = 0;
            this.demand = false;
        }
    }
    /**
     * ==== 用户要牌 ====
     * @param {*} func 
     */
    demandCard( ){
        if( this.demand && this.count > 0 && this.count < 18)
            return this;
        return false;
    }
    /**
     * ==== 计算点数 ====
     */
    calculate(){
        this.count = this.cards.reduceRight(( total, c ) => {
            //如果牌面值为A，判断总点数是否超过10
            if(c.val === 'A' && total <= 10)
                return total + 11;
            return total + +c.count;
        }, 0);
    }
}

/**
 * ==== 卡牌 ====
 * @param {string} type  牌面花色
 * @param {string} val   牌面值
 */
class Card{
    constructor( type, val ){
        this.type = type;
        this.val = val;
        this.count = this.getCount();
    }
    getCount(){
        switch(this.val){
            case 'A' :
                return 1;
            case 'J':
            case 'Q':
            case 'K':
                return 10;
            default:
                return val;
        }
    }
}

/**
 * ==== 游戏 ====
 */
class Game{
    /**
     * ==== 游戏初始化 ====
     * @param {*} num 玩家数(不包含庄家，num >= 1) 
     */
    constructor( num ){
        this.queue = [ ]; //玩家队列
        this.players = this.generatePlayers( num );
        this.cards = this.generateCards();
        this.dealCard = this.dealCard.bind(this);
        this.executeQueue = this.executeQueue.bind(this);
    }
    /**
     * ====  生成玩家队列 ====
     * @param {*} num 
     */
    generatePlayers( num ){
        let list = [ ];
        for( let i = 0; i < num; i++ ){
            list.push(new Player({ name : `玩家${i+1}` }));
        }
        return list.concat(new Player({role : 'banker', name : "庄家"})); //加入庄家
    }
    //生成牌堆
    generateCards(){
        let vals = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        return vals.reduce(( list, val ) => {
            return list.concat( this.creatTypeCard(val) )
        }, [ ]);
    }
    /**
     * ==== 生成类型牌 ====
     * @param {*} val 
     */
    creatTypeCard( val ){
        return ['♥️', '♦️', '♠️', '♣️'].map( type => new Card(type, val));
    }
    /**
     * ==== 游戏开始 ====
     */
    start(){
        this.cards = this.shuffle(this.shuffle(this.shuffle(this.cards))); //三次洗牌
        //起手每人发两张牌
        this.players.map((player) => {
            this.dealCard(player);
            this.dealCard(player);
            this.queue.push( player );
        });
        this.executeQueue( this.queue );
    }
    /**
     * ==== 执行队列 ====
     * @param {*} player 玩家对象
     */
    executeQueue( queue ){
        let time = getRandomNum(1, 4);
        setTimeout( () => {
            if( queue.length > 0 ){
                let player = queue[0];
                this.dealCard(player);
                if( !player.demandCard() )
                    queue.shift();
                this.executeQueue(queue);
            }else{
                this.settle();
            }
        },time * 1000);
    }
    /**
     * ==== 游戏结算 ====
     */
    settle(){
        let winner = this.players.reduce(( winner, player ) => {
            if( !winner || winner.count < player.count ){
                winner = player;
            }
            return winner;
        });
        console.log(`赢家：${winner.name}，点数：${winner.count}`)
    }
    /**
     * ==== 重新开始 ====
     */
    restart(){
         //回收用户手牌
        this.players.map(( player ) => {
            this.cards.concat(player.cards.splice(0, player.cards.length));
            player.count = 0;
            player.demand = true;
            return player;
        });
        console.table(this.players);
        this.start();
    }
    /**
     * ==== 发牌 ====
     */
    dealCard( player ){
        //如果可发牌，则给玩家发牌
        if( player.demand ){
            let card = this.cards.shift();
            player.getCard(card);
        }
    }
    /**
     * ==== 洗牌算法 ====
     * @param {*} list 牌堆
     */
    shuffle( list = [ ] ){
        let len = list.length;
        for( let i = len - 1; i > 0; i-- ){
            let index = getRandomNum(0, i);
            let tmp = list[i];
            list[i] = list[index];
            list[index] = tmp;
        }
        return list;
    }
}

//开始游戏
let game = new Game(2);
game.start();
