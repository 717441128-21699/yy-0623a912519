import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react'
import Taro from '@tarojs/taro'
import type { CustomerCard, OverviewStats, DeductRecord, ContactRecord, ContactType, RenewalRecord } from '@/types'
import { mockCustomerCards } from '@/data/mock'
import { computeCardStatus, generateId } from '@/utils'
import dayjs from 'dayjs'

interface StoreContextType {
  cards: CustomerCard[]
  overviewStats: OverviewStats
  contactedMap: Record<string, string>
  contactRecords: ContactRecord[]
  addCard: (card: Omit<CustomerCard, 'id' | 'status' | 'records' | 'createDate'>) => void
  updateCard: (cardId: string, updates: Partial<Omit<CustomerCard, 'id' | 'status' | 'createDate' | 'records'>>) => void
  deductCard: (cardId: string, record: Omit<DeductRecord, 'id' | 'date'>, subItemName?: string) => void
  markContacted: (customerId: string) => void
  addContactRecord: (customerId: string, type: ContactType, resultNote?: string) => void
  updateContactRecordNote: (recordId: string, resultNote: string) => void
  renewCard: (cardId: string, renewal: { addAmount?: number; extendDays?: number; addCount?: number; note?: string }) => void
  refreshStats: () => void
}

const StoreContext = createContext<StoreContextType | null>(null)

const STORAGE_KEY = 'medical_aesthetic_cards'
const CONTACTED_KEY = 'medical_aesthetic_contacted'
const CONTACT_RECORDS_KEY = 'medical_aesthetic_contact_records'

function getRemaining(card: CustomerCard): number {
  const total = card.totalCount + (card.giftedCount || 0) + (card.compensatedCount || 0)
  return Math.max(0, total - card.usedCount)
}

function calcStats(cards: CustomerCard[]): OverviewStats {
  const today = dayjs().format('YYYY-MM-DD')
  const currentMonth = dayjs().format('YYYY-MM')
  let todayCount = 0
  let totalRemaining = 0
  let expiringCount = 0
  let monthlyAmount = 0
  cards.forEach(card => {
    totalRemaining += getRemaining(card)
    if (card.status === 'expiring') {
      expiringCount++
    }
    card.records.forEach(r => {
      if (r.date === today) todayCount++
    })
    if (card.paymentAmount) {
      const mainCreate = card.createDate.startsWith(currentMonth) ? card.paymentAmount : 0
      let renewalAmount = 0
      if (card.renewalRecords && card.renewalRecords.length) {
        renewalAmount = card.renewalRecords
          .filter(r => r.dateTime.startsWith(currentMonth) && r.addAmount)
          .reduce((s, r) => s + r.addAmount, 0)
      }
      monthlyAmount += mainCreate + renewalAmount
    }
  })
  return {
    todayDeductCount: todayCount,
    totalRemainingCount: totalRemaining,
    expiringCustomerCount: expiringCount,
    monthlyRenewalAmount: monthlyAmount
  }
}

