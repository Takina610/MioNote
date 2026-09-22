import { NavBar, DatePicker } from 'antd-mobile'
import './index.scss'
import { useState, useMemo, useEffect } from 'react'
import classNames from 'classnames'
import dayjs from 'dayjs'
import { useSelector } from 'react-redux'
import _ from 'lodash'
import DailyBill from './components/DayBills'

const Month = () => {
  // TODO 按月做数据的分组
  const billList = useSelector(state => state.bill.billList)
  const billListByMonth = useMemo(() => {
    return _.groupBy(billList, (item) => dayjs(item.date).format('YYYY-MM'))
  }, [billList])

  // TODO 控制时间选择器是否显示
  const [dateVisible, setDateVisible] = useState(false)

  // TODO 控制时间显示
  const [currentDate, setCurrentDate] = useState(dayjs(new Date()).format('YYYY-MM'))

  const onCancel = () => {
    setDateVisible(false)
  }

  const [currentMonthList, setMonthList] = useState([])

  const monthRes = useMemo(() => {
    // ! 如果当前月份没有数据，则返回 0
    if (currentMonthList === undefined) {
      return {
        pay: 0,
        income: 0,
        total: 0
      }
    }
    
    // * 支出 / 收入 / 结余
    const pay = currentMonthList.filter(item => item.type === 'pay').reduce((acc, item) => acc + item.money, 0)
    const income = currentMonthList.filter(item => item.type === 'income').reduce((acc, item) => acc + item.money, 0)
    return {
      pay,
      income,
      total: pay + income
    }
  }, [currentMonthList])

  // TODO 初始化的时把当前月的统计数据显示出来
  useEffect(() => {
    const newDate = dayjs().format('YYYY-MM')
    // ! 边界值控制
    if (billListByMonth[newDate]) {
      setMonthList(billListByMonth[newDate])
    }
  }, [billListByMonth])

  // * 控制时间选择器确认回调
  const onConfirm = (date) => {
    const formatDate = dayjs(date).format('YYYY-MM')
    setMonthList(billListByMonth[formatDate])
    setCurrentDate(formatDate)
    setDateVisible(false)
  }

  // 当前月按照日来分组
  const dayGroup = useMemo(() => {
    const groupData = _.groupBy(currentMonthList, (item) => dayjs(item.date).format('YYYY-MM-DD'))
    const keys = Object.keys(groupData)
    return {
      groupData,
      keys
    }
  }, [currentMonthList])

  return (
    <div className="monthlyBill">
      <NavBar className="nav" backArrow={false}>
        月度收支
      </NavBar>
      <div className="content">
        <div className="header">
          {/* 时间切换区域 */}
          <div className="date">
            <span className="text" onClick={() => setDateVisible(true)}>
              {currentDate + '月账单'}
            </span>
            {/* 思路：根据当前弹框打开的状态，来控制 expand类名是否存在 */}
            <span className={classNames('arrow', dateVisible && 'expand')} onClick={() => setDateVisible(true)}></span>
          </div>
          {/* 统计区域 */}
          <div className='twoLineOverview'>
            <div className="item">
              <span className="money">{monthRes.pay.toFixed(2)}</span>
              <span className="type">支出</span>
            </div>
            <div className="item">
              <span className="money">{monthRes.income.toFixed(2)}</span>
              <span className="type">收入</span>
            </div>
            <div className="item">
              <span className="money">{monthRes.total.toFixed(2)}</span>
              <span className="type">结余</span>
            </div>
          </div>
          {/* 时间选择器 */}
          <DatePicker
            className="kaDate"
            title="记账日期"
            precision="month"
            visible={dateVisible}
            max={new Date()}
            onClose={() => setDateVisible(false)}
            onCancel={onCancel}
            onConfirm={onConfirm}
          />
        </div>
        {/* 日账单 */}
        {dayGroup.keys.map(key => (
          <DailyBill key={key} date={key} billList={dayGroup.groupData[key]} />
        ))}
      </div>
    </div >
  )
}

export default Month
