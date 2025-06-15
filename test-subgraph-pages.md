# ページ構造解析レポート

**生成日時**: 2025/6/13 8:37:30

## 📊 統計情報

- **総ページ数**: 46
- **総コンポーネント数**: 72
- **解析時間**: 73ms

## 🗺️ プロジェクト構造図

```mermaid
flowchart LR

%% ページ構造図

  subgraph page1 ["📄 index (src/constants)"]
    page1_empty["（コンポーネントなし）"]
  end

  subgraph page2 ["📄 about (src/pages/about)"]
    page2_c0["🧩 ContactButton"]
  end

  subgraph page3 ["📄 attention (src/pages/attention)"]
    page3_empty["（コンポーネントなし）"]
  end

  subgraph page4 ["📄 company (src/pages/company)"]
    page4_empty["（コンポーネントなし）"]
  end

  subgraph page5 ["📄 contact (src/pages/contact)"]
    page5_empty["（コンポーネントなし）"]
  end

  subgraph page6 ["📄 index (src/pages)"]
    page6_c0["🧩 TopSearchForm"]
    page6_c1["🧩 MailMagazineButton"]
    page6_c2["🧩 ContactButton"]
    page6_c3["🧩 TopNewArticleList"]
    page6_c4["🧩 TopAccessArticleCard"]
    page6_c5["🧩 ArticleItem"]
    page6_c6["🧩 TopSidebar"]
  end

  subgraph page7 ["📄 membership-terms (src/pages/membership-terms)"]
    page7_empty["（コンポーネントなし）"]
  end

  subgraph page8 ["📄 [slug] (src/pages/news/:slug)"]
    page8_c0["🧩 ContactButton"]
  end

  subgraph page9 ["📄 index (src/pages/news)"]
    page9_c0["🧩 ContactButton"]
    page9_c1["🧩 NewsCard"]
  end

  subgraph page10 ["📄 newsletter-form (src/pages/newsletter-form)"]
    page10_empty["（コンポーネントなし）"]
  end

  subgraph page11 ["📄 pla-comparison (src/pages/pla-comparison)"]
    page11_c0["🧩 PlazukanBreadcrumb"]
    page11_c1["🧩 PlaSelect"]
  end

  subgraph page12 ["📄 [slug] (src/pages/plazukan/material/:slug)"]
    page12_c0["🧩 PlazukanBreadcrumb"]
    page12_c1["🧩 PlazukanRelatedArticleCard"]
    page12_c2["🧩 PlaSelect"]
    page12_c3["🧩 Bookmark"]
  end

  subgraph page13 ["📄 index (src/pages/plazukan/material)"]
    page13_c0["🧩 PlaSelect"]
  end

  subgraph page14 ["📄 privacy (src/pages/privacy)"]
    page14_empty["（コンポーネントなし）"]
  end

  subgraph page15 ["📄 privacypolicy (src/pages/privacypolicy)"]
    page15_empty["（コンポーネントなし）"]
  end

  subgraph page16 ["📄 [slug] (src/pages/profile/:slug)"]
    page16_c0["🧩 TopSearchForm"]
    page16_c1["🧩 ArticleItem"]
  end

  subgraph page17 ["📄 [slug] (src/pages/seminar/:slug)"]
    page17_empty["（コンポーネントなし）"]
  end

  subgraph page18 ["📄 index (src/pages/seminar)"]
    page18_c0["🧩 TopSearchForm"]
    page18_c1["🧩 MailMagazineButton"]
    page18_c2["🧩 ContactButton"]
    page18_c3["🧩 SeminarCard"]
  end

  subgraph page19 ["📄 company (src/pages/sjpn1971/company)"]
    page19_c0["🧩 NuxtLayout"]
  end

  subgraph page20 ["📄 index (src/pages/sjpn1971/contact)"]
    page20_c0["🧩 NuxtLayout"]
  end

  subgraph page21 ["📄 thanks (src/pages/sjpn1971/contact/thanks)"]
    page21_c0["🧩 NuxtLayout"]
    page21_c1["🧩 SabicContactButton"]
  end

  subgraph page22 ["📄 index (src/pages/sjpn1971/documents/:category/:slug)"]
    page22_c0["🧩 NuxtLayout"]
  end

  subgraph page23 ["📄 index (src/pages/sjpn1971/documents/:category)"]
    page23_c0["🧩 NuxtLayout"]
    page23_c1["🧩 SabicContactButton"]
  end

  subgraph page24 ["📄 thanks (src/pages/sjpn1971/documents/download/thanks)"]
    page24_c0["🧩 NuxtLayout"]
    page24_c1["🧩 SabicContactButton"]
  end

  subgraph page25 ["📄 index (src/pages/sjpn1971/documents)"]
    page25_c0["🧩 NuxtLayout"]
    page25_c1["🧩 SabicContactButton"]
  end

  subgraph page26 ["📄 index (src/pages/sjpn1971)"]
    page26_c0["🧩 NuxtLayout"]
  end

  subgraph page27 ["📄 [slug] (src/pages/sjpn1971/news/:category/:slug)"]
    page27_c0["🧩 NuxtLayout"]
    page27_c1["🧩 SabicContactButton"]
  end

  subgraph page28 ["📄 index (src/pages/sjpn1971/news/:category)"]
    page28_c0["🧩 NuxtLayout"]
    page28_c1["🧩 SabicContactButton"]
  end

  subgraph page29 ["📄 index (src/pages/sjpn1971/news)"]
    page29_c0["🧩 NuxtLayout"]
    page29_c1["🧩 SabicContactButton"]
  end

  subgraph page30 ["📄 [slug] (src/pages/sjpn1971/products/:slug)"]
    page30_c0["🧩 NuxtLayout"]
    page30_c1["🧩 SabicContactButton"]
  end

  subgraph page31 ["📄 index (src/pages/sjpn1971/products)"]
    page31_c0["🧩 NuxtLayout"]
  end

  subgraph page32 ["📄 trademark (src/pages/sjpn1971/trademark)"]
    page32_c0["🧩 NuxtLayout"]
    page32_c1["🧩 SabicContactButton"]
  end

  subgraph page33 ["📄 socialmediapolicy (src/pages/socialmediapolicy)"]
    page33_empty["（コンポーネントなし）"]
  end

  subgraph page34 ["📄 [slug] (src/pages/sustaina-techo/:slug)"]
    page34_c0["🧩 SustainaTechoSideBar"]
    page34_c1["🧩 SustainaTechoSearchForm"]
  end

  subgraph page35 ["📄 index (src/pages/sustaina-techo)"]
    page35_c0["🧩 SustainaTechoSearchForm"]
  end

  subgraph page36 ["📄 search (src/pages/sustaina-techo/search)"]
    page36_empty["（コンポーネントなし）"]
  end

  subgraph page37 ["📄 [slug] (src/pages/sustainable_solution/:category/:slug)"]
    page37_c0["🧩 ArticleItem"]
    page37_c1["🧩 NuxtLayout"]
    page37_c2["🧩 SustainableSolutionBanner"]
    page37_c3["🧩 MailMagazineButton"]
    page37_c4["🧩 ContactButton"]
  end

  subgraph page38 ["📄 index (src/pages/sustainable_solution/:category)"]
    page38_c0["🧩 TopSearchForm"]
    page38_c1["🧩 SustainableSolutionCard"]
  end

  subgraph page39 ["📄 access (src/pages/sustainable_solution/access)"]
    page39_c0["🧩 TopSearchForm"]
    page39_c1["🧩 SustainableSolutionCard"]
  end

  subgraph page40 ["📄 logistic (src/pages/sustainable_solution/download/logistic)"]
    page40_c0["🧩 TopSearchForm"]
    page40_c1["🧩 MailMagazineButton"]
    page40_c2["🧩 ContactButton"]
  end

  subgraph page41 ["📄 material (src/pages/sustainable_solution/download/material)"]
    page41_c0["🧩 TopSearchForm"]
    page41_c1["🧩 MailMagazineButton"]
    page41_c2["🧩 ContactButton"]
  end

  subgraph page42 ["📄 success (src/pages/sustainable_solution/download/success)"]
    page42_c0["🧩 TopSearchForm"]
    page42_c1["🧩 MailMagazineButton"]
    page42_c2["🧩 ContactButton"]
  end

  subgraph page43 ["📄 index (src/pages/sustainable_solution)"]
    page43_c0["🧩 TopSearchForm"]
    page43_c1["🧩 SustainableSolutionCard"]
  end

  subgraph page44 ["📄 search (src/pages/sustainable_solution/search)"]
    page44_c0["🧩 TopSearchForm"]
    page44_c1["🧩 SustainableSolutionCard"]
  end

  subgraph page45 ["📄 index (src/plugins)"]
    page45_empty["（コンポーネントなし）"]
  end

  subgraph page46 ["📄 index (src/types)"]
    page46_empty["（コンポーネントなし）"]
  end

```