import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'
import type { CardStatus } from '@/types'
import { STATUS_LABELS } from '@/types'

interface StatusTagProps {
  status: CardStatus
  size?: 'sm' | 'md'
}

const StatusTag: React.FC<StatusTagProps> = ({ status, size = 'sm' }) => {
  return (
    <View className={classnames(styles.tag, styles[status], styles[size])}>
      <Text className={styles.text}>{STATUS_LABELS[status]}</Text>
    </View>
  )
}

export default StatusTag
