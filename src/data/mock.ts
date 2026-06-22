import dayjs from 'dayjs'
import type { CustomerCard, ReminderItem, OverviewStats } from '@/types'
import { computeCardStatus } from '@/utils'

const now = dayjs()

const rawCards: Omit<CustomerCard, 'status'>[] = [
  {
    id: 'card001',
    customerName: '王美琳',
    phone: '13812345678',
    projectName: '水光针',
    cardType: 'single',
    totalCount: 10,
    usedCount: 3,
    giftedCount: 1,
    paymentAmount: 3800,
    expireDate: now.add(180, 'day').format('YYYY-MM-DD'),
    createDate: now.subtract(30, 'day').format('YYYY-MM-DD'),
    note: '皮肤偏干，建议补水',
    contraindications: '无',
    records: [
      { id: 'r1', date: now.subtract(20, 'day').format('YYYY-MM-DD'), itemName: '水光针', operator: '张医生', hasPhoto: true },
      { id: 'r2', date: now.subtract(10, 'day').format('YYYY-MM-DD'), itemName: '水光针', operator: '李护士', hasPhoto: true },
      { id: 'r3', date: now.subtract(3, 'day').format('YYYY-MM-DD'), itemName: '水光针', operator: '张医生', hasPhoto: false }
    ]
  },
  {
    id: 'card002',
    customerName: '李婷婷',
    phone: '13987654321',
    projectName: '综合焕肤组合卡',
    cardType: 'combo',
    totalCount: 15,
    usedCount: 5,
    paymentAmount: 6800,
    expireDate: now.add(20, 'day').format('YYYY-MM-DD'),
    createDate: now.subtract(100, 'day').format('YYYY-MM-DD'),
    note: '敏感肌，注意舒缓',
    subItems: [
      { name: '水光', totalCount: 5, usedCount: 2 },
      { name: '祛痘护理', totalCount: 5, usedCount: 2 },
      { name: '射频紧致', totalCount: 5, usedCount: 1 }
    ],
    records: [
      { id: 'r4', date: now.subtract(40, 'day').format('YYYY-MM-DD'), itemName: '水光', operator: '张医生', hasPhoto: true },
      { id: 'r5', date: now.subtract(25, 'day').format('YYYY-MM-DD'), itemName: '祛痘护理', operator: '王技师', hasPhoto: true },
      { id: 'r6', date: now.subtract(15, 'day').format('YYYY-MM-DD'), itemName: '射频紧致', operator: '张医生', hasPhoto: false }
    ]
  },
  {
    id: 'card003',
    customerName: '陈思雅',
    phone: '13611112222',
    projectName: '光子嫩肤',
    cardType: 'single',
    totalCount: 6,
    usedCount: 6,
    paymentAmount: 2600,
    expireDate: now.add(60, 'day').format('YYYY-MM-DD'),
    createDate: now.subtract(200, 'day').format('YYYY-MM-DD'),
    records: []
  },
  {
    id: 'card004',
    customerName: '赵晓雯',
    phone: '13733334444',
    projectName: '祛痘护理',
    cardType: 'single',
    totalCount: 8,
    usedCount: 2,
    paymentAmount: 3200,
    expireDate: now.subtract(5, 'day').format('YYYY-MM-DD'),
    createDate: now.subtract(365, 'day').format('YYYY-MM-DD'),
    note: '痘痘肌，注意清洁',
    records: []
  },
  {
    id: 'card005',
    customerName: '刘梦琪',
    phone: '13555556666',
    projectName: '冰点脱毛',
    cardType: 'single',
    totalCount: 12,
    usedCount: 4,
    compensatedCount: 1,
    paymentAmount: 2400,
    expireDate: now.add(200, 'day').format('YYYY-MM-DD'),
    createDate: now.subtract(60, 'day').format('YYYY-MM-DD'),
    records: []
  },
  {
    id: 'card006',
    customerName: '孙丽华',
    phone: '13677778888',
    projectName: '射频紧致',
    cardType: 'single',
    totalCount: 10,
    usedCount: 1,
    paymentAmount: 5600,
    expireDate: now.add(15, 'day').format('YYYY-MM-DD'),
    createDate: now.subtract(150, 'day').format('YYYY-MM-DD'),
    records: []
  },
  {
    id: 'card007',
    customerName: '周小芳',
    phone: '13899990000',
    projectName: '水光针',
    cardType: 'single',
    totalCount: 5,
    usedCount: 0,
    paymentAmount: 1980,
    expireDate: now.add(25, 'day').format('YYYY-MM-DD'),
    createDate: now.subtract(20, 'day').format('YYYY-MM-DD'),
    records: []
  },
  {
    id: 'card008',
    customerName: '吴佳怡',
    phone: '13911113333',
    projectName: '光子嫩肤',
    cardType: 'single',
    totalCount: 8,
    usedCount: 2,
    paymentAmount: 3600,
    expireDate: now.add(90, 'day').format('YYYY-MM-DD'),
    createDate: now.subtract(45, 'day').format('YYYY-MM-DD'),
    records: []
  }
]

