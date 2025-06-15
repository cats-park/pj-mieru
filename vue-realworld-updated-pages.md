# ページ構造解析レポート

**生成日時**: 2025/6/13 9:35:41
**参照元**: [https://github.com/gothinkster/vue-realworld-example-app/tree/master/src](https://github.com/gothinkster/vue-realworld-example-app/tree/master/src)

## 🚀 技術スタック

### 主要技術
- **言語**: Vue.js
- **フレームワーク**: Unknown
- **パッケージマネージャー**: npm

### 言語構成
- **Vue.js**: 61% (25ファイル)
- **JavaScript**: 39% (16ファイル)

### フレームワーク/ライブラリ

## 📊 統計情報

- **総ページ数**: 14
- **総コンポーネント数**: 18
- **解析時間**: 3ms

## 🗺️ プロジェクト構造図

```mermaid
flowchart LR

%% ページ構造図

  subgraph page1 ["📄 router/index.js"]
    page1_placeholder[" "]
    style page1_placeholder fill:transparent,stroke:transparent
  end
  style page1 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page2 ["📄 store/index.js"]
    page2_placeholder[" "]
    style page2_placeholder fill:transparent,stroke:transparent
  end
  style page2 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page3 ["📄 views/Article.vue"]
    page3_c0["🧩 RwvArticleMeta"]
    style page3_c0 fill:#7BB3F0,stroke:#4A90E2,color:#FFFFFF
    page3_c1["🧩 RwvComment"]
    style page3_c1 fill:#7BB3F0,stroke:#4A90E2,color:#FFFFFF
    page3_c2["🧩 RwvCommentEditor"]
    style page3_c2 fill:#7BB3F0,stroke:#4A90E2,color:#FFFFFF
    page3_c3["🧩 RwvTag"]
    style page3_c3 fill:#7BB3F0,stroke:#4A90E2,color:#FFFFFF
    page3_c4["🧩 router-link"]
    style page3_c4 fill:#7BB3F0,stroke:#4A90E2,color:#FFFFFF
  end
  style page3 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page4 ["📄 views/ArticleEdit.vue"]
    page4_c0["🧩 RwvListErrors"]
    style page4_c0 fill:#7BB3F0,stroke:#4A90E2,color:#FFFFFF
  end
  style page4 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page5 ["📄 views/Home.vue"]
    page5_c0["🧩 RwvTag"]
    style page5_c0 fill:#7BB3F0,stroke:#4A90E2,color:#FFFFFF
    page5_c1["🧩 router-link"]
    style page5_c1 fill:#7BB3F0,stroke:#4A90E2,color:#FFFFFF
    page5_c2["🧩 router-view"]
    style page5_c2 fill:#7BB3F0,stroke:#4A90E2,color:#FFFFFF
  end
  style page5 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page6 ["📄 views/HomeGlobal.vue"]
    page6_c0["🧩 RwvArticleList"]
    style page6_c0 fill:#7BB3F0,stroke:#4A90E2,color:#FFFFFF
  end
  style page6 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page7 ["📄 views/HomeMyFeed.vue"]
    page7_c0["🧩 RwvArticleList"]
    style page7_c0 fill:#7BB3F0,stroke:#4A90E2,color:#FFFFFF
  end
  style page7 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page8 ["📄 views/HomeTag.vue"]
    page8_c0["🧩 RwvArticleList"]
    style page8_c0 fill:#7BB3F0,stroke:#4A90E2,color:#FFFFFF
  end
  style page8 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page9 ["📄 views/Login.vue"]
    page9_c0["🧩 router-link"]
    style page9_c0 fill:#7BB3F0,stroke:#4A90E2,color:#FFFFFF
  end
  style page9 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page10 ["📄 views/Profile.vue"]
    page10_c0["🧩 router-link"]
    style page10_c0 fill:#7BB3F0,stroke:#4A90E2,color:#FFFFFF
    page10_c1["🧩 router-view"]
    style page10_c1 fill:#7BB3F0,stroke:#4A90E2,color:#FFFFFF
  end
  style page10 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page11 ["📄 views/ProfileArticles.vue"]
    page11_c0["🧩 RwvArticleList"]
    style page11_c0 fill:#7BB3F0,stroke:#4A90E2,color:#FFFFFF
  end
  style page11 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page12 ["📄 views/ProfileFavorited.vue"]
    page12_c0["🧩 RwvArticleList"]
    style page12_c0 fill:#7BB3F0,stroke:#4A90E2,color:#FFFFFF
  end
  style page12 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page13 ["📄 views/Register.vue"]
    page13_c0["🧩 router-link"]
    style page13_c0 fill:#7BB3F0,stroke:#4A90E2,color:#FFFFFF
  end
  style page13 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page14 ["📄 views/Settings.vue"]
    page14_placeholder[" "]
    style page14_placeholder fill:transparent,stroke:transparent
  end
  style page14 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

```