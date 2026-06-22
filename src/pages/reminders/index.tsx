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
  const { cards } = useStore()
  const [activeTab, setActiveTab] = useState<TabType>('thisWeek')

  const allReminders = useMemo(() => {
    const now = dayjs()
    const result = cards
      .filter(card => card.status !== 'usedup' && card.status !== 'expired')
      .map(card => {
        const remaining = getRemainingCount(card)
        if (remaining <= 0) return null
        const lastVisit = card.records.length > 0 ? card.records[0].date : card.createDate
        const suggestedDate = dayjs(lastVisit).add(10, 'day')
        return {
          id: card.id,
          customerId: card.id,
          customerName: card.customerName,
          phone: card.phone,
          projectName: card.projectName,
          remainingCount: remaining,
          lastVisitDate: lastVisit,
          suggestedDate: suggestedDate.format('YYYY-MM-DD'),
          messageTemplate: generateReminderMessage(card.customerName, card.projectName, remaining)
        }
      })
      .filter(item => item !== null)
      .sort((a, b) => a.suggestedDate.localeCompare(b.suggestedDate))
    return result as ReminderItem[]
  }, [cards])

  const stats = useMemo(() => {
    const now = dayjs()
    const weekEnd = now.endOf('week')
    const thisWeekCount = allReminders.filter(r =>
      dayjs(r.suggestedDate).isBefore(weekEnd)
    ).length
    const expiringCount = cards.filter(c => c.status === 'expiring').length
    return { thisWeek: thisWeekCount, expiring: expiringCount, total: allReminders.length }
  }, [allReminders, cards])

  const computedReminders = useMemo(() => {
    const now = dayjs()
    const weekEnd = now.endOf('week')
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

  const handleCopy = async (message: string) => {
    try {
      await Taro.setClipboardData({ data: message })
      Taro.showToast({ title: '话术已复制', icon: 'success' })
    } catch (e) {
      console.error('[Reminders] copy error:', e)
      Taro.showToast({ title: '复制失败', icon: 'none' })
    }
  }

  const handleCall = (phone: string) => {
    Taro.makePhoneCall({ phoneNumber: phone })
      .catch(e => console.error('[Reminders] call error:', e))
  }

  const isUrgent = (date: string) => {
    return dayjs(date).diff(dayjs(), 'day') <= 3
  }

  const tabOptions: { key: TabType; label: string; count: number }[] = [
    { key: 'thisWeek', label: '本周提醒', count: stats.thisWeek },
    { key: 'expiring', label: '即将到期', count: stats.expiring },
    { key: 'all', label: '全部', count: stats.total }
  ]

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>提醒日历</Text>
        <Text className={styles.headerSubtitle}>本周需联系客户</Text>
        <View className={styles.headerStats}>
          <View className={styles.headerStatItem}>
            <Text className={styles.headerStatNum}>{stats.thisWeek}</Text>
            <Text className={styles.headerStatLabel}>本周待提醒</Text>
          </View>
          <View className={styles.headerStatItem}>
            <Text className={styles.headerStatNum}>{stats.expiring}</Text>
            <Text className={styles.headerStatLabel}>即将到期</Text>
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
              <View key={reminder.id} className={styles.reminderCard}>
                <View className={styles.reminderHeader}>
                  <View className={styles.customerInfo}>
                    <Text className={styles.customerName}>{reminder.customerName}</Text>
                    <Text className={styles.customerProject}>{reminder.projectName}</Text>
                  </View>
                  {isUrgent(reminder.suggestedDate) && (
                    <Text className={styles.urgentBadge}>紧急</Text>
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
                    onClick={() => handleCopy(reminder.messageTemplate)}
                  >
                    复制话术
                  </Button>
                  <Button
                    className={classnames(styles.actionBtn, styles.btnCall)}
                    onClick={() => handleCall(reminder.phone)}
                  >
                    拨打电话
                  </Button>
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
