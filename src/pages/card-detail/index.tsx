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

type DetailTab = 'records' | 'contacts' | 'renewals'

const CardDetailPage: React.FC = () => {
  const router = useRouter()
  const cardId = router.params.cardId
  const { cards, updateCard, deductCard, contactRecords, updateContactRecordNote, renewCard } = useStore()
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<DetailTab>('records')
  const [showRenewModal, setShowRenewModal] = useState(false)

  const card = useMemo<CustomerCard | undefined>(() => cards.find(c => c.id === cardId), [cards, cardId])

  const myContactRecords = useMemo(
    () => contactRecords.filter(r => r.customerId === cardId),
    [contactRecords, cardId]
  )

  const [phone, setPhone] = useState('')
  const [expireDate, setExpireDate] = useState('')
  const [note, setNote] = useState('')
  const [contraindications, setContraindications] = useState('')
  const [giftedCount, setGiftedCount] = useState('')
  const [compensatedCount, setCompensatedCount] = useState('')

  const [editingNoteRecordId, setEditingNoteRecordId] = useState<string | null>(null)
  const [editingNoteText, setEditingNoteText] = useState('')

  const [renewAddAmount, setRenewAddAmount] = useState('')
  const [renewExtendDays, setRenewExtendDays] = useState('')
  const [renewAddCount, setRenewAddCount] = useState('')
  const [renewNote, setRenewNote] = useState('')

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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expireDate)) {
      Taro.showToast({ title: '有效期格式应为 YYYY-MM-DD', icon: 'none' })
      return
    }
    if (!dayjs(expireDate).isValid()) {
      Taro.showToast({ title: '请填写正确的日期', icon: 'none' })
      return
    }
    const gifted = giftedCount === '' ? 0 : parseInt(giftedCount)
    const compensated = compensatedCount === '' ? 0 : parseInt(compensatedCount)
    if (isNaN(gifted) || gifted < 0) {
      Taro.showToast({ title: '赠送次数不能为负数', icon: 'none' })
      return
    }
    if (isNaN(compensated) || compensated < 0) {
      Taro.showToast({ title: '补偿次数不能为负数', icon: 'none' })
      return
    }
    try {
      updateCard(card.id, {
        phone: phone.trim(),
        expireDate,
        note: note || undefined,
        contraindications: contraindications || undefined,
        giftedCount: gifted > 0 ? gifted : undefined,
        compensatedCount: compensated > 0 ? compensated : undefined
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

  const handleOpenRenew = () => {
    setRenewAddAmount('')
    setRenewExtendDays('')
    setRenewAddCount('')
    setRenewNote('')
    setShowRenewModal(true)
  }

  const handleCancelRenew = () => {
    setShowRenewModal(false)
  }

  const handleConfirmRenew = () => {
    const addAmount = renewAddAmount === '' ? 0 : parseFloat(renewAddAmount)
    const extendDays = renewExtendDays === '' ? 0 : parseInt(renewExtendDays)
    const addCount = renewAddCount === '' ? 0 : parseInt(renewAddCount)
    if ((!addAmount || isNaN(addAmount) || addAmount <= 0) &&
        (!extendDays || isNaN(extendDays) || extendDays <= 0) &&
        (!addCount || isNaN(addCount) || addCount <= 0)) {
      Taro.showToast({ title: '请至少填写一项续卡内容', icon: 'none' })
      return
    }
    if (addAmount && (isNaN(addAmount) || addAmount < 0)) {
      Taro.showToast({ title: '收款金额不能为负数', icon: 'none' })
      return
    }
    if (extendDays && (isNaN(extendDays) || extendDays < 0)) {
      Taro.showToast({ title: '延长天数不能为负数', icon: 'none' })
      return
    }
    if (addCount && (isNaN(addCount) || addCount < 0)) {
      Taro.showToast({ title: '新增次数不能为负数', icon: 'none' })
      return
    }
    try {
      renewCard(card.id, {
        addAmount: addAmount > 0 ? addAmount : undefined,
        extendDays: extendDays > 0 ? extendDays : undefined,
        addCount: addCount > 0 ? addCount : undefined,
        note: renewNote || undefined
      })
      Taro.showToast({ title: '续卡成功', icon: 'success' })
      setShowRenewModal(false)
    } catch (e) {
      console.error('[CardDetail] renew error:', e)
      Taro.showToast({ title: '续卡失败', icon: 'none' })
    }
  }

  const handleStartEditNote = (recordId: string, currentNote?: string) => {
    setEditingNoteRecordId(recordId)
    setEditingNoteText(currentNote || '')
  }

  const handleSaveNote = () => {
    if (editingNoteRecordId) {
      updateContactRecordNote(editingNoteRecordId, editingNoteText.trim())
      setEditingNoteRecordId(null)
      setEditingNoteText('')
      Taro.showToast({ title: '备注已保存', icon: 'success' })
    }
  }

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'copy': return styles.typeCopy
      case 'call': return styles.typeCall
      case 'manual': return styles.typeManual
      default: return styles.typeManual
    }
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
        <View className={styles.headerActionRow}>
          <Text className={styles.headerMiniBtn} onClick={handleOpenRenew}>续卡</Text>
          {!isEditing && <Text className={styles.headerMiniBtn} onClick={handleEdit}>编辑</Text>}
        </View>
      </View>

      <ScrollView className={styles.content} scrollY>
        <View className={styles.sectionCard}>
          <View className={styles.sectionTitle}>
            疗程概览
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
                placeholder="赠送的额外次数，不能为负"
                value={giftedCount}
                onInput={e => setGiftedCount(e.detail.value)}
              />
            </View>
            <View className={styles.formItem}>
              <Text className={styles.formLabel}>补偿次数</Text>
              <Input
                className={styles.formInput}
                type="number"
                placeholder="补偿的额外次数，不能为负"
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

        <View className={styles.tabsBar}>
          <Text
            className={classnames(styles.tabItem, activeTab === 'records' && styles.tabActive)}
            onClick={() => setActiveTab('records')}
          >
            扣次记录 ({card.records.length})
          </Text>
          <Text
            className={classnames(styles.tabItem, activeTab === 'contacts' && styles.tabActive)}
            onClick={() => setActiveTab('contacts')}
          >
            回访记录 ({myContactRecords.length})
          </Text>
          <Text
            className={classnames(styles.tabItem, activeTab === 'renewals' && styles.tabActive)}
            onClick={() => setActiveTab('renewals')}
          >
            续卡记录 ({(card.renewalRecords || []).length})
          </Text>
        </View>

        {activeTab === 'records' && (
          <View className={styles.sectionCard}>
            <View className={styles.sectionTitle}>
              历史扣次记录
              <Text className={styles.editBtn}>{card.records.length} 次</Text>
            </View>
            {card.records.length === 0 ? (
              <View className={styles.emptyRecords}>暂无扣次记录，顾客到店后可在扣次页完成扣次</View>
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
        )}

        {activeTab === 'contacts' && (
          <View className={styles.sectionCard}>
            <View className={styles.sectionTitle}>
              回访跟进记录
              <Text className={styles.editBtn}>{myContactRecords.length} 条</Text>
            </View>
            {myContactRecords.length === 0 ? (
              <View className={styles.emptyRecords}>暂无回访记录，在提醒页联系顾客后会自动记录</View>
            ) : (
              myContactRecords.map(record => (
                <View key={record.id} className={styles.contactItem}>
                  <View className={styles.contactHeader}>
                    <View className={styles.contactType}>
                      <Text className={classnames(styles.contactTypeBadge, getTypeBadgeClass(record.type))}>
                        {record.typeLabel}
                      </Text>
                    </View>
                    <Text className={styles.contactTime}>{record.dateTime}</Text>
                  </View>
                  {editingNoteRecordId === record.id ? (
                    <View className={styles.contactNoteEdit}>
                      <Input
                        className={styles.contactNoteInput}
                        placeholder="备注沟通结果，如：已预约明天下午3点"
                        value={editingNoteText}
                        onInput={e => setEditingNoteText(e.detail.value)}
                        maxlength={100}
                      />
                      <Text className={styles.contactNoteSave} onClick={handleSaveNote}>
                        保存
                      </Text>
                    </View>
                  ) : (
                    <View className={styles.contactNoteRow}>
                      {record.resultNote ? (
                        <Text className={styles.contactNote}>沟通结果：{record.resultNote}</Text>
                      ) : null}
                      <Text
                        className={styles.contactAddNote}
                        onClick={() => handleStartEditNote(record.id, record.resultNote)}
                      >
                        {record.resultNote ? '✏️ 修改备注' : '+ 添加沟通结果备注'}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'renewals' && (
          <View className={styles.sectionCard}>
            <View className={styles.sectionTitle}>
              续卡历史
              <Text className={styles.editBtn}>{(card.renewalRecords || []).length} 次</Text>
            </View>
            {(card.renewalRecords || []).length === 0 ? (
              <View className={styles.emptyRecords}>暂无续卡记录，点击顶部「续卡」按钮可追加金额/次数</View>
            ) : (
              (card.renewalRecords || []).map(record => (
                <View key={record.id} className={styles.renewalItem}>
                  <View className={styles.renewalHeader}>
                    <Text className={styles.renewalTitle}>续卡</Text>
                    <Text className={styles.renewalTime}>{record.dateTime}</Text>
                  </View>
                  <View className={styles.renewalMeta}>
                    {record.addAmount > 0 && <Text className={styles.renewalMetaTag}>💰 ¥{record.addAmount}</Text>}
                    {record.extendDays > 0 && <Text className={styles.renewalMetaTag}>📅 延长{record.extendDays}天</Text>}
                    {record.addCount > 0 && <Text className={styles.renewalMetaTag}>➕ 新增{record.addCount}次</Text>}
                  </View>
                  {record.note && (
                    <Text className={styles.renewalNote}>备注：{record.note}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

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

      {showRenewModal && (
        <View style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999, padding: 32
        }}>
          <View style={{
            backgroundColor: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 640, maxHeight: '85%', overflow: 'auto'
          }}>
            <Text style={{ fontSize: 36, fontWeight: 'bold', marginBottom: 24, color: '#1D2129', display: 'block' }}>续卡</Text>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>追加收款金额（元）</Text>
              <Input
                className={styles.formInput}
                type="digit"
                placeholder="例：3880，不计可不填"
                value={renewAddAmount}
                onInput={e => setRenewAddAmount(e.detail.value)}
              />
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>延长有效期（天）</Text>
              <Input
                className={styles.formInput}
                type="number"
                placeholder="例：180，不延长可不填"
                value={renewExtendDays}
                onInput={e => setRenewExtendDays(e.detail.value)}
              />
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>新增次数</Text>
              <Input
                className={styles.formInput}
                type="number"
                placeholder="例：10，不增加可不填"
                value={renewAddCount}
                onInput={e => setRenewAddCount(e.detail.value)}
              />
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>续卡备注</Text>
              <Textarea
                className={styles.formTextarea}
                placeholder="例：双11特惠续卡，赠送2次护理"
                value={renewNote}
                onInput={e => setRenewNote(e.detail.value)}
                maxlength={100}
              />
            </View>

            <View style={{ display: 'flex', gap: 16, marginTop: 32 }}>
              <Button
                onClick={handleCancelRenew}
                style={{ flex: 1, height: 80, lineHeight: '80rpx', backgroundColor: '#F2F3F5', color: '#4E5969', borderRadius: 16, fontSize: 28 }}
              >
                取消
              </Button>
              <Button
                onClick={handleConfirmRenew}
                style={{ flex: 1, height: 80, lineHeight: '80rpx', backgroundColor: '#7B61FF', color: '#fff', borderRadius: 16, fontSize: 28 }}
              >
                确认续卡
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default CardDetailPage
