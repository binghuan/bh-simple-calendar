import { RRule } from 'rrule';
import { startOfMonth, endOfMonth, addMonths, subMonths, format, parseISO, isSameDay } from 'date-fns';

/**
 * 預設的重複選項
 */
export const RECURRENCE_OPTIONS = [
    { value: '', label: 'Does not repeat' },
    { value: 'FREQ=DAILY', label: 'Daily' },
    { value: 'FREQ=WEEKLY', label: 'Weekly' },
    { value: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', label: 'Every weekday (Mon-Fri)' },
    { value: 'FREQ=MONTHLY', label: 'Monthly' },
    { value: 'FREQ=YEARLY', label: 'Yearly' },
    { value: 'custom', label: 'Custom...' },
];

/**
 * 頻率選項
 */
export const FREQUENCY_OPTIONS = [
    { value: RRule.DAILY, label: 'Day' },
    { value: RRule.WEEKLY, label: 'Week' },
    { value: RRule.MONTHLY, label: 'Month' },
    { value: RRule.YEARLY, label: 'Year' },
];

/**
 * 星期選項
 */
export const WEEKDAY_OPTIONS = [
    { value: RRule.SU, label: 'Sun', short: 'S' },
    { value: RRule.MO, label: 'Mon', short: 'M' },
    { value: RRule.TU, label: 'Tue', short: 'T' },
    { value: RRule.WE, label: 'Wed', short: 'W' },
    { value: RRule.TH, label: 'Thu', short: 'T' },
    { value: RRule.FR, label: 'Fri', short: 'F' },
    { value: RRule.SA, label: 'Sat', short: 'S' },
];

/**
 * 從 RRule 字串解析出選項
 * @param {string} rruleString - RRule 字串
 * @returns {object} RRule 選項物件
 */
export function parseRRuleString(rruleString) {
    if (!rruleString) return null;
    
    try {
        // 如果是完整的 RRULE 格式，直接解析
        if (rruleString.startsWith('RRULE:')) {
            return RRule.fromString(rruleString).options;
        }
        // 如果只有規則部分，加上 RRULE: 前綴
        return RRule.fromString(`RRULE:${rruleString}`).options;
    } catch (error) {
        console.error('Error parsing RRule string:', error);
        return null;
    }
}

/**
 * 建立 RRule 字串
 * @param {object} options - RRule 選項
 * @returns {string} RRule 字串（不含 RRULE: 前綴）
 */
export function createRRuleString(options) {
    if (!options || !options.freq) return '';
    
    try {
        const rule = new RRule(options);
        // 返回不含 RRULE: 前綴的字串
        return rule.toString().replace('RRULE:', '');
    } catch (error) {
        console.error('Error creating RRule string:', error);
        return '';
    }
}

/**
 * 解析 exdates 字串為日期陣列
 * @param {string} exdatesString - 逗號分隔的日期字串
 * @returns {Date[]} 日期陣列
 */
export function parseExdates(exdatesString) {
    if (!exdatesString) return [];
    
    return exdatesString
        .split(',')
        .filter(d => d.trim())
        .map(d => {
            try {
                return parseISO(d.trim());
            } catch {
                return null;
            }
        })
        .filter(d => d !== null);
}

/**
 * 檢查日期是否在排除列表中
 * @param {Date} date - 要檢查的日期
 * @param {Date[]} exdates - 排除日期陣列
 * @returns {boolean}
 */
export function isDateExcluded(date, exdates) {
    return exdates.some(exdate => isSameDay(date, exdate));
}

/**
 * 展開重複事件（考慮 exdates 和例外實例）
 * @param {object} event - 事件物件
 * @param {Date} rangeStart - 範圍開始日期
 * @param {Date} rangeEnd - 範圍結束日期
 * @param {array} exceptions - 例外實例陣列
 * @returns {array} 展開後的事件陣列
 */
export function expandRecurringEvent(event, rangeStart, rangeEnd, exceptions = []) {
    if (!event.rrule) {
        return [event];
    }

    try {
        const eventStart = new Date(event.start_time);
        const eventEnd = new Date(event.end_time);
        const duration = eventEnd.getTime() - eventStart.getTime();

        // 解析排除日期
        const exdates = parseExdates(event.exdates);

        // 取得此事件的例外實例
        const eventExceptions = exceptions.filter(ex => ex.parent_event_id === event.id);

        // 建立 RRule
        const rruleOptions = parseRRuleString(event.rrule);
        if (!rruleOptions) {
            return [event];
        }

        // 設定 dtstart
        const rule = new RRule({
            ...rruleOptions,
            dtstart: eventStart,
        });

        // 取得在範圍內的所有日期
        const occurrences = rule.between(rangeStart, rangeEnd, true);

        // 為每個出現建立事件實例（排除 exdates 中的日期）
        const instances = [];
        
        for (const occurrence of occurrences) {
            // 檢查是否被排除
            if (isDateExcluded(occurrence, exdates)) {
                continue;
            }

            // 檢查是否有例外實例
            const exception = eventExceptions.find(ex => {
                const originalStart = new Date(ex.original_start_time);
                return isSameDay(originalStart, occurrence);
            });

            if (exception) {
                // 使用例外實例
                instances.push({
                    ...exception,
                    isRecurringInstance: true,
                    isException: true,
                    parentEvent: event,
                    instanceDate: occurrence,
                });
            } else {
                // 使用正常實例
                instances.push({
                    ...event,
                    id: `${event.id}_${occurrence.getTime()}`, // 使用複合 ID
                    originalId: event.id, // 保留原始 ID
                    start_time: occurrence.toISOString(),
                    end_time: new Date(occurrence.getTime() + duration).toISOString(),
                    isRecurringInstance: true,
                    isException: false,
                    instanceDate: occurrence,
                });
            }
        }

        return instances;
    } catch (error) {
        console.error('Error expanding recurring event:', error);
        return [event];
    }
}

/**
 * 展開多個事件
 * @param {array} events - 事件陣列
 * @param {Date} rangeStart - 範圍開始日期
 * @param {Date} rangeEnd - 範圍結束日期
 * @param {array} exceptions - 所有例外實例
 * @returns {array} 展開後的事件陣列
 */
export function expandEvents(events, rangeStart, rangeEnd, exceptions = []) {
    const expanded = [];
    
    for (const event of events) {
        if (event.rrule) {
            // 重複事件 - 展開
            const instances = expandRecurringEvent(event, rangeStart, rangeEnd, exceptions);
            expanded.push(...instances);
        } else {
            // 非重複事件 - 直接加入
            expanded.push(event);
        }
    }
    
    return expanded;
}

/**
 * 取得月視圖的日期範圍（包含前後月份的部分日期）
 * @param {Date} currentDate - 當前日期
 * @returns {object} { start, end }
 */
export function getMonthViewRange(currentDate) {
    // 擴展範圍以包含顯示在月視圖中的前後月份日期
    const start = subMonths(startOfMonth(currentDate), 1);
    const end = addMonths(endOfMonth(currentDate), 1);
    return { start, end };
}

/**
 * 將 RRule 轉換為人類可讀的描述
 * @param {string} rruleString - RRule 字串
 * @returns {string} 人類可讀的描述
 */
export function getRRuleDescription(rruleString) {
    if (!rruleString) return '';
    
    try {
        const fullString = rruleString.startsWith('RRULE:') 
            ? rruleString 
            : `RRULE:${rruleString}`;
        const rule = RRule.fromString(fullString);
        return rule.toText();
    } catch (error) {
        console.error('Error getting RRule description:', error);
        return rruleString;
    }
}

/**
 * 格式化實例日期為 ISO 字串（用於 API）
 * @param {Date} date - 日期
 * @returns {string} ISO 格式日期字串
 */
export function formatInstanceDate(date) {
    return format(date, "yyyy-MM-dd'T'HH:mm:ss");
}
