import React, { useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import styles from './index.module.scss'
import StatCard from '@/components/StatCard'
import { useStore } from '@/store'
import { formatDateCN } from '@/utils'

const OverviewPage: React.FC = () => {
  const { overviewStats, cards, refreshStats } = useStore()

  useEffect(() => {
    refreshStats()
  }, [refreshStats])

  const recentRecords = cards
    .flatMap(card => card.records.map(r => ({ ...r, customerName: card.customerName, projectName: card.projectName })))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>医美疗程卡本</Text>
        <Text className={styles.subtitle}>{formatDateCN(new Date())}</Text>
      </View>

      <ScrollView className={styles.content} scrollY>
        <View className={styles.statsGrid}>
          <StatCard label="今日扣次" value={overviewStats.todayDeductCount} unit="次" type="primary" />
          <StatCard label="剩余服务" value={overviewStats.totalRemainingCount} unit="次" type="success" />
          <StatCard label="即将到期" value={overviewStats.expiringCustomerCount} unit="人" type="warning" />
          <StatCard label="本月续卡" value={overviewStats.monthlyRenewalAmount} unit="元" type="error" />
        </View>

        <Text className={styles.sectionTitle}>最近服务记录</Text>
        <View className={styles.recentList}>
          {recentRecords.length === 0 ? (
            <View className={styles.recentItem}>
              <Text className={styles.recentProject}>暂无服务记录</Text>
            </View>
          ) : (
            recentRecords.map((record, idx) => (
              <View key={idx} className={styles.recentItem}>
                <View className={styles.recentInfo}>
                  <Text className={styles.recentName}>{record.customerName} - {record.itemName}</Text>
                  <Text className={styles.recentProject}>操作者：{record.operator}</Text>
                </View>
                <Text className={styles.recentTime}>{record.date}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default OverviewPage
