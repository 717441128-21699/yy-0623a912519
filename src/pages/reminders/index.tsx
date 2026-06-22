import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import dayjs from 'dayjs'
import styles from './index.module.scss'
import { useStore } from '@/store'
import { generateReminderMessage, getRemainingCount, formatDateCN } from '@/utils'
import type { ReminderItem } from '@/types'

type TabType = 'thisWeek' | 'expiring' | 'all'

const RemindersPage: React.FC = () => {
  const { cards, contactedMap, markContacted } = useStore()
  const [activeTab, setActiveTab] = useState<TabType>('thisWeek')
  const today = dayjs().format('YYYY-MM-DD')

  const allReminders = useMemo(() => {
    const result = cards
      .filter(card => card.status !== 'usedup' && card.status !== 'expired')
      .map(card => {
        const remaining = getRemainingCount(card)
        if (remaining <= 0) return null
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
          contactedDate: contactedMap[contactedKey]
        }
      })
      .filter(item => item !== null)
      .sort((a, b) => {
        if (a.contacted !== b.contacted) return a.contacted ? 1 : -1
        return a.suggestedDate.localeCompare(b.suggestedDate)
      })
    return result as ReminderItem[]
  }, [cards, contactedMap, today])

  const stats = useMemo(() => {
    const weekEnd = dayjs().endOf('week')
    const thisWeekCount = allReminders.filter(r =>
      dayjs(r.suggestedDate).isBefore(weekEnd)
    ).length
    const expiringCount = cards.filter(c => c.status === 'expiring').length
    const pendingCount = allReminders.filter(r => !r.contacted).length
    return { thisWeek: thisWeekCount, expiring: expiringCount, total: allReminders.length, pending: pendingCount }
  }, [allReminders, cards])

  const computedReminders = useMemo(() => {
    const weekEnd = dayjs().endOf('week')
    if (activeTab === 'expiring') {
      return allReminders.filter(r => {
        const card = cards.find(c => c.id === r.customerId)
        return card && card.status === 'expiring'
      })
    }
    if (activeTab === 'thisWeek') {
      return allReminders.filter(r => dayjs(r.suggestedDate).isBefore(weekEnd))
    }
    return allReminders
  }, [allReminders, activeTab, cards])

  const handleCopy = async (reminder: ReminderItem) => {
    try {
      await Taro.setClipboardData({ data: reminder.messageTemplate })
      markContacted(reminder.customerId)
      Taro.showToast({ title: '话术已复制', icon: 'success' })
    } catch (e) {
      console.error('[Reminders] copy error:', e)
      Taro.showToast({ title: '复制失败', icon: 'none' })
    }
  }

  const handleCall = (reminder: ReminderItem) => {
    Taro.makePhoneCall({ phoneNumber: reminder.phone })
      .then(() => {
        markContacted(reminder.customerId)
      })
      .catch(e => console.error('[Reminders] call error:', e))
  }

  const handleMarkContacted = (reminder: ReminderItem) => {
    if (reminder.contacted) return
    markContacted(reminder.customerId)
    Taro.showToast({ title: '已标记联系', icon: 'success' })
  }

  const handleGoDetail = (customerId: string) => {
    Taro.navigateTo({ url: `/pages/card-detail/index?cardId=${customerId}` })
  }

  const isUrgent = (date: string) => {
    return dayjs(date).diff(dayjs(), 'day') <= 3
  }

  const tabOptions = [
    { key: 'thisWeek' as TabType, label: '本周提醒', count: stats.thisWeek },
    { key: 'expiring' as TabType, label: '即将到期', count: stats.expiring },
    { key: 'all' as TabType, label: '全部', count: stats.total }
  ]

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>提醒日历</Text>
        <Text className={styles.headerSubtitle}>本周需联系客户</Text>
        <View className={styles.headerStats}>
          <View className={styles.headerStatItem}>
            <Text className={styles.headerStatNum}>{stats.pending}</Text>
            <Text className={styles.headerStatLabel}>待联系</Text>
          </View>
          <View className={styles.headerStatItem}>
            <Text className={styles.headerStatNum}>{allReminders.length - stats.pending}</Text>
            <Text className={styles.headerStatLabel}>今日已联系</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
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

        <ScrollView className={styles.reminderList} scrollY>
          {computedReminders.length === 0 ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📅</Text>
              <Text className={styles.emptyText}>暂无需要提醒的客户</Text>
              <Text className={styles.emptyHint}>保持良好的客户跟进~</Text>
            </View>
          ) : (
            computedReminders.map(reminder => (
              <View
                key={reminder.id}
                className={classnames(styles.reminderCard, reminder.contacted && styles.reminderCardContacted)}
              >
                <View className={styles.reminderHeader}>
                  <View className={styles.customerInfo} onClick={() => handleGoDetail(reminder.customerId)}>
                    <Text className={styles.customerName}>{reminder.customerName}</Text>
                    <Text className={styles.customerProject}>{reminder.projectName} · 查看详情 →</Text>
                  </View>
                  {reminder.contacted ? (
                    <Text className={styles.contactedBadge}>✓ 已联系</Text>
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
                    <Text className={styles.detailValue}>{formatDateCN(reminder.suggestedDate)}</Text>
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
