export function formatDatetime(dateStr: string): string {
    // 将输入的日期字符串解析为 JavaScript 的 Date 对象
    const date = new Date(dateStr);

    // 使用 Intl.DateTimeFormat 创建一个格式化器实例
    // 可以根据需要自定义格式化选项
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hour12: false, // 24小时制
        timeZone: 'UTC' // 可根据需要设置不同的时区
    };

    const formatter = new Intl.DateTimeFormat('zh-CN', options);

    // 返回格式化后的日期字符串
    return formatter.format(date);
}