export const mockCustomerCards: CustomerCard[] = rawCards.map(card => ({
  ...card,
  status: computeCardStatus(card)
}))

export const mockReminders: ReminderItem[] = [
  {
    id: 'rem001',
    customerId: 'card001',
    customerName: '王美琳',
    phone: '13812345678',
    projectName: '水光针',
    remainingCount: 8,
    lastVisitDate: now.subtract(3, 'day').format('YYYY-MM-DD'),
    suggestedDate: now.add(7, 'day').format('YYYY-MM-DD'),
    messageTemplate: '王美琳姐/哥您好，您的水光针疗程还有8次，建议近期到店护理哦，期待您的光临~'
  },
  {
    id: 'rem002',
    customerId: 'card002',
    customerName: '李婷婷',
    phone: '13987654321',
    projectName: '综合焕肤组合卡',
    remainingCount: 10,
    lastVisitDate: now.subtract(15, 'day').format('YYYY-MM-DD'),
    suggestedDate: now.add(3, 'day').format('YYYY-MM-DD'),
    messageTemplate: '亲爱的李婷婷，提醒您的综合焕肤组合卡还剩10次未做，为了保证效果，记得按时来护理呀~'
  },
  {
    id: 'rem003',
    customerId: 'card006',
    customerName: '孙丽华',
    phone: '13677778888',
    projectName: '射频紧致',
    remainingCount: 9,
    lastVisitDate: now.subtract(30, 'day').format('YYYY-MM-DD'),
    suggestedDate: now.add(1, 'day').format('YYYY-MM-DD'),
    messageTemplate: '孙丽华您好，您在本店的射频紧致套餐剩余9次，欢迎预约到店，我们已为您准备好了~'
  },
  {
    id: 'rem004',
    customerId: 'card007',
    customerName: '周小芳',
    phone: '13899990000',
    projectName: '水光针',
    remainingCount: 5,
    lastVisitDate: now.subtract(20, 'day').format('YYYY-MM-DD'),
    suggestedDate: now.add(2, 'day').format('YYYY-MM-DD'),
    messageTemplate: '周小芳姐/哥您好，您的水光针疗程还有5次，建议近期到店护理哦，期待您的光临~'
  },
  {
    id: 'rem005',
    customerId: 'card005',
    customerName: '刘梦琪',
    phone: '13555556666',
    projectName: '冰点脱毛',
    remainingCount: 9,
    lastVisitDate: now.subtract(25, 'day').format('YYYY-MM-DD'),
    suggestedDate: now.add(5, 'day').format('YYYY-MM-DD'),
    messageTemplate: '亲爱的刘梦琪，提醒您的冰点脱毛还剩9次未做，为了保证效果，记得按时来护理呀~'
  }
]

export const mockOverviewStats: OverviewStats = {
  todayDeductCount: 5,
  totalRemainingCount: 87,
  expiringCustomerCount: 4,
  monthlyRenewalAmount: 8600
}
