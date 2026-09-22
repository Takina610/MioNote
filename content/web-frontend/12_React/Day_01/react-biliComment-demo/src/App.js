import './App.scss'
import avatar from './images/bozai.png'
import { useState } from 'react'
import { orderBy } from 'lodash'
import classNames from 'classnames'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import { useRef } from 'react'
/**
 * 评论列表的渲染和操作
 *
 * 1. 根据状态渲染评论列表
 * 2. 删除评论
 */

// 评论列表数据
const defaultList = [
  {
    // 评论id
    rpid: 3,
    // 用户信息
    user: {
      uid: '13258165',
      avatar: '',
      uname: '周杰伦',
    },
    // 评论内容
    content: '哎哟，不错哦',
    // 评论时间
    ctime: '10-18 08:15',
    like: 88,
  },
  {
    rpid: 2,
    user: {
      uid: '36080105',
      avatar: '',
      uname: '许嵩',
    },
    content: '我寻你千百度 日出到迟暮',
    ctime: '11-13 11:29',
    like: 35,
  },
  {
    rpid: 1,
    user: {
      uid: '30009257',
      avatar,
      uname: '黑马前端',
    },
    content: '学前端就来黑马',
    ctime: '10-19 09:00',
    like: 66,
  },
  {
    rpid: 4,
    user: {
      uid: '30009257',
      avatar,
      uname: '黑马前端',
    },
    content: '元神启动',
    ctime: '10-20 09:00',
    like: 128,
  },
]
// 当前登录用户信息
const user = {
  // 用户id
  uid: '30009257',
  // 用户头像
  avatar,
  // 用户昵称
  uname: '黑马前端',
}

/**
 * 导航 Tab 的渲染和操作
 *
 * 1. 渲染导航 Tab 和高亮
 * 2. 评论列表排序
 *  最热 => 喜欢数量降序
 *  最新 => 创建时间降序
 */

// 导航 Tab 数组
const tabs = [
  { type: 'hot', text: '最热' },
  { type: 'time', text: '最新' },
]

function Item ({item, onDelete}) {
  return (
    <div key={item.rpid} className="reply-item">
      {/* 头像 */}
      <div className="root-reply-avatar">
        <div className="bili-avatar">
          <img
            className="bili-avatar-img"
            alt={item.user.uname}
            src={item.user.avatar}
          />
        </div>
      </div>

      <div className="content-wrap">
        {/* 用户名 */}
        <div className="user-info">
          <div className="user-name">{item.user.uname}</div>
        </div>
        {/* 评论内容 */}
        <div className="root-reply">
          <span className="reply-content">{item.content}</span>
          <div className="reply-info">
            {/* 评论时间 */}
            <span className="reply-time">{item.ctime}</span>
            {/* 评论数量 */}
            <span className="reply-time">点赞数:{item.like}</span>
            {user.uid === item.user.uid && (
              <span className="delete-btn" onClick={() => onDelete(item.rpid)}>
                删除
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const App = () => {
  const [commentList, setCommentList] = useState(orderBy(defaultList, 'like', 'desc'))

  const handleDelete = (rpid) => {
    setCommentList(commentList.filter(item => item.rpid !== rpid))
  }

  // Tab切换功能
  // 1. 点击谁就把谁的 type记录下来
  // 2. 通过记录的 type和每一项遍历时的 type做匹配，控制激活类名的显示
  const [activeTab, setActiveTab] = useState('hot')
  const handleTabChange = (type) => {
    setActiveTab(type)
    // 根据 type 排序
    if (type === 'hot') { // 最热
      // lodash
      setCommentList(orderBy(commentList, 'like', 'desc'))
    } else { // 最新
      setCommentList(orderBy(commentList, 'ctime', 'desc'))
    }
  }

  // 发表评论
  const replyRef = useRef(null)

  // 发表评论
  const [replyContent, setReplyContent] = useState('')
  const handleReply = (content) => {
    // 0. 判断评论内容是否为空
    if (!content.trim()) {
      alert('请输入评论内容')
      return
    }
    // 1. 获取评论内容
    // 2. 添加到评论列表中
    // 3. 清空评论内容
    setCommentList([...commentList, {
      rpid: uuidv4(), // 随机 id
      user: user,
      content,
      ctime: dayjs().format('MM-DD HH:mm'), // 格式化 月-日 时:分
      like: 0,
    }])
    // 1. 情况输入框内容
    setReplyContent('')
    // 2. 重新聚焦
    replyRef.current.focus()
  }

  return (
    <div className="app">
      {/* 导航 Tab */}
      <div className="reply-navigation">
        <ul className="nav-bar">
          <li className="nav-title">
            <span className="nav-title-text">评论</span>
            {/* 评论数量 */}
            <span className="total-reply">{10}</span>
          </li>
          <li className="nav-sort">
            {/* 高亮类名： active */}
            {tabs.map(item => (
              <span 
                key={item.type} 
                // className={`nav-item ${activeTab === item.type && 'active'}`} 
                className={classNames('nav-item', { active: activeTab === item.type })}
                onClick={() => handleTabChange(item.type)}>{item.text}</span>
            ))}
          </li>
        </ul>
      </div>

      <div className="reply-wrap">
        {/* 发表评论 */}
        <div className="box-normal">
          {/* 当前用户头像 */}
          <div className="reply-box-avatar">
            <div className="bili-avatar">
              <img className="bili-avatar-img" src={avatar} alt="用户头像" />
            </div>
          </div>
          <div className="reply-box-wrap">
            {/* 评论框 */}
            <textarea
              ref={replyRef}
              className="reply-box-textarea"
              placeholder="发一条友善的评论"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />
            {/* 发布按钮 */}
            <div className="reply-box-send">
              <div className="send-text" onClick={() => handleReply(replyContent)}>发布</div>
            </div>
          </div>
        </div>
        {/* 评论列表 */}
        <div className="reply-list">
          {/* 评论项 */}
          {commentList.map(item => <Item key={item.id} item= {item} onDelete={handleDelete}/>)}
        </div>
      </div>
    </div>
  )
}

export default App