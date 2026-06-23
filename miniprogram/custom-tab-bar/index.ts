Component({
  data: {
    selected: 0,
    show: true,
    list: [
      { pagePath: '/pages/home/home', text: '首页', icon: 'home' },
      { pagePath: '/pages/create/create', text: '创作', icon: 'create' },
      { pagePath: '/pages/resources/resources', text: '资源', icon: 'resource' },
      { pagePath: '/pages/mine/mine', text: '我的', icon: 'mine' },
    ],
  },
  methods: {
    switchTab(e: WechatMiniprogram.TouchEvent) {
      const { path, index } = e.currentTarget.dataset as { path: string; index: number }
      wx.switchTab({ url: path })
      this.setData({ selected: index })
    },
  },
})
