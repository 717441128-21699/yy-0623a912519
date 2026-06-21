import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'

type StatType = 'primary' | 'success' | 'warning' | 'error'

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  type?: StatType
  onClick?: () => void
}

const StatCard: React.FC<StatCardProps> = ({ label, value, unit, type = 'primary', onClick }) => {
  return (
    <View className={classnames(styles.statCard, styles[type])} onClick={onClick}>
      <Text className={styles.value}>
        {value}
        {unit && <Text className={styles.unit}>{unit}</Text>}
      </Text>
      <Text className={styles.label}>{label}</Text>
    </View>
  )
}

export default StatCard
