export type CardStatus = 'normal' | 'expiring' | 'expired' | 'usedup'

export type CardType = 'single' | 'combo'

export interface SubItem {
  name: string
  totalCount: number
  usedCount: number
}

export interface DeductRecord {
  id: string
  date: string
  itemName: string
  operator: string
  hasPhoto: boolean
  signature?: string
  note?: string
}

export type ContactType = 'copy' | 'call' | 'manual'

export interface ContactRecord {
  id: string
  customerId: string
  type: ContactType
  typeLabel: string
  dateTime: string
  resultNote?: string
}

export interface RenewalRecord {
  id: string
  dateTime: string
  addAmount: number
  extendDays: number
  addCount: number
  note?: string
}

export interface CustomerCard {
  id: string
  customerName: string
  phone: string
  projectName: string
  cardType: CardType
  totalCount: number
  usedCount: number
  giftedCount?: number
  compensatedCount?: number
  paymentAmount?: number
  expireDate: string
  createDate: string
  note?: string
  contraindications?: string
  subItems?: SubItem[]
  records: DeductRecord[]
  renewalRecords?: RenewalRecord[]
  status: CardStatus
}

export interface ReminderItem {
  id: string
  customerId: string
  customerName: string
  phone: string
  projectName: string
  remainingCount: number
  lastVisitDate: string
  suggestedDate: string
  messageTemplate: string
  contacted?: boolean
  contactedDate?: string
}

export interface OverviewStats {
  todayDeductCount: number
  totalRemainingCount: number
  expiringCustomerCount: number
  monthlyRenewalAmount: number
}

export type ProjectItem = '水光' | '祛痘护理' | '射频紧致' | '光子嫩肤' | '脱毛' | '其他'

export const PROJECT_OPTIONS: ProjectItem[] = ['水光', '祛痘护理', '射频紧致', '光子嫩肤', '脱毛', '其他']

export const COMBO_SUB_ITEMS: ProjectItem[] = ['水光', '祛痘护理', '射频紧致']

export const OPERATOR_OPTIONS = ['张医生', '李护士', '王技师', '陈店长']

export const STATUS_LABELS: Record<CardStatus, string> = {
  normal: '正常',
  expiring: '快过期',
  expired: '已过期',
  usedup: '已用完'
}
