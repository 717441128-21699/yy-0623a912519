import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react'
import Taro from '@tarojs/taro'
import type { CustomerCard, OverviewStats, DeductRecord } from '@/types'
import { mockCustomerCards } from '@/data/mock'
import { computeCardStatus, generateId } from '@/utils'
import dayjs from 'dayjs'

interface StoreContextType {
  cards: CustomerCard[]
  overviewStats: OverviewStats
  contactedMap: Record<string, string>
  addCard: (card: Omit<CustomerCard, 'id' | 'status' | 'records' | 'createDate'>) => void
  updateCard: (cardId: string, updates: Partial<Omit<CustomerCard, 'id' | 'status' | 'createDate' | 'records'>>) => void
  deductCard: (cardId: string, record: Omit<DeductRecord, 'id' | 'date'>, subItemName?: string) => void
  markContacted: (customerId: string) => void
  refreshStats: () => void
}

const StoreContext = createContext<StoreContextType | null>(null)

const STORAGE_KEY = 'medical_aesthetic_cards'
const CONTACTED_KEY = 'medical_aesthetic_contacted'

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
    if (card.createDate.startsWith(currentMonth) && card.paymentAmount) {
      monthlyAmount += card.paymentAmount
    }
  })
  return {
    todayDeductCount: todayCount,
    totalRemainingCount: totalRemaining,
    expiringCustomerCount: expiringCount,
    monthlyRenewalAmount: monthlyAmount
  }
}

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cards, setCards] = useState<CustomerCard[]>([])
  const [contactedMap, setContactedMap] = useState<Record<string, string>>({})
  const [overviewStats, setOverviewStats] = useState<OverviewStats>({
    todayDeductCount: 0,
    totalRemainingCount: 0,
    expiringCustomerCount: 0,
    monthlyRenewalAmount: 0
  })
  const cardsRef = useRef<CustomerCard[]>([])
  const contactedRef = useRef<Record<string, string>>({})

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

  useEffect(() => {
    const loadData = async () => {
      let initialCards: CustomerCard[]
      let initialContacted: Record<string, string> = {}
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
      setCards(initialCards)
      cardsRef.current = initialCards
      setContactedMap(initialContacted)
      contactedRef.current = initialContacted
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

  const refreshStats = useCallback(() => {
    setOverviewStats(calcStats(cardsRef.current))
  }, [])

  return (
    <StoreContext.Provider value={{ cards, overviewStats, contactedMap, addCard, updateCard, deductCard, markContacted, refreshStats }}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
