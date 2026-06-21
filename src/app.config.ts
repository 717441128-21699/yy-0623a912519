export default defineAppConfig({
  pages: [
    'pages/overview/index',
    'pages/customers/index',
    'pages/create-card/index',
    'pages/deduct/index',
    'pages/reminders/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#6C5CE7',
    navigationBarTitleText: '医美疗程卡本',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#6C5CE7',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/overview/index',
        text: '概览'
      },
      {
        pagePath: 'pages/customers/index',
        text: '顾客'
      },
      {
        pagePath: 'pages/create-card/index',
        text: '开卡'
      },
      {
        pagePath: 'pages/deduct/index',
        text: '扣次'
      },
      {
        pagePath: 'pages/reminders/index',
        text: '提醒'
      }
    ]
  }
})
