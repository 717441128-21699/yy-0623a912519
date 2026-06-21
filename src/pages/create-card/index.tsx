import React, { useState } from 'react'
import { View, Text, Input, Textarea, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import dayjs from 'dayjs'
import styles from './index.module.scss'
import { useStore } from '@/store'
import type { CardType } from '@/types'
import { PROJECT_OPTIONS, COMBO_SUB_ITEMS } from '@/types'

const CreateCardPage: React.FC = () => {
  const { addCard } = useStore()

  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [cardType, setCardType] = useState<CardType>('single')
  const [selectedProject, setSelectedProject] = useState('')
  const [customProject, setCustomProject] = useState('')
  const [totalCount, setTotalCount] = useState('')
  const [giftedCount, setGiftedCount] = useState('')
  const [compensatedCount, setCompensatedCount] = useState('')
  const [expireDate, setExpireDate] = useState(dayjs().add(180, 'day').format('YYYY-MM-DD'))
  const [note, setNote] = useState('')
  const [contraindications, setContraindications] = useState('')
  const [subItems, setSubItems] = useState<{ name: string; totalCount: number }[]>(
    COMBO_SUB_ITEMS.map(name => ({ name, totalCount: 5 }))
  )

  const canSubmit = (() => {
    if (!customerName.trim() || !phone.trim()) return false
    if (cardType === 'single') {
      return !!totalCount && (!!selectedProject || !!customProject)
    }
    return subItems.some(si => si.totalCount > 0)
  })()

  const handleProjectSelect = (project: string) => {
    setSelectedProject(project === selectedProject ? '' : project)
    if (project !== selectedProject) {
      setCustomProject('')
    }
  }

  const handleSubItemCount = (index: number, value: string) => {
    const num = parseInt(value) || 0
    setSubItems(prev => prev.map((item, i) =>
      i === index ? { ...item, totalCount: num } : item
    ))
  }

  const handleSubmit = async () => {
    if (!canSubmit) {
      Taro.showToast({ title: '请填写必填项', icon: 'none' })
      return
    }
    if (!/^1\d{10}$/.test(phone)) {
      Taro.showToast({ title: '请输入正确手机号', icon: 'none' })
      return
    }

    const finalProject = cardType === 'combo'
      ? '综合焕肤组合卡'
      : (selectedProject || customProject)

    const finalTotal = cardType === 'combo'
      ? subItems.reduce((sum, si) => sum + si.totalCount, 0)
      : parseInt(totalCount)

    const finalSubItems = cardType === 'combo'
      ? subItems.map(si => ({ ...si, usedCount: 0 }))
      : undefined

    try {
      addCard({
        customerName: customerName.trim(),
        phone: phone.trim(),
        projectName: finalProject,
        cardType,
        totalCount: finalTotal,
        usedCount: 0,
        giftedCount: giftedCount ? parseInt(giftedCount) : undefined,
        compensatedCount: compensatedCount ? parseInt(compensatedCount) : undefined,
        expireDate,
        note: note || undefined,
        contraindications: contraindications || undefined,
        subItems: finalSubItems
      })

      Taro.showToast({ title: '开卡成功', icon: 'success' })

      setCustomerName('')
      setPhone('')
      setCardType('single')
      setSelectedProject('')
      setCustomProject('')
      setTotalCount('')
      setGiftedCount('')
      setCompensatedCount('')
      setExpireDate(dayjs().add(180, 'day').format('YYYY-MM-DD'))
      setNote('')
      setContraindications('')
      setSubItems(COMBO_SUB_ITEMS.map(name => ({ name, totalCount: 5 })))

      setTimeout(() => {
        Taro.switchTab({ url: '/pages/customers/index' })
      }, 1000)
    } catch (e) {
      console.error('[CreateCard] submit error:', e)
      Taro.showToast({ title: '开卡失败，请重试', icon: 'none' })
    }
  }

  return (
    <View className={styles.page}>
      <View className={styles.formContainer}>
        <View className={styles.formCard}>
          <Text className={styles.formSectionTitle}>顾客信息</Text>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.formLabelRequired}>*</Text>姓名
            </Text>
            <Input
              className={styles.formInput}
              placeholder="请输入顾客姓名"
              value={customerName}
              onInput={e => setCustomerName(e.detail.value)}
              maxlength={20}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.formLabelRequired}>*</Text>手机号
            </Text>
            <Input
              className={styles.formInput}
              type="number"
              placeholder="请输入手机号"
              value={phone}
              onInput={e => setPhone(e.detail.value)}
              maxlength={11}
            />
          </View>
        </View>

        <View className={styles.formCard}>
          <Text className={styles.formSectionTitle}>疗程卡信息</Text>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>卡类型</Text>
            <View className={styles.typeSwitch}>
              <Text
                className={classnames(styles.typeSwitchItem, cardType === 'single' && styles.typeSwitchItemActive)}
                onClick={() => setCardType('single')}
              >
                单项卡
              </Text>
              <Text
                className={classnames(styles.typeSwitchItem, cardType === 'combo' && styles.typeSwitchItemActive)}
                onClick={() => setCardType('combo')}
              >
                组合卡
              </Text>
            </View>
          </View>

          {cardType === 'single' && (
            <>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>
                  <Text className={styles.formLabelRequired}>*</Text>选择项目
                </Text>
                <View className={styles.optionGroup}>
                  {PROJECT_OPTIONS.map(p => (
                    <Text
                      key={p}
                      className={classnames(styles.optionItem, selectedProject === p && styles.optionItemActive)}
                      onClick={() => handleProjectSelect(p)}
                    >
                      {p}
                    </Text>
                  ))}
                </View>
                {selectedProject === '其他' && (
                  <Input
                    className={styles.formInput}
                    placeholder="请输入其他项目名称"
                    value={customProject}
                    onInput={e => setCustomProject(e.detail.value)}
                    style={{ marginTop: '16rpx' }}
                  />
                )}
              </View>

              <View className={styles.formItem}>
                <Text className={styles.formLabel}>
                  <Text className={styles.formLabelRequired}>*</Text>总次数
                </Text>
                <Input
                  className={styles.formInput}
                  type="number"
                  placeholder="请输入总次数"
                  value={totalCount}
                  onInput={e => setTotalCount(e.detail.value)}
                />
              </View>
            </>
          )}

          {cardType === 'combo' && (
            <View className={styles.subItemsSection}>
              <Text className={styles.formLabel}>组合卡子项目次数</Text>
              {subItems.map((item, idx) => (
                <View key={item.name} className={styles.subItemRow}>
                  <Text className={styles.subItemName}>{item.name}</Text>
                  <Input
                    className={styles.subItemInput}
                    type="number"
                    placeholder="次数"
                    value={String(item.totalCount)}
                    onInput={e => handleSubItemCount(idx, e.detail.value)}
                  />
                </View>
              ))}
              <Text className={styles.formLabel} style={{ marginTop: '16rpx', fontSize: '24rpx', color: '#86909C' }}>
                合计：{subItems.reduce((sum, si) => sum + si.totalCount, 0)} 次
              </Text>
            </View>
          )}

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>赠送次数（选填）</Text>
            <Input
              className={styles.formInput}
              type="number"
              placeholder="赠送的额外次数"
              value={giftedCount}
              onInput={e => setGiftedCount(e.detail.value)}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>补偿次数（选填）</Text>
            <Input
              className={styles.formInput}
              type="number"
              placeholder="补偿的额外次数"
              value={compensatedCount}
              onInput={e => setCompensatedCount(e.detail.value)}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.formLabelRequired}>*</Text>有效期至
            </Text>
            <Input
              className={styles.formInput}
              type="text"
              placeholder="YYYY-MM-DD"
              value={expireDate}
              onInput={e => setExpireDate(e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.formCard}>
          <Text className={styles.formSectionTitle}>备注信息</Text>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>备注（选填）</Text>
            <Textarea
              className={styles.formTextarea}
              placeholder="如：皮肤类型、偏好等"
              value={note}
              onInput={e => setNote(e.detail.value)}
              maxlength={200}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>禁忌（选填）</Text>
            <Textarea
              className={styles.formTextarea}
              placeholder="如：过敏史、孕期等"
              value={contraindications}
              onInput={e => setContraindications(e.detail.value)}
              maxlength={200}
            />
          </View>
        </View>
      </View>

      <View className={styles.footerBar}>
        <Button
          className={classnames(styles.submitBtn, !canSubmit && styles.submitBtnDisabled)}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          确认开卡
        </Button>
      </View>
    </View>
  )
}

export default CreateCardPage
