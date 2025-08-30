// 语音识别模块
export class VoiceRecognitionManager {
    constructor() {
        this.isListening = false;
    }

    // 开始语音识别
    startVoiceRecognition() {
        // 检查浏览器是否支持语音识别
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('您的浏览器不支持语音识别功能，请使用Chrome或Safari浏览器。');
            return;
        }

        // 创建语音识别实例
        const recognition = new SpeechRecognition();
        recognition.lang = 'zh-CN'; // 设置为中文识别
        recognition.continuous = false; // 只识别一次
        recognition.interimResults = false; // 不返回中间结果
        recognition.maxAlternatives = 1; // 只返回一个最佳结果
        
        // 增强识别准确性
        if (recognition.continuous !== undefined) {
            recognition.continuous = false;
        }
        
        // 设置语音识别参数以提高准确性
        try {
            // 尝试设置额外参数（某些浏览器可能不支持）
            recognition.grammars = null;
        } catch (e) {
            // 忽略不支持的参数
        }
        
        // 开始识别
        this.isListening = true;
        
        // 视觉反馈
        console.log('请开始说话...');
        // 添加一个toast提示
        const toast = document.createElement('div');
        toast.textContent = '正在聆听...';
        toast.style.position = 'fixed';
        toast.style.bottom = '100px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.backgroundColor = 'rgba(27, 38, 59, 0.9)';
        toast.style.color = '#ffd700';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '20px';
        toast.style.zIndex = '1000';
        toast.style.fontSize = '16px';
        toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        toast.style.transition = 'all 0.3s ease';
        toast.style.opacity = '1';
        toast.id = 'voice-toast';
        document.body.appendChild(toast);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('识别结果:', transcript);
            // 移除提示
            const toastElement = document.getElementById('voice-toast');
            if (toastElement) {
                // 添加成功提示
                toastElement.textContent = '识别成功';
                toastElement.style.backgroundColor = 'rgba(46, 204, 113, 0.9)';
                toastElement.style.transform = 'translateX(-50%) scale(1.1)';
                setTimeout(() => {
                    if (toastElement.parentNode) {
                        toastElement.style.opacity = '0';
                        setTimeout(() => {
                            if (toastElement.parentNode) {
                                document.body.removeChild(toastElement);
                            }
                        }, 300);
                    }
                }, 1000);
            }
            this.processVoiceCommand(transcript);
            this.isListening = false;
        };

        recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
            // 移除提示
            const toastElement = document.getElementById('voice-toast');
            if (toastElement) {
                toastElement.style.opacity = '0';
                setTimeout(() => {
                    if (toastElement.parentNode) {
                        document.body.removeChild(toastElement);
                    }
                }, 300);
            }
            // 显示错误信息
            const errorToast = document.createElement('div');
            errorToast.textContent = '识别失败: ' + event.error;
            errorToast.style.position = 'fixed';
            errorToast.style.bottom = '100px';
            errorToast.style.left = '50%';
            errorToast.style.transform = 'translateX(-50%)';
            errorToast.style.backgroundColor = 'rgba(231, 76, 60, 0.9)';
            errorToast.style.color = 'white';
            errorToast.style.padding = '10px 20px';
            errorToast.style.borderRadius = '20px';
            errorToast.style.zIndex = '1000';
            errorToast.style.fontSize = '16px';
            errorToast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
            errorToast.style.opacity = '1';
            errorToast.style.transition = 'opacity 0.3s ease';
            document.body.appendChild(errorToast);
            setTimeout(() => {
                errorToast.style.opacity = '0';
                setTimeout(() => {
                    if (errorToast.parentNode) {
                        document.body.removeChild(errorToast);
                    }
                }, 300);
            }, 3000);
            this.isListening = false;
        };

        recognition.onend = () => {
            console.log('语音识别结束');
            // 移除提示
            const toastElement = document.getElementById('voice-toast');
            if (toastElement) {
                // 如果没有错误也没有结果，显示结束提示
                if (toastElement.textContent === '正在聆听...') {
                    toastElement.textContent = '识别结束';
                    toastElement.style.backgroundColor = 'rgba(52, 152, 219, 0.9)';
                    setTimeout(() => {
                        toastElement.style.opacity = '0';
                        setTimeout(() => {
                            if (toastElement.parentNode) {
                                document.body.removeChild(toastElement);
                            }
                        }, 300);
                    }, 1000);
                }
            }
            this.isListening = false;
        };

        try {
            recognition.start();
        } catch (error) {
            console.error('启动语音识别失败:', error);
            // 移除提示
            const toastElement = document.getElementById('voice-toast');
            if (toastElement) {
                toastElement.style.opacity = '0';
                setTimeout(() => {
                    if (toastElement.parentNode) {
                        document.body.removeChild(toastElement);
                    }
                }, 300);
            }
            // 显示错误信息
            const errorToast = document.createElement('div');
            errorToast.textContent = '启动语音识别失败，请检查麦克风权限';
            errorToast.style.position = 'fixed';
            errorToast.style.bottom = '100px';
            errorToast.style.left = '50%';
            errorToast.style.transform = 'translateX(-50%)';
            errorToast.style.backgroundColor = 'rgba(231, 76, 60, 0.9)';
            errorToast.style.color = 'white';
            errorToast.style.padding = '10px 20px';
            errorToast.style.borderRadius = '20px';
            errorToast.style.zIndex = '1000';
            errorToast.style.fontSize = '16px';
            errorToast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
            errorToast.style.opacity = '1';
            errorToast.style.transition = 'opacity 0.3s ease';
            document.body.appendChild(errorToast);
            setTimeout(() => {
                errorToast.style.opacity = '0';
                setTimeout(() => {
                    if (errorToast.parentNode) {
                        document.body.removeChild(errorToast);
                    }
                }, 300);
            }, 3000);
            this.isListening = false;
        }
    }

    // 核心函数：将包含中文数字的字符串转换为包含阿拉伯数字的字符串
    parseChineseNumbers(text) {
        const chineseNumMap = { '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '两': 2 };
        const chineseUnitMap = { '十': 10, '百': 100, '千': 1000, '万': 10000, '亿': 100000000 };

        // 预处理：替换常见的口语化表达
        let processedText = text.replace(/廿/g, '二十').replace(/卅/g, '三十');

        // 使用正则表达式匹配所有中文数字序列
        return processedText.replace(/[一二三四五六七八九十百千万亿两零]+/g, (match) => {
            let total = 0;
            let section = 0;
            let sectionUnit = 1;
            let currentUnit = 1;

            for (let i = 0; i < match.length; i++) {
                const char = match[i];
                if (chineseNumMap[char] !== undefined) {
                    // 是数字
                    section = chineseNumMap[char];
                    // 处理 "一十" 为 "十" 的情况
                    if (i === 0 && section === 1 && match[i + 1] === '十') {
                        section = 0;
                    }
                } else {
                    // 是单位
                    currentUnit = chineseUnitMap[char];
                    if (currentUnit >= 10000) { // 万或亿
                        total += (section * sectionUnit);
                        total *= currentUnit;
                        section = 0;
                        sectionUnit = 1;
                    } else {
                        sectionUnit = currentUnit;
                        total += section * sectionUnit;
                        section = 0;
                    }
                }
            }
            total += section * sectionUnit;
            return total;
        });
    }

    // 主处理函数：解析语音命令并执行相应操作
    processVoiceCommand(command, callback) {
        // 1. 清理并标准化命令
        let cleanCommand = command.trim().replace(/[，。、元块钱]/g, '');
        let normalizedCommand = this.parseChineseNumbers(cleanCommand);
        console.log(`原始命令: "${command}" -> 标准化: "${normalizedCommand}"`);

        // 2. 定义命令模式 (正则表达式)
        const patterns = [
            // 多笔记录，类型在前 (e.g., "进账2笔60", "花了3个纸巾30")
            {
                regex: /^(进|进账|收入|花|花了|支出|消费|买|买了)(\d+)[个笔份](.*?)(?=\d+$)(\d+)$/,
                map: (match) => ({ type: match[1], count: parseInt(match[2]), item: match[3].trim() || null, amount: parseFloat(match[4]) })
            },
            // 多笔记录，类型在后 (e.g., "2笔60进账", "3个纸巾30花了")
            {
                regex: /^(\d+)[个笔份](.*?)(?=\d+$)(\d+)(进|进账|收入|花|花了|支出|消费|买|买了)$/,
                map: (match) => ({ count: parseInt(match[1]), item: match[2].trim() || null, amount: parseFloat(match[3]), type: match[4] })
            },
            // 多笔记录，省略项目 (e.g., "进账2笔60", "2个60进账")
            {
                regex: /^(进|进账|收入|花|花了|支出|消费|买|买了)(\d+)[个笔份](\d+)$/,
                map: (match) => ({ type: match[1], count: parseInt(match[2]), item: null, amount: parseFloat(match[3]) })
            },
            {
                regex: /^(\d+)[个笔份](\d+)(进|进账|收入|花|花了|支出|消费|买|买了)$/,
                map: (match) => ({ count: parseInt(match[1]), amount: parseFloat(match[2]), type: match[3], item: null })
            },
            // 单笔记录 (e.g., "进账60", "花了纸巾30")
            {
                regex: /^(进|进账|收入|花|花了|支出|消费|买|买了)(.*?)(?=\d+$)(\d+)$/,
                map: (match) => ({ type: match[1], count: 1, item: match[2].trim() || null, amount: parseFloat(match[3]) })
            }
        ];

        // 3. 循环匹配并执行
        for (const pattern of patterns) {
            const match = normalizedCommand.match(pattern.regex);
            if (match) {
                const result = pattern.map(match);
                const { type, count, item, amount } = result;

                if (isNaN(count) || isNaN(amount) || count <= 0 || amount <= 0) continue;

                const isIncome = /进|收入/.test(type);
                const isExpense = /花|支出|消费|买/.test(type);

                if (!isIncome && !isExpense) continue;

                // 调用回调函数处理结果
                if (callback) {
                    callback({
                        type: isIncome ? 'income' : 'expense',
                        count: count,
                        item: item,
                        amount: amount,
                        success: true
                    });
                }

                return; // 匹配成功，结束处理
            }
        }

        // 4. 如果所有模式都未匹配
        console.log('无法识别的命令格式:', normalizedCommand);
        alert('无法识别的命令。请尝试说 "进账/支出 [数量] 笔/个 [项目] [金额]"，例如 "进账两笔六十" 或 "花了三个纸巾三十元"。');
        
        if (callback) {
            callback({ success: false, error: '无法识别的命令格式' });
        }
    }
}