const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  copy: '复制话术',
  call: '拨打电话',
  manual: '手动标记'
}

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cards, setCards] = useState<CustomerCard[]>([])
  const [contactedMap, setContactedMap] = useState<Record<string, string>>({})
  const [contactRecords, setContactRecords] = useState<ContactRecord[]>([])
  const [overviewStats, setOverviewStats] = useState<OverviewStats>({
    todayDeductCount: 0,
    totalRemainingCount: 0,
    expiringCustomerCount: 0,
    monthlyRenewalAmount: 0
  })
  const cardsRef = useRef<CustomerCard[]>([])
  const contactedRef = useRef<Record<string, string>>({})
  const contactRecordsRef = useRef<ContactRecord[]>([])

  const persistCards = async (newCards: CustomerCard[]) => {
    try {
      await Taro.setStorage({ key: STORAGE_KEY, data: JSON.stringify(newCards) })
    } catch (e) {
      console.error('[Store] persistCards error:', e)
    }
  }

  const persistContacted = async (newMap: Record<string, string>) => {
    try {
      await Taro.setStorage({ key: CONTACTED_KEY, data: JSON.stringify(newMap) })
    } catch (e) {
      console.error('[Store] persistContacted error:', e)
    }
  }

  const persistContactRecords = async (newRecords: ContactRecord[]) => {
    try {
      await Taro.setStorage({ key: CONTACT_RECORDS_KEY, data: JSON.stringify(newRecords) })
    } catch (e) {
      console.error('[Store] persistContactRecords error:', e)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      let initialCards: CustomerCard[]
      let initialContacted: Record<string, string> = {}
      let initialRecords: ContactRecord[] = []
      try {
        const stored = await Taro.getStorage({ key: STORAGE_KEY })
        if (stored.data) {
          const parsed = JSON.parse(stored.data) as CustomerCard[]
          initialCards = parsed.map(c => ({ ...c, status: computeCardStatus(c) }))
        } else {
          initialCards = mockCustomerCards
          await Taro.setStorage({ key: STORAGE_KEY, data: JSON.stringify(mockCustomerCards) })
        }
      } catch (e) {
        console.error('[Store] loadCards error:', e)
        initialCards = mockCustomerCards
      }
      try {
        const storedContacted = await Taro.getStorage({ key: CONTACTED_KEY })
        if (storedContacted.data) {
          initialContacted = JSON.parse(storedContacted.data) as Record<string, string>
        }
      } catch (e) {
        console.error('[Store] loadContacted error:', e)
      }
      try {
        const storedRecords = await Taro.getStorage({ key: CONTACT_RECORDS_KEY })
        if (storedRecords.data) {
          initialRecords = JSON.parse(storedRecords.data) as ContactRecord[]
        }
      } catch (e) {
        console.error('[Store] loadContactRecords error:', e)
      }
      setCards(initialCards)
      cardsRef.current = initialCards
      setContactedMap(initialContacted)
      contactedRef.current = initialContacted
      setContactRecords(initialRecords)
      contactRecordsRef.current = initialRecords
      setOverviewStats(calcStats(initialCards))
    }
    loadData()
  }, [])

  const addCard = useCallback((cardData: Omit<CustomerCard, 'id' | 'status' | 'records' | 'createDate'>) => {
    const newCard: CustomerCard = {
      ...cardData,
      id: generateId(),
      createDate: dayjs().format('YYYY-MM-DD'),
      records: [],
      status: 'normal'
    }
    newCard.status = computeCardStatus(newCard)

    setCards(prev => {
      const next = [newCard, ...prev]
      cardsRef.current = next
      persistCards(next)
      setOverviewStats(calcStats(next))
      return next
    })
  }, [])

  const updateCard = useCallback((cardId: string, updates: Partial<Omit<CustomerCard, 'id' | 'status' | 'createDate' | 'records'>>) => {
    setCards(prev => {
      const next = prev.map(card => {
        if (card.id !== cardId) return card
        const updated: CustomerCard = { ...card, ...updates }
        if (updated.cardType === 'combo' && updated.subItems && (updates.giftedCount !== undefined || updates.compensatedCount !== undefined)) {
          const oldGifted = card.giftedCount || 0
          const oldComp = card.compensatedCount || 0
          const newGifted = updates.giftedCount || 0
          const newComp = updates.compensatedCount || 0
          const addedGifted = Math.max(0, newGifted - oldGifted)
          const addedComp = Math.max(0, newComp - oldComp)
          const totalAdded = addedGifted + addedComp
          if (totalAdded > 0) {
            const perItem = Math.floor(totalAdded / updated.subItems.length)
            const remainder = totalAdded - perItem * updated.subItems.length
            updated.subItems = updated.subItems.map((si, idx) => ({
              ...si,
              totalCount: si.totalCount + perItem + (idx === 0 ? remainder : 0)
            }))
          }
        }
        updated.status = computeCardStatus(updated)
        return updated
      })
      cardsRef.current = next
      persistCards(next)
      setOverviewStats(calcStats(next))
      return next
    })
  }, [])

  const deductCard = useCallback((cardId: string, record: Omit<DeductRecord, 'id' | 'date'>, subItemName?: string) => {
    setCards(prev => {
      const next = prev.map(card => {
        if (card.id !== cardId) return card
        const newRecord: DeductRecord = {
          ...record,
          id: generateId(),
          date: dayjs().format('YYYY-MM-DD')
        }
        let newSubItems = card.subItems
        if (card.cardType === 'combo' && subItemName && card.subItems) {
          newSubItems = card.subItems.map(si => {
            if (si.name === subItemName) {
              return { ...si, usedCount: si.usedCount + 1 }
            }
            return si
          })
        }
        const updated: CustomerCard = {
          ...card,
          usedCount: card.usedCount + 1,
          records: [newRecord, ...card.records],
          subItems: newSubItems
        }
        updated.status = computeCardStatus(updated)
        return updated
      })
      cardsRef.current = next
      persistCards(next)
      setOverviewStats(calcStats(next))
      return next
    })
  }, [])

  const markContacted = useCallback((customerId: string) => {
    const today = dayjs().format('YYYY-MM-DD')
    const key = `${today}_${customerId}`
    setContactedMap(prev => {
      const next = { ...prev, [key]: today }
      contactedRef.current = next
      persistContacted(next)
      return next
    })
  }, [])

  const addContactRecord = useCallback((customerId: string, type: ContactType, resultNote?: string) => {
    const today = dayjs().format('YYYY-MM-DD')
    const key = `${today}_${customerId}`
    const newRecord: ContactRecord = {
      id: generateId(),
      customerId,
      type,
      typeLabel: CONTACT_TYPE_LABELS[type],
      dateTime: dayjs().format('YYYY-MM-DD HH:mm'),
      resultNote
    }
    setContactedMap(prev => {
      const next = { ...prev, [key]: today }
      contactedRef.current = next
      persistContacted(next)
      return next
    })
    setContactRecords(prev => {
      const next = [newRecord, ...prev]
      contactRecordsRef.current = next
      persistContactRecords(next)
      return next
    })
  }, [])

  const updateContactRecordNote = useCallback((recordId: string, resultNote: string) => {
    setContactRecords(prev => {
      const next = prev.map(r => r.id === recordId ? { ...r, resultNote } : r)
      contactRecordsRef.current = next
      persistContactRecords(next)
      return next
    })
  }, [])

  const renewCard = useCallback((cardId: string, renewal: { addAmount?: number; extendDays?: number; addCount?: number; note?: string }) => {
    setCards(prev => {
      const next = prev.map(card => {
        if (card.id !== cardId) return card
        const now = dayjs()
        const renewalRecord: RenewalRecord = {
          id: generateId(),
          dateTime: now.format('YYYY-MM-DD HH:mm'),
          addAmount: renewal.addAmount || 0,
          extendDays: renewal.extendDays || 0,
          addCount: renewal.addCount || 0,
          note: renewal.note
        }
        let newExpire = card.expireDate
        if (renewal.extendDays && renewal.extendDays > 0) {
          const base = dayjs(card.expireDate).isAfter(now) ? dayjs(card.expireDate) : now
          newExpire = base.add(renewal.extendDays, 'day').format('YYYY-MM-DD')
        }
        let newTotalCount = card.totalCount
        if (renewal.addCount && renewal.addCount > 0) {
          newTotalCount = card.totalCount + renewal.addCount
        }
        let newPayment = card.paymentAmount
        if (renewal.addAmount && renewal.addAmount > 0) {
          newPayment = (card.paymentAmount || 0) + renewal.addAmount
        }
        let newSubItems = card.subItems
        if (card.cardType === 'combo' && renewal.addCount && renewal.addCount > 0 && card.subItems) {
          const perItem = Math.floor(renewal.addCount / card.subItems.length)
          const remainder = renewal.addCount - perItem * card.subItems.length
          newSubItems = card.subItems.map((si, idx) => ({
            ...si,
            totalCount: si.totalCount + perItem + (idx === 0 ? remainder : 0)
          }))
        }
        const updated: CustomerCard = {
          ...card,
          expireDate: newExpire,
          totalCount: newTotalCount,
          paymentAmount: newPayment,
          subItems: newSubItems,
          renewalRecords: [renewalRecord, ...(card.renewalRecords || [])]
        }
        updated.status = computeCardStatus(updated)
        return updated
      })
      cardsRef.current = next
      persistCards(next)
      setOverviewStats(calcStats(next))
      return next
    })
  }, [])

  const refreshStats = useCallback(() => {
    setOverviewStats(calcStats(cardsRef.current))
  }, [])

  return (
    <StoreContext.Provider value={{
      cards,
      overviewStats,
      contactedMap,
      contactRecords,
      addCard,
      updateCard,
      deductCard,
      markContacted,
      addContactRecord,
      updateContactRecordNote,
      renewCard,
      refreshStats
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
