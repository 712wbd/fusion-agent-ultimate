# 貢獻指南

感謝您考慮為 **Fusion Agent Ultimate** 做出貢獻！🎉

## 如何貢獻

### 報告 Bug

如果您發現 Bug，請：
1. 確認該 Bug 尚未被報告
2. 在 [Issues](https://github.com/712wbd/fusion-agent-ultimate/issues) 中創建新問題
3. 提供詳細的重現步驟
4. 包含您的環境信息（Node版本、操作系統等）

### 提交功能建議

我們歡迎任何改進建議！請：
1. 在 Issues 中描述您的想法
2. 說明為什麼這個功能有用
3. 提供使用場景示例

### 提交 Pull Request

1. **Fork 本倉庫**
2. **創建特性分支**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **遵循代碼規範**
   - 使用 TypeScript
   - 遵循 ESLint 規則
   - 保持一致的代碼風格
4. **編寫測試**
   - 確保所有測試通過
   - 添加新功能的測試用例
5. **提交更改**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
6. **推送到分支**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **開啟 Pull Request**

## 開發流程

### 環境設置

```bash
# 安裝依賴
npm install

# 啟動開發模式
npm run dev

# 運行測試
npm test

# 代碼檢查
npm run lint
npm run typecheck
```

### 代碼規範

- **命名**：使用 camelCase（變量/函數），PascalCase（類/接口）
- **類型**：盡可能使用 TypeScript 類型註解
- **註釋**：只在必要時添加註釋，代碼應自解釋
- **測試**：保持測試覆蓋率 > 80%

### Commit 規範

使用語義化提交信息：

- `feat:` 新功能
- `fix:` Bug 修復
- `docs:` 文檔更新
- `style:` 代碼格式（不影響功能）
- `refactor:` 重構
- `test:` 測試相關
- `chore:` 構建工具或輔助工具

示例：
```
feat: add security scanning feature
fix: resolve memory leak in optimizer
docs: update README with new examples
```

## 社區行為準則

- 保持尊重和友善
- 歡迎建設性批評
- 專注於最佳解決方案
- 幫助新貢獻者

## 許可證

貢獻的代碼將採用 MIT 許可證。

---

再次感謝您的貢獻！🙏
