import dayjs from 'dayjs'
import type { CustomerCard, CardStatus } from '@/types'

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

export const computeCardStatus = (card: CustomerCard): CardStatus => {
  if (card.usedCount >= card.totalCount + (card.giftedCount || 0) + (card.compensatedCount || 0)) {
    return 'usedup'
  }
  const now = dayjs()
  const expire = dayjs(card.expireDate)
  const diffDays = expire.diff(now, 'day')
  if (diffDays < 0) {
    return 'expired'
  }
  if (diffDays <= 30) {
    return 'expiring'
  }
  return 'normal'
}

export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format)
}

export const formatDateCN = (date: string | Date): string => {
  return dayjs(date).format('YYYY年MM月DD日')
}

export const getRemainingCount = (card: CustomerCard): number => {
  const total = card.totalCount + (card.giftedCount || 0) + (card.compensatedCount || 0)
  return Math.max(0, total - card.usedCount)
}

export const getDaysUntilExpire = (card: CustomerCard): number => {
  return dayjs(card.expireDate).diff(dayjs(), 'day')
}

export const getExpireText = (card: CustomerCard): string => {
  const days = getDaysUntilExpire(card)
  if (days < 0) {
    return `已过期${Math.abs(days)}天`
  }
  if (days === 0) {
    return '今日到期'
  }
  if (days <= 30) {
    return `剩余${days}天`
  }
  return `有效期至${formatDate(card.expireDate, 'MM-DD')}`
}

export const generateReminderMessage = (name: string, project: string, remaining: number): string => {
  const templates = [
    `${name}姐/哥您好，您的${project}疗程还有${remaining}次，建议近期到店护理哦，期待您的光临~`,
    `亲爱的${name}，提醒您的${project}还剩${remaining}次未做，为了保证效果，记得按时来护理呀~`,
    `${name}您好，您在本店的${project}套餐剩余${remaining}次，欢迎预约到店，我们已为您准备好了~`
  ]
  return templates[Math.floor(Math.random() * templates.length)]
}

export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 11) return phone
  return phone.substr(0, 3) + '****' + phone.substr(7, 4)
}
