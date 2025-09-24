name: Bug Report
about: 报告一个问题，帮助我们改进项目
labels: bug
assignees: ''
title: '[Bug] 问题简述'

body:
  - type: markdown
    attributes:
      value: |
        感谢提交问题！请尽可能提供详细信息以便我们定位与修复。
  - type: input
    id: summary
    attributes:
      label: 问题简述
      description: 请用一两句话概括问题
      placeholder: 例如：在选择目录时界面卡顿
    validations:
      required: true
  - type: textarea
    id: steps
    attributes:
      label: 复现步骤
      description: 请详细描述复现步骤
      placeholder: 1) 打开应用 2) 点击选择目录 3) 选择包含大量文件的文件夹 4) 界面无响应
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: 预期行为
      placeholder: 应该正常显示目录信息并可继续操作
    validations:
      required: true
  - type: textarea
    id: actual
    attributes:
      label: 实际行为
      placeholder: 界面卡死或报错
    validations:
      required: true
  - type: input
    id: version
    attributes:
      label: 版本信息
      placeholder: 例如：v1.0.1（或提交的 commit 哈希）
    validations:
      required: false
  - type: textarea
    id: logs
    attributes:
      label: 日志/截图
      description: 如有报错信息或截图，请粘贴或附加
    validations:
      required: false