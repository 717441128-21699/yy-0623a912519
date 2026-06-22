import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Button, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import dayjs from 'dayjs'
import styles from './index.module.scss'
import { useStore } from '@/store'
import { generateReminderMessage, getRemainingCount, formatDateCN } from '@/utils'
import type { ReminderItem, ContactType } from '@/types'

type TabType = 'thisWeek' | 'expiring' | 'all'
type ContactFilter = 'pending' | 'done' | 'expiredUncontacted'

const RemindersPage: React.FC = () => {
  const { cards, contactedMap, addContactRecord } = useStore()
  const [activeTab, setActiveTab] = useState<TabType>('thisWeek')
  const [contactFilter, setContactFilter] = useState<ContactFilter>('pending')
  const [searchKeyword, setSearchKeyword] = useState('')
  const today = dayjs().format('YYYY-MM-DD')

  const allReminders = useMemo(() => {
    const result = cards
      .map(card => {
        const remaining = getRemainingCount(card)
        const isUsable = card.status !== 'usedup'
        if (!isUsable && remaining <= 0) return null
        const lastVisit = card.records.length > 0 ? card.records[0].date : card.createDate
        const suggestedDate = dayjs(lastVisit).add(10, 'day')
        const contactedKey = `${today}_${card.id}`
        return {
          id: card.id,
          customerId: card.id,
          customerName: card.customerName,
          phone: card.phone,
          projectName: card.projectName,
          remainingCount: remaining,
          lastVisitDate: lastVisit,
          suggestedDate: suggestedDate.format('YYYY-MM-DD'),
          messageTemplate: generateReminderMessage(card.customerName, card.projectName, remaining),
          contacted: !!contactedMap[contactedKey],
          contactedDate: contactedMap[contactedKey],
          status: card.status
        }
      })
      .filter(item => item !== null)
      .sort((a, b) => {
        if (a.contacted !== b.contacted) return a.contacted ? 1 : -1
        return a.suggestedDate.localeCompare(b.suggestedDate)
      })
    return result as (ReminderItem & { status: string })[]
  }, [cards, contactedMap, today])

  const contactFilterCounts = useMemo(() => {
    let pending = 0
    let done = 0
    let expiredUncontacted = 0
    allReminders.forEach(r => {
      if (r.status === 'expired' && !r.contacted) {
        expiredUncontacted++
      } else if (r.contacted) {
        done++
      } else {
        pending++
      }
    })
    return { pending, done, expiredUncontacted }
  }, [allReminders])

  const stats = useMemo(() => {
    const weekEnd = dayjs().endOf('week')
    const thisWeekCount = allReminders.filter(r =>
      r.status !== 'expired' && dayjs(r.suggestedDate).isBefore(weekEnd)
    ).length
    const expiringCount = cards.filter(c => c.status === 'expiring').length
    const totalActive = allReminders.filter(r => r.status !== 'expired').length
    return { thisWeek: thisWeekCount, expiring: expiringCount, total: totalActive }
  }, [allReminders, cards])

  const tabOptions = [
    { key: 'thisWeek' as TabType, label: '本周提醒', count: stats.thisWeek },
    { key: 'expiring' as TabType, label: '即将到期', count: stats.expiring },
    { key: 'all' as TabType, label: '全部', count: stats.total }
  ]

  const contactFilterOptions = [
    { key: 'pending' as ContactFilter, label: '待联系', count: contactFilterCounts.pending },
    { key: 'done' as ContactFilter, label: '已联系', count: contactFilterCounts.done },
    { key: 'expiredUncontacted' as ContactFilter, label: '已过期未联系', count: contactFilterCounts.expiredUncontacted }
  ]

  const computedReminders = useMemo(() => {
    const weekEnd = dayjs().endOf('week')
    let list = allReminders
    if (activeTab === 'expiring') {
      list = list.filter(r => {
        const card = cards.find(c => c.id === r.customerId)
        return card && card.status === 'expiring'
      })
    } else if (activeTab === 'thisWeek') {
      list = list.filter(r => r.status !== 'expired' && dayjs(r.suggestedDate).isBefore(weekEnd))
    } else {
      list = list.filter(r => r.status !== 'expired')
    }

    if (contactFilter === 'pending') {
      list = list.filter(r => !r.contacted && r.status !== 'expired')
    } else if (contactFilter === 'done') {
      list = list.filter(r => r.contacted)
    } else if (contactFilter === 'expiredUncontacted') {
      list = allReminders.filter(r => r.status === 'expired' && !r.contacted)
    }

    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase()
      list = list.filter(r =>
        r.customerName.toLowerCase().includes(kw) ||
        r.projectName.toLowerCase().includes(kw)
      )
    }

    return list.sort((a, b) => {
      if (a.contacted !== b.contacted) return a.contacted ? 1 : -1
      return a.suggestedDate.localeCompare(b.suggestedDate)
    })
  }, [allReminders, activeTab, contactFilter, searchKeyword, cards])

  const handleCopy = async (reminder: ReminderItem) => {
    try {
      await Taro.setClipboardData({ data: reminder.messageTemplate })
      addContactRecord(reminder.customerId, 'copy' as ContactType)
      Taro.showToast({ title: '话术已复制', icon: 'success' })
    } catch (e) {
      console.error('[Reminders] copy error:', e)
      Taro.showToast({ title: '复制失败', icon: 'none' })
    }
  }

  const handleCall = (reminder: ReminderItem) => {
    Taro.makePhoneCall({ phoneNumber: reminder.phone })
      .then(() => {
        addContactRecord(reminder.customerId, 'call' as ContactType)
      })
      .catch(e => console.error('[Reminders] call error:', e))
  }

  const handleMarkContacted = (reminder: ReminderItem) => {
    if (reminder.contacted) return
    addContactRecord(reminder.customerId, 'manual' as ContactType)
    Taro.showToast({ title: '已标记联系', icon: 'success' })
  }

  const handleGoDetail = (customerId: string) => {
    Taro.navigateTo({ url: `/pages/card-detail/index?cardId=${customerId}` })
  }

  const isUrgent = (date: string) => {
    return dayjs(date).diff(dayjs(), 'day') <= 3
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>提醒日历</Text>
        <Text className={styles.headerSubtitle}>保持每天跟进，客户续卡率翻倍</Text>
        <View className={styles.headerStats}>
          <View className={styles.headerStatItem}>
            <Text className={styles.headerStatNum}>{contactFilterCounts.pending}</Text>
            <Text className={styles.headerStatLabel}>待联系</Text>
          </View>
          <View className={styles.headerStatItem}>
            <Text className={styles.headerStatNum}>{contactFilterCounts.done}</Text>
            <Text className={styles.headerStatLabel}>已联系</Text>
          </View>
          <View className={styles.headerStatItem}>
            <Text className={styles.headerStatNum}>{contactFilterCounts.expiredUncontacted}</Text>
            <Text className={styles.headerStatLabel}>已过期未联系</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.searchRow}>
          <Input
            className={styles.searchInput}
            placeholder="搜索顾客姓名或项目..."
            value={searchKeyword}
            onInput={e => setSearchKeyword(e.detail.value)}
          />
          {searchKeyword && (
            <Text className={styles.searchClear} onClick={() => setSearchKeyword('')}>×</Text>
          )}
        </View>

        <View className={styles.tabs}>
          {tabOptions.map(tab => (
            <Text
              key={tab.key}
              className={classnames(styles.tabItem, activeTab === tab.key && styles.tabItemActive)}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}（{tab.count}）
            </Text>
          ))}
        </View>

        <View className={styles.contactFilter}>
          {contactFilterOptions.map(opt => (
            <Text
              key={opt.key}
              className={classnames(styles.filterItem, contactFilter === opt.key && styles.filterItemActive)}
              onClick={() => setContactFilter(opt.key)}
            >
              {opt.label}（{opt.count}）
            </Text>
          ))}
        </View>

        <ScrollView className={styles.reminderList} scrollY>
          {computedReminders.length === 0 ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>
                {contactFilter === 'done' ? '✅' : contactFilter === 'expiredUncontacted' ? '⌛' : '📅'}
              </Text>
              <Text className={styles.emptyText}>
                {contactFilter === 'done' ? '还没有已联系的记录' :
                 contactFilter === 'expiredUncontacted' ? '没有已过期但未联系的客户' :
                 searchKeyword ? '没有匹配的客户，换个关键词试试' : '暂无需要提醒的客户'}
              </Text>
              <Text className={styles.emptyHint}>
                {contactFilter === 'pending' ? '保持良好的客户跟进~' : '切换筛选看看其他分组'}
              </Text>
            </View>
          ) : (
            computedReminders.map(reminder => (
              <View
                key={reminder.id}
                className={classnames(
                  styles.reminderCard,
                  reminder.contacted && styles.reminderCardContacted,
                  reminder.status === 'expired' && !reminder.contacted && styles.reminderCardExpired
                )}
              >
                <View className={styles.reminderHeader}>
                  <View className={styles.customerInfo} onClick={() => handleGoDetail(reminder.customerId)}>
                    <Text className={styles.customerName}>{reminder.customerName}</Text>
                    <Text className={styles.customerProject}>{reminder.projectName} · 查看详情 →</Text>
                  </View>
                  {reminder.contacted ? (
                    <Text className={styles.contactedBadge}>✓ 已联系</Text>
                  ) : reminder.status === 'expired' ? (
                    <Text className={styles.expiredBadge}>已过期</Text>
                  ) : (
                    isUrgent(reminder.suggestedDate) && (
                      <Text className={styles.urgentBadge}>紧急</Text>
                    )
                  )}
                </View>

                <View className={styles.reminderDetails}>
                  <View className={styles.detailRow}>
                    <Text className={styles.detailLabel}>剩余次数</Text>
                    <Text className={classnames(styles.detailValue, styles.detailValueHighlight)}>
                      {reminder.remainingCount} 次
                    </Text>
                  </View>
                  <View className={styles.detailRow}>
                    <Text className={styles.detailLabel}>上次到店</Text>
                    <Text className={styles.detailValue}>{formatDateCN(reminder.lastVisitDate)}</Text>
                  </View>
                  <View className={styles.detailRow}>
                    <Text className={styles.detailLabel}>建议预约</Text>
                    <Text className={classnames(
                      styles.detailValue,
                      reminder.status === 'expired' && !reminder.contacted && styles.detailValueDanger
                    )}>
                      {formatDateCN(reminder.suggestedDate)}
                      {reminder.status === 'expired' && ' (卡片已过期)'}
                    </Text>
                  </View>
                </View>

                <View className={styles.messageTemplate}>
                  <Text className={styles.messageText}>{reminder.messageTemplate}</Text>
                </View>

                <View className={styles.actionRow}>
                  <Button
                    className={classnames(styles.actionBtn, styles.btnCopy)}
                    onClick={() => handleCopy(reminder)}
                  >
                    {reminder.contacted ? '重新复制' : '复制话术'}
                  </Button>
                  <Button
                    className={classnames(styles.actionBtn, styles.btnCall)}
                    onClick={() => handleCall(reminder)}
                  >
                    拨打电话
                  </Button>
                  {!reminder.contacted && (
                    <Button
                      className={classnames(styles.actionBtn, styles.btnDone)}
                      onClick={() => handleMarkContacted(reminder)}
                    >
                      标记联系
                    </Button>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  )
}

export default RemindersPage
