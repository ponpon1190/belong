---
name: venue-allocation-manager
description: Automates cell group venue rental allocation, checks Campsite calendar open hours, generates LINE group reminders and venue change notifications, and compiles weekly venue usage frequency reports. Make sure to use this skill whenever the user asks about group room booking, venue allocation, room matching, venue rules reminders, venue stats, or Campsite schedule coordination.
---

# Venue Allocation Manager (小組場地配對與提醒技能)

本 Skill 專為教會「Belong 小組」管理員設計，旨在自動化處理解決小組場地租借、Campsite 日程比對、Line 群組提醒與每週使用頻率統計。

---

## 核心功能與處理流程

當收到場地相關請求時，依據以下工作流程處理：

### 1. 處理解決 Paperform 場地租借申請 (Venue Matching)
* **輸入資料**：小組名稱、組長姓名、聚會日期時段、預估人數、特殊設備需求（如音響/投影）。
* **配對邏輯**：
  1. 讀取 [matching_rules.md](file:///c:/Users/USER/Desktop/%E5%85%AC%E5%91%8A%E6%AC%84%E7%85%A7%E7%89%87/.agents/skills/venue-allocation-manager/references/matching_rules.md) 檢查容量與設備。
  2. 比對 Campsite 一年副堂開放時間與教會月曆（主日/特會不可借用）。
  3. 自動輸出排定房間與確認結果。

### 2. 生成 LINE 群組通告與提醒文案 (LINE Notifications)
* **規則提醒**：根據 [line_templates.md](file:///c:/Users/USER/Desktop/%E5%85%AC%E5%91%8A%E6%AC%84%E7%85%A7%E7%89%87/.agents/skills/venue-allocation-manager/references/line_templates.md) 的【範本 1】產生每週溫馨提醒（包含場復、關冷氣關燈）。
* **配對成功/異動通知**：使用【範本 2】或【範本 3】快速產生結構化 Line 訊息。
* **特別主日保留席**：使用【範本 4】發布保留席預約與現場標籤確認文案。

### 3. 統計每週場地使用頻率 (Weekly Usage Analytics)
* 彙整每週預約記錄。
* 依據 [weekly_stats_template.md](file:///c:/Users/USER/Desktop/%E5%85%AC%E5%91%8A%E6%AC%84%E7%85%A7%E7%89%87/.agents/skills/venue-allocation-manager/references/weekly_stats_template.md) 產出「使用頻率表」與「熱門時段分流建議」。

---

## 相關參考文件

- 📐 [場地容量與配對規則 (matching_rules.md)](file:///c:/Users/USER/Desktop/%E5%85%AC%E5%91%8A%E6%AC%84%E7%85%A7%E7%89%87/.agents/skills/venue-allocation-manager/references/matching_rules.md)
- 💬 [LINE 通告文案範本 (line_templates.md)](file:///c:/Users/USER/Desktop/%E5%85%AC%E5%91%8A%E6%AC%84%E7%85%A7%E7%89%87/.agents/skills/venue-allocation-manager/references/line_templates.md)
- 📊 [每週使用率統計範本 (weekly_stats_template.md)](file:///c:/Users/USER/Desktop/%E5%85%AC%E5%91%8A%E6%AC%84%E7%85%A7%E7%89%87/.agents/skills/venue-allocation-manager/references/weekly_stats_template.md)
