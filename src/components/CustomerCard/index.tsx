import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'
import type { CustomerCard } from '@/types'
import StatusTag from '@/components/StatusTag'
import { getRemainingCount, getExpireText, maskPhone } from '@/utils'

interface CustomerCardProps {
  card: CustomerCard
  onClick?: () => void
  selected?: boolean
}

const CustomerCardComp: React.FC<CustomerCardProps> = ({ card, onClick, selected }) => {
  const remaining = getRemainingCount(card)
  const total = card.totalCount + (card.giftedCount || 0) + (card.compensatedCount || 0)
  const expireText = getExpireText(card)

  return (
    <View
      className={classnames(styles.card, styles[card.status], selected && styles.selected)}
      onClick={onClick}
    >
      <View className={styles.cardHeader}>
        <View className={styles.customerInfo}>
          <Text className={styles.customerName}>{card.customerName}</Text>
          <Text className={styles.phone}>{maskPhone(card.phone)}</Text>
        </View>
        <StatusTag status={card.status} />
      </View>

      <View className={styles.projectRow}>
        <Text className={styles.projectName}>{card.projectName}</Text>
        {card.cardType === 'combo' && <Text className={styles.comboBadge}>组合卡</Text>}
      </View>

      <View className={styles.progressSection}>
        <View className={styles.progressInfo}>
          <Text className={styles.progressText}>
            剩余 <Text className={styles.remainingNum}>{remaining}</Text>/{total} 次
          </Text>
          <Text className={styles.expireText}>{expireText}</Text>
        </View>
        <View className={styles.progressBar}>
          <View
            className={classnames(styles.progressFill, styles[card.status])}
            style={{ width: `${Math.min(100, (remaining / total) * 100)}%` }}
          />
        </View>
        {(card.giftedCount || card.compensatedCount) && (
          <View className={styles.extraRow}>
            {card.giftedCount ? <Text className={styles.extraTag}>赠送{card.giftedCount}次</Text> : null}
            {card.compensatedCount ? <Text className={styles.extraTag}>补偿{card.compensatedCount}次</Text> : null}
          </View>
        )}
      </View>

      {card.subItems && card.subItems.length > 0 && (
        <View className={styles.subItems}>
          {card.subItems.map((sub, idx) => (
            <View key={idx} className={styles.subItem}>
              <Text className={styles.subItemName}>{sub.name}</Text>
              <Text className={styles.subItemCount}>{sub.totalCount - sub.usedCount}/{sub.totalCount}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

export default CustomerCardComp
