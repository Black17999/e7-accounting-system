import { VoiceAnimation } from './voiceAnimation.js';

// 语音识别模块
export class VoiceRecognitionManager {
    constructor() {
        this.isListening = false;
        this.animation = new VoiceAnimation();
        this.recognition = null;
        this.timeoutId = null;
    }

    // 初始化语音识别实例
    _initRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('您的浏览器不支持语音识别功能，请使用Chrome或Safari浏览器。');
            return null;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = 'zh-CN';
        recognition.continuous = false;
        recognition.interimResults = true; // 设置为true以检测声音输入
        recognition.maxAlternatives = 1;
        return recognition;
    }

    // 开始语音识别
    startVoiceRecognition(callback) {
        if (this.isListening) {
            this.stopVoiceRecognition();
            return;
        }

        this.recognition = this._initRecognition();
        if (!this.recognition) return;

        this.isListening = true;
        this.animation.showOverlay();
        this.animation.setState('listening');

        // 监听有声音输入
        this.recognition.onresult = (event) => {
            // 切换到“实时声波”状态
            this.animation.setState('receiving');
            
            // 检查最终结果
            if (event.results[event.results.length - 1].isFinal) {
                const transcript = event.results[event.results.length - 1][0].transcript;
                console.log('识别结果:', transcript);
                this.animation.setState('processing'); // 切换到处理中
                
                // 模拟处理延迟
                setTimeout(() => {
                    this.processVoiceCommand(transcript, callback);
                }, 1500);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
            this.animation.setState('fail');
            this.stopListening();
        };

        this.recognition.onend = () => {
            // 如果不是因为成功或失败而结束，则认为是用户取消或超时
            if (this.isListening) {
                this.stopListening();
                this.animation.hideOverlay();
            }
        };

        try {
            this.recognition.start();
            // 设置超时
            this.timeoutId = setTimeout(() => {
                if (this.isListening) {
                    console.log('语音识别超时');
                    this.stopVoiceRecognition();
                }
            }, 10000); // 10秒超时
        } catch (error) {
            console.error('启动语音识别失败:', error);
            alert('启动语音识别失败，请检查麦克风权限。');
            this.stopListening();
            this.animation.hideOverlay();
        }
    }

    stopVoiceRecognition() {
        if (this.recognition) {
            this.recognition.stop();
        }
        this.stopListening();
    }

    stopListening() {
        this.isListening = false;
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    // 核心函数：将包含中文数字的字符串转换为包含阿拉伯数字的字符串
    parseChineseNumbers(text) {
        const chineseNumMap = { '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '两': 2 };
        const chineseUnitMap = { '十': 10, '百': 100, '千': 1000, '万': 10000, '亿': 100000000 };

        let processedText = text.replace(/廿/g, '二十').replace(/卅/g, '三十');

        return processedText.replace(/[一二三四五六七八九十百千万亿两零]+/g, (match) => {
            let total = 0;
            let section = 0;
            let sectionUnit = 1;
            let currentUnit = 1;

            for (let i = 0; i < match.length; i++) {
                const char = match[i];
                if (chineseNumMap[char] !== undefined) {
                    section = chineseNumMap[char];
                    if (i === 0 && section === 1 && match[i + 1] === '十') {
                        section = 0;
                    }
                } else {
                    currentUnit = chineseUnitMap[char];
                    if (currentUnit >= 10000) {
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
        let cleanCommand = command.trim().replace(/[，。、元块钱]/g, '');
        let normalizedCommand = this.parseChineseNumbers(cleanCommand);
        console.log(`原始命令: "${command}" -> 标准化: "${normalizedCommand}"`);

        const patterns = [
            {
                regex: /^(进|进账|收入|花|花了|支出|消费|买|买了)(\d+)[个笔份](.*?)(?=\d+$)(\d+)$/,
                map: (match) => ({ type: match[1], count: parseInt(match[2]), item: match[3].trim() || null, amount: parseFloat(match[4]) })
            },
            {
                regex: /^(\d+)[个笔份](.*?)(?=\d+$)(\d+)(进|进账|收入|花|花了|支出|消费|买|买了)$/,
                map: (match) => ({ count: parseInt(match[1]), item: match[2].trim() || null, amount: parseFloat(match[3]), type: match[4] })
            },
            {
                regex: /^(进|进账|收入|花|花了|支出|消费|买|买了)(\d+)[个笔份](\d+)$/,
                map: (match) => ({ type: match[1], count: parseInt(match[2]), item: null, amount: parseFloat(match[3]) })
            },
            {
                regex: /^(\d+)[个笔份](\d+)(进|进账|收入|花|花了|支出|消费|买|买了)$/,
                map: (match) => ({ count: parseInt(match[1]), amount: parseFloat(match[2]), type: match[3], item: null })
            },
            {
                regex: /^(进|进账|收入|花|花了|支出|消费|买|买了)(.*?)(?=\d+$)(\d+)$/,
                map: (match) => ({ type: match[1], count: 1, item: match[2].trim() || null, amount: parseFloat(match[3]) })
            }
        ];

        for (const pattern of patterns) {
            const match = normalizedCommand.match(pattern.regex);
            if (match) {
                const result = pattern.map(match);
                const { type, count, item, amount } = result;

                if (isNaN(count) || isNaN(amount) || count <= 0 || amount <= 0) continue;

                const isIncome = /进|收入/.test(type);
                const isExpense = /花|支出|消费|买/.test(type);

                if (!isIncome && !isExpense) continue;

                this.animation.setState('successB'); // 播放成功动画
                this.stopListening();

                if (callback) {
                    callback({
                        type: isIncome ? 'income' : 'expense',
                        count: count,
                        item: item,
                        amount: amount,
                        success: true
                    });
                }
                return;
            }
        }

        console.log('无法识别的命令格式:', normalizedCommand);
        this.animation.setState('fail');
        this.stopListening();
        
        if (callback) {
            callback({ success: false, error: '无法识别的命令格式' });
        }
    }
}
