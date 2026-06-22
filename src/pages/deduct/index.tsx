import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import CustomerCard from '@/components/CustomerCard'
import { useStore } from '@/store'
import { OPERATOR_OPTIONS, COMBO_SUB_ITEMS } from '@/types'
import { getRemainingCount } from '@/utils'
import type { CustomerCard as CustomerCardType } from '@/types'

const DeductPage: React.FC = () => {
  const { cards, deductCard } = useStore()
  const [searchText, setSearchText] = useState('')
  const [selectedCard, setSelectedCard] = useState<CustomerCardType | null>(null)
  const [selectedSubItem, setSelectedSubItem] = useState('')
  const [operator, setOperator] = useState('')
  const [hasPhoto, setHasPhoto] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [note, setNote] = useState('')

  const availableCards = useMemo(() => {
    return cards.filter(card => {
      if (card.status === 'usedup' || card.status === 'expired') return false
      const matchSearch = !searchText ||
        card.customerName.includes(searchText) ||
        card.phone.includes(searchText) ||
        card.projectName.includes(searchText)
      return matchSearch
    })
  }, [cards, searchText])

  const remaining = selectedCard ? getRemainingCount(selectedCard) : 0

  const canDeduct = selectedCard && remaining > 0 && operator &&
    (selectedCard.cardType !== 'combo' || !!selectedSubItem)

  const handleCardSelect = (card: CustomerCardType) => {
    setSelectedCard(card)
    setSelectedSubItem('')
    if (card.cardType === 'combo' && card.subItems && card.subItems.length > 0) {
      const available = card.subItems.find(si => si.totalCount - si.usedCount > 0)
      if (available) setSelectedSubItem(available.name)
    }
  }

  const handleDeduct = async () => {
    if (!canDeduct || !selectedCard) return

    const itemName = selectedCard.cardType === 'combo'
      ? selectedSubItem
      : selectedCard.projectName

    try {
      deductCard(
        selectedCard.id,
        {
          itemName,
          operator,
          hasPhoto,
          signature: hasSignature ? '已签字' : undefined,
          note: note || undefined
        },
        selectedCard.cardType === 'combo' ? selectedSubItem : undefined
      )

      Taro.showToast({ title: '扣次成功', icon: 'success' })

      setSelectedCard(null)
      setSelectedSubItem('')
      setOperator('')
      setHasPhoto(false)
      setHasSignature(false)
      setNote('')
    } catch (e) {
      console.error('[Deduct] deduct error:', e)
      Taro.showToast({ title: '扣次失败，请重试', icon: 'none' })
    }
  }

  return (
    <View className={styles.page}>
      <View className={styles.searchBar}>
        <View className={styles.searchInput}>
          <Input
            className={styles.searchInputText}
            placeholder="搜索顾客姓名、手机号"
            placeholderClass={styles.searchInputPlaceholder}
            value={searchText}
            onInput={e => setSearchText(e.detail.value)}
          />
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>选择顾客卡片</Text>
      </View>

      <ScrollView className={styles.cardList} scrollY>
        {availableCards.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>👤</Text>
            <Text className={styles.emptyText}>暂无可服务的顾客</Text>
          </View>
        ) : (
          availableCards.map(card => (
            <CustomerCard
              key={card.id}
              card={card}
              selected={selectedCard?.id === card.id}
              onClick={() => handleCardSelect(card)}
            />
          ))
        )}
      </ScrollView>

      {selectedCard && (
        <View className={styles.section} style={{ marginTop: '16rpx' }}>
          <Text className={styles.sectionTitle}>扣次信息</Text>
          <View className={styles.deductForm}>
            <View className={styles.selectedCardInfo}>
              <Text className={styles.selectedName}>{selectedCard.customerName}</Text>
              <Text className={styles.selectedProject}>{selectedCard.projectName}</Text>
              <Text className={styles.selectedRemaining}>剩余 {remaining} 次</Text>
              <Text
                style={{ fontSize: 24, color: '#6C5CE7', marginTop: 8 }}
                onClick={() => Taro.navigateTo({ url: `/pages/card-detail/index?cardId=${selectedCard.id}` })}
              >
                查看详情 →
              </Text>
            </View>

            {selectedCard.cardType === 'combo' && selectedCard.subItems && (
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>选择消耗项目</Text>
                <View className={styles.optionGroup}>
                  {selectedCard.subItems
                    .filter(si => si.totalCount - si.usedCount > 0)
                    .map(si => (
                      <Text
                        key={si.name}
                        className={classnames(
                          styles.optionItem,
                          selectedSubItem === si.name && styles.optionItemActive
                        )}
                        onClick={() => setSelectedSubItem(si.name)}
                      >
                        {si.name}（剩{si.totalCount - si.usedCount}）
                      </Text>
                    ))}
                </View>
              </View>
            )}

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>操作者</Text>
              <View className={styles.optionGroup}>
                {OPERATOR_OPTIONS.map(op => (
                  <Text
                    key={op}
                    className={classnames(styles.optionItem, operator === op && styles.optionItemActive)}
                    onClick={() => setOperator(op)}
                  >
                    {op}
                  </Text>
                ))}
              </View>
            </View>

            <View className={styles.formItem}>
              <View className={styles.checkboxRow} onClick={() => setHasPhoto(!hasPhoto)}>
                <View className={classnames(styles.checkbox, hasPhoto && styles.checkboxChecked)}>
                  {hasPhoto && <Text className={styles.checkboxIcon}>✓</Text>}
                </View>
                <Text className={styles.checkboxLabel}>拍照留档</Text>
              </View>
            </View>

            <View className={styles.formItem}>
              <View className={styles.checkboxRow} onClick={() => setHasSignature(!hasSignature)}>
                <View className={classnames(styles.checkbox, hasSignature && styles.checkboxChecked)}>
                  {hasSignature && <Text className={styles.checkboxIcon}>✓</Text>}
                </View>
                <Text className={styles.checkboxLabel}>顾客签字确认</Text>
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>备注（选填）</Text>
              <Input
                className={styles.formInput}
                placeholder="本次服务备注..."
                value={note}
                onInput={e => setNote(e.detail.value)}
              />
            </View>
          </View>
        </View>
      )}

      <View className={styles.footerBar}>
        <Button
          className={classnames(styles.submitBtn, !canDeduct && styles.submitBtnDisabled)}
          onClick={handleDeduct}
          disabled={!canDeduct}
        >
          确认扣次
        </Button>
      </View>
    </View>
  )
}

export default DeductPage
