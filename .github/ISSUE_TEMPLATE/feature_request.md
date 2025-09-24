name: Feature Request
about: 提出一个功能建议，帮助我们改进产品
labels: enhancement
assignees: ''
title: '[Feature] 功能标题'

body:
  - type: markdown
    attributes:
      value: |
        感谢你的建议！请尽可能说明动机与场景，便于评估与规划。
  - type: textarea
    id: motivation
    attributes:
      label: 背景与动机
      placeholder: 为什么需要这个功能？解决了什么问题？
    validations:
      required: true
  - type: textarea
    id: proposal
    attributes:
      label: 功能描述
      placeholder: 你期望的行为、界面元素、交互流程等
    validations:
      required: true
  - type: textarea
    id: alternatives
    attributes:
      label: 可替代方案
      placeholder: 是否有其他可行的替代方案？
    validations:
      required: false
  - type: input
    id: version
    attributes:
      label: 版本/环境
      placeholder: 例如：v1.0.1 或 操作系统/浏览器版本
    validations:
      required: false