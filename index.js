const puppeteer = require('puppeteer');
//图像识别
//const tesseract = require('node-tesseract');
//使用axios调用Node端的ajax请求
const axios = require('axios');
const http = require('http');
const fs = require('fs');
(async () => {
    //跳过安装  npm i --save puppeteer --ignore-scripts
    const browser = await puppeteer.launch({
        executablePath: 'G:/chrome-win/chrome-win/chrome.exe'
    });
    const page = await browser.newPage();
    //指定浏览器去某个页面
    await page.goto('http://202.201.33.23/');
    // await page.cookies('https://image.baidu.com')
    //     .then(data => {
    //         console.info(data)
    //     });
    //调大视口，方便截图，方便容纳更多地图
    await page.setViewport({
        width: 2000,
        height: 1000,
    });
    //模拟用哪个户输入
    await page.keyboard.sendCharacter('学号');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.sendCharacter('密码');
    //模拟用户点击搜索
    // await page.hover("a[title='快速通道']");
    // await page.hover("ul>li>a[title='本科生教务管理']");
    // await page.click("ul>li>a[title='本科生教务管理']");
    console.info('开始点击查询......');
    /**
     * @time  2019/4/9 11:45
     * @author  Bill Wang <vuejs@vip.qq.com>
     * @desc  执行上下文去获取页面验证码图片地址
     */
    await page.screenshot({
        path: __dirname + '/codeImg/code.png', clip: {
            x: 1210,
            y: 270,
            width: 80,
            height: 40
        }
    });
    let src = await page.evaluate(() => {
        return document.querySelector('img#icode').src;
    });
    await http.get(src, res => {
        new Promise((resolve, reject) => {
            //Node管道流批量下载文件
            res.pipe(fs.createWriteStream(__dirname + '/codeImg/code.jpg'))
                .on('finish', () => {
                    console.log('验证码图片写入完毕！');
                    resolve(true);
                });
        })
            .then(data => {
                if (data) {
                    const base64Src = fs.readFileSync(__dirname + '/codeImg/code.png');
                    // console.log('base64 address'+base64Src.toString('base64'))
                    axios.post('http://www.api51.cn/api/CaptchaApi/getres', {
                        pic: base64Src.toString('base64'),
                        token: 'API无忧token',
                    })
                        .then(async data => {
                            console.info('开始识别验证码！！！');
                            console.log('识别结果：' + data.data.data.recognition);
                            console.log('准备向页面写入验证码！');
                            await page.keyboard.press('Tab');
                            await page.keyboard.sendCharacter(data.data.data.recognition);
                            await page.screenshot({path: 'inputDone.png'});
                            await page.waitFor(200);
                            await page.keyboard.press("Enter");
                            //  await page.click('#Button1');
                            await console.log('已经模拟用户点击登录,准备截图反馈！');
                            await browser.close();
                            await page.screenshot({path: 'pageWatch.png'});
                            await page.on('load', async () => {
                                console.log('已经模拟用户点击登录');
                                page.keyboard.press("Enter");
                            })
                        })
                        .catch(err => err);
                }
            })
    });

})();