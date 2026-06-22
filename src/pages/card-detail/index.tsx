import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, Input, Textarea, Button, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import dayjs from 'dayjs'
import styles from './index.module.scss'
import { useStore } from '@/store'
import StatusTag from '@/components/StatusTag'
import { getRemainingCount, getExpireText, formatDateCN } from '@/utils'
import type { CustomerCard } from '@/types'

const CardDetailPage: React.FC = () => {
  const router = useRouter()
  const cardId = router.params.cardId
  const { cards, updateCard, deductCard } = useStore()
  const [isEditing, setIsEditing] = useState(false)

  const card = useMemo(() => cards.find(c => c.id === cardId), [cards, cardId])

  const [phone, setPhone] = useState('')
  const [expireDate, setExpireDate] = useState('')
  const [note, setNote] = useState('')
  const [contraindications, setContraindications] = useState('')
  const [giftedCount, setGiftedCount] = useState('')
  const [compensatedCount, setCompensatedCount] = useState('')

  useEffect(() => {
    if (card) {
      setPhone(card.phone)
      setExpireDate(card.expireDate)
      setNote(card.note || '')
      setContraindications(card.contraindications || '')
      setGiftedCount(card.giftedCount ? String(card.giftedCount) : '')
      setCompensatedCount(card.compensatedCount ? String(card.compensatedCount) : '')
    }
  }, [card])

  if (!card) {
    return (
      <View className={styles.page}>
        <View style={{ padding: 80, textAlign: 'center', color: '#86909C' }}>
          未找到该卡片
        </View>
      </View>
    )
  }

  const remaining = getRemainingCount(card)
  const total = card.totalCount + (card.giftedCount || 0) + (card.compensatedCount || 0)

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setPhone(card.phone)
    setExpireDate(card.expireDate)
    setNote(card.note || '')
    setContraindications(card.contraindications || '')
    setGiftedCount(card.giftedCount ? String(card.giftedCount) : '')
    setCompensatedCount(card.compensatedCount ? String(card.compensatedCount) : '')
  }

  const handleSave = () => {
    if (!/^1\d{10}$/.test(phone)) {
      Taro.showToast({ title: '请输入正确手机号', icon: 'none' })
      return
    }
    try {
      updateCard(card.id, {
        phone: phone.trim(),
        expireDate,
        note: note || undefined,
        contraindications: contraindications || undefined,
        giftedCount: giftedCount ? parseInt(giftedCount) : undefined,
        compensatedCount: compensatedCount ? parseInt(compensatedCount) : undefined
      })
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setIsEditing(false)
    } catch (e) {
      console.error('[CardDetail] save error:', e)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }

  const handleQuickDeduct = () => {
    Taro.switchTab({ url: '/pages/deduct/index' })
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerName}>{card.customerName}</Text>
        <Text className={styles.headerProject}>{card.projectName}</Text>
        <View className={styles.headerTagRow}>
          <StatusTag status={card.status} size="md" />
          {card.cardType === 'combo' && (
            <Text style={{ fontSize: 24, color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.2)', padding: '4rpx 16rpx', borderRadius: 8 }}>
              组合卡
            </Text>
          )}
        </View>
      </View>

      <ScrollView className={styles.content} scrollY>
        <View className={styles.sectionCard}>
          <View className={styles.sectionTitle}>
            疗程概览
            {!isEditing && <Text className={styles.editBtn} onClick={handleEdit}>编辑</Text>}
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>剩余次数</Text>
            <Text className={classnames(styles.infoValue, styles.infoValueHighlight)}>
              {remaining} / {total} 次
            </Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>有效期</Text>
            {isEditing ? (
              <Input
                className={styles.formInput}
                placeholder="YYYY-MM-DD"
                value={expireDate}
                onInput={e => setExpireDate(e.detail.value)}
                style={{ width: 280, textAlign: 'right' }}
              />
            ) : (
              <Text className={styles.infoValue}>{getExpireText(card)}</Text>
            )}
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>手机号</Text>
            {isEditing ? (
              <Input
                className={styles.formInput}
                type="number"
                placeholder="请输入手机号"
                value={phone}
                onInput={e => setPhone(e.detail.value)}
                style={{ width: 280, textAlign: 'right' }}
                maxlength={11}
              />
            ) : (
              <Text className={styles.infoValue}>{card.phone}</Text>
            )}
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>购买金额</Text>
            <Text className={styles.infoValue}>
              {card.paymentAmount ? `¥${card.paymentAmount}` : '未记录'}
            </Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>开卡日期</Text>
            <Text className={styles.infoValue}>{formatDateCN(card.createDate)}</Text>
          </View>
        </View>

        {isEditing && (
          <View className={styles.sectionCard}>
            <View className={styles.sectionTitle}>次数调整</View>
            <View className={styles.formItem}>
              <Text className={styles.formLabel}>赠送次数</Text>
              <Input
                className={styles.formInput}
                type="number"
                placeholder="赠送的额外次数"
                value={giftedCount}
                onInput={e => setGiftedCount(e.detail.value)}
              />
            </View>
            <View className={styles.formItem}>
              <Text className={styles.formLabel}>补偿次数</Text>
              <Input
                className={styles.formInput}
                type="number"
                placeholder="补偿的额外次数"
                value={compensatedCount}
                onInput={e => setCompensatedCount(e.detail.value)}
              />
            </View>
          </View>
        )}

        {card.cardType === 'combo' && card.subItems && (
          <View className={styles.sectionCard}>
            <View className={styles.sectionTitle}>组合卡子项目</View>
            <View className={styles.subItemsGrid}>
              {card.subItems.map((si, idx) => (
                <View key={idx} className={styles.subItemCard}>
                  <Text className={styles.subItemName}>{si.name}</Text>
                  <Text className={styles.subItemCount}>
                    剩 {si.totalCount - si.usedCount}/{si.totalCount}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className={styles.sectionCard}>
          <View className={styles.sectionTitle}>
            历史扣次记录
            <Text className={styles.editBtn}>{card.records.length} 次</Text>
          </View>
          {card.records.length === 0 ? (
            <View className={styles.emptyRecords}>暂无扣次记录</View>
          ) : (
            card.records.map(record => (
              <View key={record.id} className={styles.recordItem}>
                <View className={styles.recordHeader}>
                  <Text className={styles.recordItemName}>{record.itemName}</Text>
                  <Text className={styles.recordDate}>{record.date}</Text>
                </View>
                <View className={styles.recordMeta}>
                  <Text className={styles.recordMetaTag}>操作者：{record.operator}</Text>
                  {record.hasPhoto && <Text className={styles.recordMetaTag}>📷 已拍照</Text>}
                  {record.signature && <Text className={styles.recordMetaTag}>✍️ 已签字</Text>}
                </View>
                {record.note && (
                  <View style={{ marginTop: 8, fontSize: 24, color: '#86909C' }}>
                    备注：{record.note}
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        <View className={styles.sectionCard}>
          <View className={styles.sectionTitle}>备注信息</View>
          {isEditing ? (
            <>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>备注</Text>
                <Textarea
                  className={styles.formTextarea}
                  placeholder="如：皮肤类型、偏好等"
                  value={note}
                  onInput={e => setNote(e.detail.value)}
                  maxlength={200}
                />
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>禁忌</Text>
                <Textarea
                  className={styles.formTextarea}
                  placeholder="如：过敏史、孕期等"
                  value={contraindications}
                  onInput={e => setContraindications(e.detail.value)}
                  maxlength={200}
                />
              </View>
            </>
          ) : (
            <>
              <View style={{ marginBottom: 16 }}>
                <Text className={styles.infoLabel} style={{ marginBottom: 8, display: 'block' }}>备注</Text>
                {card.note ? (
                  <Text className={styles.noteText}>{card.note}</Text>
                ) : (
                  <Text className={styles.noteEmpty}>暂无备注</Text>
                )}
              </View>
              <View>
                <Text className={styles.infoLabel} style={{ marginBottom: 8, display: 'block' }}>禁忌</Text>
                {card.contraindications ? (
                  <Text className={styles.noteText}>{card.contraindications}</Text>
                ) : (
                  <Text className={styles.noteEmpty}>无禁忌</Text>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {isEditing ? (
        <View className={styles.footerBar}>
          <Button className={classnames(styles.footerBtn, styles.btnCancel)} onClick={handleCancel}>
            取消
          </Button>
          <Button className={classnames(styles.footerBtn, styles.btnSave)} onClick={handleSave}>
            保存
          </Button>
        </View>
      ) : (
        <View className={styles.footerBar}>
          <Button className={classnames(styles.footerBtn, styles.btnDeduct)} onClick={handleQuickDeduct}>
            去扣次
          </Button>
        </View>
      )}
    </View>
  )
}

export default CardDetailPage
