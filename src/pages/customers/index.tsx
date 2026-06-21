import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import CustomerCard from '@/components/CustomerCard'
import { useStore } from '@/store'
import type { CardStatus } from '@/types'

type FilterType = 'all' | CardStatus

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'normal', label: '正常' },
  { key: 'expiring', label: '快过期' },
  { key: 'expired', label: '已过期' },
  { key: 'usedup', label: '已用完' }
]

const CustomersPage: React.FC = () => {
  const { cards } = useStore()
  const [searchText, setSearchText] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      const matchSearch = !searchText ||
        card.customerName.includes(searchText) ||
        card.phone.includes(searchText) ||
        card.projectName.includes(searchText)
      const matchFilter = activeFilter === 'all' || card.status === activeFilter
      return matchSearch && matchFilter
    })
  }, [cards, searchText, activeFilter])

  const stats = useMemo(() => {
    return {
      total: cards.length,
      normal: cards.filter(c => c.status === 'normal').length,
      expiring: cards.filter(c => c.status === 'expiring').length,
      expired: cards.filter(c => c.status === 'expired').length,
      usedup: cards.filter(c => c.status === 'usedup').length
    }
  }, [cards])

  const handleCardClick = (cardId: string) => {
    Taro.showToast({ title: '查看详情', icon: 'none' })
  }

  return (
    <View className={styles.page}>
      <View className={styles.searchBar}>
        <View className={styles.searchInput}>
          <Input
            className={styles.searchInputText}
            placeholder="搜索顾客姓名、手机号、项目"
            placeholderClass={styles.searchInputPlaceholder}
            value={searchText}
            onInput={e => setSearchText(e.detail.value)}
            confirmType="search"
          />
        </View>
      </View>

      <View className={styles.filterBar}>
        {FILTER_OPTIONS.map(opt => (
          <Text
            key={opt.key}
            className={classnames(styles.filterItem, activeFilter === opt.key && styles.filterItemActive)}
            onClick={() => setActiveFilter(opt.key)}
          >
            {opt.label}
          </Text>
        ))}
      </View>

      <View className={styles.statsBar}>
        <View className={styles.statsItem}>
          <Text className={styles.statsNum}>{stats.total}</Text>
          <Text className={styles.statsLabel}>总卡片</Text>
        </View>
        <View className={styles.statsItem}>
          <Text className={classnames(styles.statsNum, styles.statsNumNormal)}>{stats.normal}</Text>
          <Text className={styles.statsLabel}>正常</Text>
        </View>
        <View className={styles.statsItem}>
          <Text className={classnames(styles.statsNum, styles.statsNumExpiring)}>{stats.expiring}</Text>
          <Text className={styles.statsLabel}>快过期</Text>
        </View>
        <View className={styles.statsItem}>
          <Text className={classnames(styles.statsNum, styles.statsNumExpired)}>{stats.expired}</Text>
          <Text className={styles.statsLabel}>已过期</Text>
        </View>
      </View>

      <ScrollView className={styles.customerList} scrollY>
        {filteredCards.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无顾客卡片</Text>
          </View>
        ) : (
          filteredCards.map(card => (
            <CustomerCard key={card.id} card={card} onClick={() => handleCardClick(card.id)} />
          ))
        )}
      </ScrollView>
    </View>
  )
}

export default CustomersPage
