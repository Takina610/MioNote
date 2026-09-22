import { dayjs } from 'element-plus'

// 日期格式化
export const formatTime = (date) => dayjs(date).format('YYYY年MM月DD日')
