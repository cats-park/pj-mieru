# ページ構造解析レポート

**生成日時**: 2025/6/15 12:44:43
**参照元**: [https://github.com/HospitalRun/hospitalrun-frontend/tree/master](https://github.com/HospitalRun/hospitalrun-frontend/tree/master)

## 🚀 技術スタック

### 主要技術
- **言語**: TypeScript (TSX)
- **フレームワーク**: React
- **パッケージマネージャー**: npm

### 言語構成
- **TypeScript (TSX)**: 51% (275ファイル)
- **TypeScript**: 48% (256ファイル)
- **JavaScript**: 1% (6ファイル)

### フレームワーク/ライブラリ
- **React** v~17.0.1 (信頼度: high)
- **React Router** v~5.3.0 (信頼度: high)
- **Redux** v~4.1.0 (信頼度: high)
- **Bootstrap** v~5.1.0 (信頼度: medium)
- **i18next** v~21.6.0 (信頼度: medium)
- **React Query** v~2.25.2 (信頼度: medium)
- **PouchDB** v~7.2.1 (信頼度: medium)
- **TypeScript** v~3.8.3 (信頼度: high)
- **Jest** v27.0.3 (信頼度: medium)
- **ESLint** v~6.8.0 (信頼度: medium)

## 📊 統計情報

- **総ページ数**: 138
- **総コンポーネント数**: 65
- **解析時間**: 43ms

## 🗺️ プロジェクト構造図

```mermaid
flowchart LR

%% ページ構造図

  subgraph page1 ["📄 /var/folders/qr/c1wtnq955b1998r5n94ys4dm0000gn/T/mieru-HospitalRun-hospitalrun-frontend-1749959075564/scripts/check-translations/index.ts"]
    page1_placeholder[" "]
    style page1_placeholder fill:transparent,stroke:transparent
  end
  style page1 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page2 ["📄 index.tsx"]
    subgraph page2_c0 ["🧩 App"]
      page2_c0_child1["🧩 Spinner"]
      style page2_c0_child1 fill:#2E5A8A,stroke:#1E3D5C,color:#FFFFFF
      page2_c0_child2["🧩 HospitalRun"]
      style page2_c0_child2 fill:#2E5A8A,stroke:#1E3D5C,color:#FFFFFF
      page2_c0_child3["🧩 TitleProvider"]
      style page2_c0_child3 fill:#2E5A8A,stroke:#1E3D5C,color:#FFFFFF
    end
    style page2_c0 fill:#4A90E2,stroke:#2E5A8A,color:#FFFFFF
  end
  style page2 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page3 ["📄 shared/components/input/index.tsx"]
    subgraph page3_c0 ["🧩 DatePickerWithLabelFormGroup"]
      page3_c0_child1["🧩 Label"]
      style page3_c0_child1 fill:#2E5A8A,stroke:#1E3D5C,color:#FFFFFF
      page3_c0_child2["🧩 DateTimePicker"]
      style page3_c0_child2 fill:#2E5A8A,stroke:#1E3D5C,color:#FFFFFF
    end
    style page3_c0 fill:#4A90E2,stroke:#2E5A8A,color:#FFFFFF
    page3_c3["🧩 DateTimePickerWithLabelFromGroup"]
    style page3_c3 fill:#7BB3F0,stroke:#4A90E2,color:#FFFFFF
    subgraph page3_c4 ["🧩 LanguageSelector"]
      page3_c4_child5["🧩 Select"]
      style page3_c4_child5 fill:#2E5A8A,stroke:#1E3D5C,color:#FFFFFF
    end
    style page3_c4 fill:#4A90E2,stroke:#2E5A8A,color:#FFFFFF
    page3_c6["🧩 SelectOption"]
    style page3_c6 fill:#7BB3F0,stroke:#4A90E2,color:#FFFFFF
    subgraph page3_c7 ["🧩 TextFieldWithLabelFormGroup"]
      page3_c7_child8["🧩 TextField"]
      style page3_c7_child8 fill:#2E5A8A,stroke:#1E3D5C,color:#FFFFFF
    end
    style page3_c7 fill:#4A90E2,stroke:#2E5A8A,color:#FFFFFF
    subgraph page3_c9 ["🧩 TextInputWithLabelFormGroup"]
      page3_c9_child10["🧩 TextInput"]
      style page3_c9_child10 fill:#2E5A8A,stroke:#1E3D5C,color:#FFFFFF
    end
    style page3_c9 fill:#4A90E2,stroke:#2E5A8A,color:#FFFFFF
  end
  style page3 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page4 ["📄 shared/components/network-status/index.ts"]
    page4_placeholder[" "]
    style page4_placeholder fill:transparent,stroke:transparent
  end
  style page4 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page5 ["📄 shared/locales/ar/translations/actions/index.ts"]
    page5_placeholder[" "]
    style page5_placeholder fill:transparent,stroke:transparent
  end
  style page5 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page6 ["📄 shared/locales/ar/translations/dashboard/index.ts"]
    page6_placeholder[" "]
    style page6_placeholder fill:transparent,stroke:transparent
  end
  style page6 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page7 ["📄 shared/locales/ar/translations/index.ts"]
    page7_placeholder[" "]
    style page7_placeholder fill:transparent,stroke:transparent
  end
  style page7 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page8 ["📄 shared/locales/ar/translations/labs/index.ts"]
    page8_placeholder[" "]
    style page8_placeholder fill:transparent,stroke:transparent
  end
  style page8 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page9 ["📄 shared/locales/ar/translations/medications/index.ts"]
    page9_placeholder[" "]
    style page9_placeholder fill:transparent,stroke:transparent
  end
  style page9 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page10 ["📄 shared/locales/ar/translations/patient/index.ts"]
    page10_placeholder[" "]
    style page10_placeholder fill:transparent,stroke:transparent
  end
  style page10 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page11 ["📄 shared/locales/ar/translations/patients/index.ts"]
    page11_placeholder[" "]
    style page11_placeholder fill:transparent,stroke:transparent
  end
  style page11 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page12 ["📄 shared/locales/ar/translations/settings/index.ts"]
    page12_placeholder[" "]
    style page12_placeholder fill:transparent,stroke:transparent
  end
  style page12 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page13 ["📄 shared/locales/de/translations/actions/index.ts"]
    page13_placeholder[" "]
    style page13_placeholder fill:transparent,stroke:transparent
  end
  style page13 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page14 ["📄 shared/locales/de/translations/dashboard/index.ts"]
    page14_placeholder[" "]
    style page14_placeholder fill:transparent,stroke:transparent
  end
  style page14 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page15 ["📄 shared/locales/de/translations/incidents/index.ts"]
    page15_placeholder[" "]
    style page15_placeholder fill:transparent,stroke:transparent
  end
  style page15 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page16 ["📄 shared/locales/de/translations/index.ts"]
    page16_placeholder[" "]
    style page16_placeholder fill:transparent,stroke:transparent
  end
  style page16 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page17 ["📄 shared/locales/de/translations/labs/index.ts"]
    page17_placeholder[" "]
    style page17_placeholder fill:transparent,stroke:transparent
  end
  style page17 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page18 ["📄 shared/locales/de/translations/medications/index.ts"]
    page18_placeholder[" "]
    style page18_placeholder fill:transparent,stroke:transparent
  end
  style page18 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page19 ["📄 shared/locales/de/translations/patient/index.ts"]
    page19_placeholder[" "]
    style page19_placeholder fill:transparent,stroke:transparent
  end
  style page19 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page20 ["📄 shared/locales/de/translations/patients/index.ts"]
    page20_placeholder[" "]
    style page20_placeholder fill:transparent,stroke:transparent
  end
  style page20 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page21 ["📄 shared/locales/de/translations/scheduling/index.ts"]
    page21_placeholder[" "]
    style page21_placeholder fill:transparent,stroke:transparent
  end
  style page21 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page22 ["📄 shared/locales/de/translations/settings/index.ts"]
    page22_placeholder[" "]
    style page22_placeholder fill:transparent,stroke:transparent
  end
  style page22 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page23 ["📄 shared/locales/de/translations/sex/index.ts"]
    page23_placeholder[" "]
    style page23_placeholder fill:transparent,stroke:transparent
  end
  style page23 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page24 ["📄 shared/locales/de/translations/states/index.ts"]
    page24_placeholder[" "]
    style page24_placeholder fill:transparent,stroke:transparent
  end
  style page24 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page25 ["📄 shared/locales/enUs/translations/actions/index.ts"]
    page25_placeholder[" "]
    style page25_placeholder fill:transparent,stroke:transparent
  end
  style page25 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page26 ["📄 shared/locales/enUs/translations/blood-type/index.ts"]
    page26_placeholder[" "]
    style page26_placeholder fill:transparent,stroke:transparent
  end
  style page26 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page27 ["📄 shared/locales/enUs/translations/dashboard/index.ts"]
    page27_placeholder[" "]
    style page27_placeholder fill:transparent,stroke:transparent
  end
  style page27 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page28 ["📄 shared/locales/enUs/translations/imagings/index.ts"]
    page28_placeholder[" "]
    style page28_placeholder fill:transparent,stroke:transparent
  end
  style page28 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page29 ["📄 shared/locales/enUs/translations/incidents/index.ts"]
    page29_placeholder[" "]
    style page29_placeholder fill:transparent,stroke:transparent
  end
  style page29 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page30 ["📄 shared/locales/enUs/translations/index.ts"]
    page30_placeholder[" "]
    style page30_placeholder fill:transparent,stroke:transparent
  end
  style page30 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page31 ["📄 shared/locales/enUs/translations/labs/index.ts"]
    page31_placeholder[" "]
    style page31_placeholder fill:transparent,stroke:transparent
  end
  style page31 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page32 ["📄 shared/locales/enUs/translations/medications/index.ts"]
    page32_placeholder[" "]
    style page32_placeholder fill:transparent,stroke:transparent
  end
  style page32 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page33 ["📄 shared/locales/enUs/translations/network-status/index.ts"]
    page33_placeholder[" "]
    style page33_placeholder fill:transparent,stroke:transparent
  end
  style page33 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page34 ["📄 shared/locales/enUs/translations/patient/index.ts"]
    page34_placeholder[" "]
    style page34_placeholder fill:transparent,stroke:transparent
  end
  style page34 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page35 ["📄 shared/locales/enUs/translations/patients/index.ts"]
    page35_placeholder[" "]
    style page35_placeholder fill:transparent,stroke:transparent
  end
  style page35 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page36 ["📄 shared/locales/enUs/translations/scheduling/index.ts"]
    page36_placeholder[" "]
    style page36_placeholder fill:transparent,stroke:transparent
  end
  style page36 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page37 ["📄 shared/locales/enUs/translations/settings/index.ts"]
    page37_placeholder[" "]
    style page37_placeholder fill:transparent,stroke:transparent
  end
  style page37 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page38 ["📄 shared/locales/enUs/translations/sex/index.ts"]
    page38_placeholder[" "]
    style page38_placeholder fill:transparent,stroke:transparent
  end
  style page38 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page39 ["📄 shared/locales/enUs/translations/states/index.ts"]
    page39_placeholder[" "]
    style page39_placeholder fill:transparent,stroke:transparent
  end
  style page39 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page40 ["📄 shared/locales/enUs/translations/user/index.ts"]
    page40_placeholder[" "]
    style page40_placeholder fill:transparent,stroke:transparent
  end
  style page40 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page41 ["📄 shared/locales/es/translations/actions/index.ts"]
    page41_placeholder[" "]
    style page41_placeholder fill:transparent,stroke:transparent
  end
  style page41 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page42 ["📄 shared/locales/es/translations/dashboard/index.ts"]
    page42_placeholder[" "]
    style page42_placeholder fill:transparent,stroke:transparent
  end
  style page42 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page43 ["📄 shared/locales/es/translations/index.ts"]
    page43_placeholder[" "]
    style page43_placeholder fill:transparent,stroke:transparent
  end
  style page43 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page44 ["📄 shared/locales/es/translations/labs/index.ts"]
    page44_placeholder[" "]
    style page44_placeholder fill:transparent,stroke:transparent
  end
  style page44 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page45 ["📄 shared/locales/es/translations/medications/index.ts"]
    page45_placeholder[" "]
    style page45_placeholder fill:transparent,stroke:transparent
  end
  style page45 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page46 ["📄 shared/locales/es/translations/patient/index.ts"]
    page46_placeholder[" "]
    style page46_placeholder fill:transparent,stroke:transparent
  end
  style page46 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page47 ["📄 shared/locales/es/translations/patients/index.ts"]
    page47_placeholder[" "]
    style page47_placeholder fill:transparent,stroke:transparent
  end
  style page47 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page48 ["📄 shared/locales/es/translations/settings/index.ts"]
    page48_placeholder[" "]
    style page48_placeholder fill:transparent,stroke:transparent
  end
  style page48 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page49 ["📄 shared/locales/fr/translations/actions/index.ts"]
    page49_placeholder[" "]
    style page49_placeholder fill:transparent,stroke:transparent
  end
  style page49 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page50 ["📄 shared/locales/fr/translations/dashboard/index.ts"]
    page50_placeholder[" "]
    style page50_placeholder fill:transparent,stroke:transparent
  end
  style page50 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page51 ["📄 shared/locales/fr/translations/index.ts"]
    page51_placeholder[" "]
    style page51_placeholder fill:transparent,stroke:transparent
  end
  style page51 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page52 ["📄 shared/locales/fr/translations/labs/index.ts"]
    page52_placeholder[" "]
    style page52_placeholder fill:transparent,stroke:transparent
  end
  style page52 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page53 ["📄 shared/locales/fr/translations/medications/index.ts"]
    page53_placeholder[" "]
    style page53_placeholder fill:transparent,stroke:transparent
  end
  style page53 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page54 ["📄 shared/locales/fr/translations/patient/index.ts"]
    page54_placeholder[" "]
    style page54_placeholder fill:transparent,stroke:transparent
  end
  style page54 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page55 ["📄 shared/locales/fr/translations/patients/index.ts"]
    page55_placeholder[" "]
    style page55_placeholder fill:transparent,stroke:transparent
  end
  style page55 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page56 ["📄 shared/locales/fr/translations/scheduling/index.ts"]
    page56_placeholder[" "]
    style page56_placeholder fill:transparent,stroke:transparent
  end
  style page56 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page57 ["📄 shared/locales/fr/translations/settings/index.ts"]
    page57_placeholder[" "]
    style page57_placeholder fill:transparent,stroke:transparent
  end
  style page57 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page58 ["📄 shared/locales/fr/translations/sex/index.ts"]
    page58_placeholder[" "]
    style page58_placeholder fill:transparent,stroke:transparent
  end
  style page58 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page59 ["📄 shared/locales/fr/translations/states/index.ts"]
    page59_placeholder[" "]
    style page59_placeholder fill:transparent,stroke:transparent
  end
  style page59 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page60 ["📄 shared/locales/id/translations/actions/index.ts"]
    page60_placeholder[" "]
    style page60_placeholder fill:transparent,stroke:transparent
  end
  style page60 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page61 ["📄 shared/locales/id/translations/dashboard/index.ts"]
    page61_placeholder[" "]
    style page61_placeholder fill:transparent,stroke:transparent
  end
  style page61 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page62 ["📄 shared/locales/id/translations/index.ts"]
    page62_placeholder[" "]
    style page62_placeholder fill:transparent,stroke:transparent
  end
  style page62 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page63 ["📄 shared/locales/id/translations/labs/index.ts"]
    page63_placeholder[" "]
    style page63_placeholder fill:transparent,stroke:transparent
  end
  style page63 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page64 ["📄 shared/locales/id/translations/medications/index.ts"]
    page64_placeholder[" "]
    style page64_placeholder fill:transparent,stroke:transparent
  end
  style page64 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page65 ["📄 shared/locales/id/translations/patient/index.ts"]
    page65_placeholder[" "]
    style page65_placeholder fill:transparent,stroke:transparent
  end
  style page65 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page66 ["📄 shared/locales/id/translations/patients/index.ts"]
    page66_placeholder[" "]
    style page66_placeholder fill:transparent,stroke:transparent
  end
  style page66 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page67 ["📄 shared/locales/id/translations/settings/index.ts"]
    page67_placeholder[" "]
    style page67_placeholder fill:transparent,stroke:transparent
  end
  style page67 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page68 ["📄 shared/locales/index.ts"]
    page68_placeholder[" "]
    style page68_placeholder fill:transparent,stroke:transparent
  end
  style page68 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page69 ["📄 shared/locales/it/translations/actions/index.ts"]
    page69_placeholder[" "]
    style page69_placeholder fill:transparent,stroke:transparent
  end
  style page69 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page70 ["📄 shared/locales/it/translations/dashboard/index.ts"]
    page70_placeholder[" "]
    style page70_placeholder fill:transparent,stroke:transparent
  end
  style page70 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page71 ["📄 shared/locales/it/translations/index.ts"]
    page71_placeholder[" "]
    style page71_placeholder fill:transparent,stroke:transparent
  end
  style page71 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page72 ["📄 shared/locales/it/translations/labs/index.ts"]
    page72_placeholder[" "]
    style page72_placeholder fill:transparent,stroke:transparent
  end
  style page72 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page73 ["📄 shared/locales/it/translations/medications/index.ts"]
    page73_placeholder[" "]
    style page73_placeholder fill:transparent,stroke:transparent
  end
  style page73 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page74 ["📄 shared/locales/it/translations/patient/index.ts"]
    page74_placeholder[" "]
    style page74_placeholder fill:transparent,stroke:transparent
  end
  style page74 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page75 ["📄 shared/locales/it/translations/patients/index.ts"]
    page75_placeholder[" "]
    style page75_placeholder fill:transparent,stroke:transparent
  end
  style page75 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page76 ["📄 shared/locales/it/translations/scheduling/index.ts"]
    page76_placeholder[" "]
    style page76_placeholder fill:transparent,stroke:transparent
  end
  style page76 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page77 ["📄 shared/locales/it/translations/settings/index.ts"]
    page77_placeholder[" "]
    style page77_placeholder fill:transparent,stroke:transparent
  end
  style page77 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page78 ["📄 shared/locales/it/translations/sex/index.ts"]
    page78_placeholder[" "]
    style page78_placeholder fill:transparent,stroke:transparent
  end
  style page78 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page79 ["📄 shared/locales/it/translations/states/index.ts"]
    page79_placeholder[" "]
    style page79_placeholder fill:transparent,stroke:transparent
  end
  style page79 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page80 ["📄 shared/locales/ja/translations/actions/index.ts"]
    page80_placeholder[" "]
    style page80_placeholder fill:transparent,stroke:transparent
  end
  style page80 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page81 ["📄 shared/locales/ja/translations/dashboard/index.ts"]
    page81_placeholder[" "]
    style page81_placeholder fill:transparent,stroke:transparent
  end
  style page81 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page82 ["📄 shared/locales/ja/translations/index.ts"]
    page82_placeholder[" "]
    style page82_placeholder fill:transparent,stroke:transparent
  end
  style page82 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page83 ["📄 shared/locales/ja/translations/labs/index.ts"]
    page83_placeholder[" "]
    style page83_placeholder fill:transparent,stroke:transparent
  end
  style page83 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page84 ["📄 shared/locales/ja/translations/medications/index.ts"]
    page84_placeholder[" "]
    style page84_placeholder fill:transparent,stroke:transparent
  end
  style page84 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page85 ["📄 shared/locales/ja/translations/patient/index.ts"]
    page85_placeholder[" "]
    style page85_placeholder fill:transparent,stroke:transparent
  end
  style page85 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page86 ["📄 shared/locales/ja/translations/patients/index.ts"]
    page86_placeholder[" "]
    style page86_placeholder fill:transparent,stroke:transparent
  end
  style page86 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page87 ["📄 shared/locales/ja/translations/settings/index.ts"]
    page87_placeholder[" "]
    style page87_placeholder fill:transparent,stroke:transparent
  end
  style page87 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page88 ["📄 shared/locales/ptBr/translations/actions/index.ts"]
    page88_placeholder[" "]
    style page88_placeholder fill:transparent,stroke:transparent
  end
  style page88 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page89 ["📄 shared/locales/ptBr/translations/dashboard/index.ts"]
    page89_placeholder[" "]
    style page89_placeholder fill:transparent,stroke:transparent
  end
  style page89 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page90 ["📄 shared/locales/ptBr/translations/index.ts"]
    page90_placeholder[" "]
    style page90_placeholder fill:transparent,stroke:transparent
  end
  style page90 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page91 ["📄 shared/locales/ptBr/translations/labs/index.ts"]
    page91_placeholder[" "]
    style page91_placeholder fill:transparent,stroke:transparent
  end
  style page91 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page92 ["📄 shared/locales/ptBr/translations/medications/index.ts"]
    page92_placeholder[" "]
    style page92_placeholder fill:transparent,stroke:transparent
  end
  style page92 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page93 ["📄 shared/locales/ptBr/translations/patient/index.ts"]
    page93_placeholder[" "]
    style page93_placeholder fill:transparent,stroke:transparent
  end
  style page93 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page94 ["📄 shared/locales/ptBr/translations/patients/index.ts"]
    page94_placeholder[" "]
    style page94_placeholder fill:transparent,stroke:transparent
  end
  style page94 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page95 ["📄 shared/locales/ptBr/translations/scheduling/index.ts"]
    page95_placeholder[" "]
    style page95_placeholder fill:transparent,stroke:transparent
  end
  style page95 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page96 ["📄 shared/locales/ptBr/translations/settings/index.ts"]
    page96_placeholder[" "]
    style page96_placeholder fill:transparent,stroke:transparent
  end
  style page96 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page97 ["📄 shared/locales/ptBr/translations/sex/index.ts"]
    page97_placeholder[" "]
    style page97_placeholder fill:transparent,stroke:transparent
  end
  style page97 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page98 ["📄 shared/locales/ptBr/translations/states/index.ts"]
    page98_placeholder[" "]
    style page98_placeholder fill:transparent,stroke:transparent
  end
  style page98 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page99 ["📄 shared/locales/ru/translations/actions/index.ts"]
    page99_placeholder[" "]
    style page99_placeholder fill:transparent,stroke:transparent
  end
  style page99 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page100 ["📄 shared/locales/ru/translations/blood-type/index.ts"]
    page100_placeholder[" "]
    style page100_placeholder fill:transparent,stroke:transparent
  end
  style page100 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page101 ["📄 shared/locales/ru/translations/dashboard/index.ts"]
    page101_placeholder[" "]
    style page101_placeholder fill:transparent,stroke:transparent
  end
  style page101 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page102 ["📄 shared/locales/ru/translations/imagings/index.ts"]
    page102_placeholder[" "]
    style page102_placeholder fill:transparent,stroke:transparent
  end
  style page102 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page103 ["📄 shared/locales/ru/translations/incidents/index.ts"]
    page103_placeholder[" "]
    style page103_placeholder fill:transparent,stroke:transparent
  end
  style page103 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page104 ["📄 shared/locales/ru/translations/index.ts"]
    page104_placeholder[" "]
    style page104_placeholder fill:transparent,stroke:transparent
  end
  style page104 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page105 ["📄 shared/locales/ru/translations/labs/index.ts"]
    page105_placeholder[" "]
    style page105_placeholder fill:transparent,stroke:transparent
  end
  style page105 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page106 ["📄 shared/locales/ru/translations/medications/index.ts"]
    page106_placeholder[" "]
    style page106_placeholder fill:transparent,stroke:transparent
  end
  style page106 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page107 ["📄 shared/locales/ru/translations/network-status/index.ts"]
    page107_placeholder[" "]
    style page107_placeholder fill:transparent,stroke:transparent
  end
  style page107 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page108 ["📄 shared/locales/ru/translations/patient/index.ts"]
    page108_placeholder[" "]
    style page108_placeholder fill:transparent,stroke:transparent
  end
  style page108 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page109 ["📄 shared/locales/ru/translations/patients/index.ts"]
    page109_placeholder[" "]
    style page109_placeholder fill:transparent,stroke:transparent
  end
  style page109 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page110 ["📄 shared/locales/ru/translations/scheduling/index.ts"]
    page110_placeholder[" "]
    style page110_placeholder fill:transparent,stroke:transparent
  end
  style page110 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page111 ["📄 shared/locales/ru/translations/settings/index.ts"]
    page111_placeholder[" "]
    style page111_placeholder fill:transparent,stroke:transparent
  end
  style page111 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page112 ["📄 shared/locales/ru/translations/sex/index.ts"]
    page112_placeholder[" "]
    style page112_placeholder fill:transparent,stroke:transparent
  end
  style page112 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page113 ["📄 shared/locales/ru/translations/states/index.ts"]
    page113_placeholder[" "]
    style page113_placeholder fill:transparent,stroke:transparent
  end
  style page113 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page114 ["📄 shared/locales/tr/translations/actions/index.ts"]
    page114_placeholder[" "]
    style page114_placeholder fill:transparent,stroke:transparent
  end
  style page114 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page115 ["📄 shared/locales/tr/translations/blood-type/index.ts"]
    page115_placeholder[" "]
    style page115_placeholder fill:transparent,stroke:transparent
  end
  style page115 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page116 ["📄 shared/locales/tr/translations/dashboard/index.ts"]
    page116_placeholder[" "]
    style page116_placeholder fill:transparent,stroke:transparent
  end
  style page116 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page117 ["📄 shared/locales/tr/translations/imagings/index.ts"]
    page117_placeholder[" "]
    style page117_placeholder fill:transparent,stroke:transparent
  end
  style page117 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page118 ["📄 shared/locales/tr/translations/incidents/index.ts"]
    page118_placeholder[" "]
    style page118_placeholder fill:transparent,stroke:transparent
  end
  style page118 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page119 ["📄 shared/locales/tr/translations/index.ts"]
    page119_placeholder[" "]
    style page119_placeholder fill:transparent,stroke:transparent
  end
  style page119 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page120 ["📄 shared/locales/tr/translations/labs/index.ts"]
    page120_placeholder[" "]
    style page120_placeholder fill:transparent,stroke:transparent
  end
  style page120 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page121 ["📄 shared/locales/tr/translations/medications/index.ts"]
    page121_placeholder[" "]
    style page121_placeholder fill:transparent,stroke:transparent
  end
  style page121 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page122 ["📄 shared/locales/tr/translations/network-status/index.ts"]
    page122_placeholder[" "]
    style page122_placeholder fill:transparent,stroke:transparent
  end
  style page122 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page123 ["📄 shared/locales/tr/translations/patient/index.ts"]
    page123_placeholder[" "]
    style page123_placeholder fill:transparent,stroke:transparent
  end
  style page123 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page124 ["📄 shared/locales/tr/translations/patients/index.ts"]
    page124_placeholder[" "]
    style page124_placeholder fill:transparent,stroke:transparent
  end
  style page124 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page125 ["📄 shared/locales/tr/translations/scheduling/index.ts"]
    page125_placeholder[" "]
    style page125_placeholder fill:transparent,stroke:transparent
  end
  style page125 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page126 ["📄 shared/locales/tr/translations/settings/index.ts"]
    page126_placeholder[" "]
    style page126_placeholder fill:transparent,stroke:transparent
  end
  style page126 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page127 ["📄 shared/locales/tr/translations/sex/index.ts"]
    page127_placeholder[" "]
    style page127_placeholder fill:transparent,stroke:transparent
  end
  style page127 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page128 ["📄 shared/locales/tr/translations/states/index.ts"]
    page128_placeholder[" "]
    style page128_placeholder fill:transparent,stroke:transparent
  end
  style page128 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page129 ["📄 shared/locales/tr/translations/user/index.ts"]
    page129_placeholder[" "]
    style page129_placeholder fill:transparent,stroke:transparent
  end
  style page129 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page130 ["📄 shared/locales/zhCN/translations/actions/index.ts"]
    page130_placeholder[" "]
    style page130_placeholder fill:transparent,stroke:transparent
  end
  style page130 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page131 ["📄 shared/locales/zhCN/translations/dashboard/index.ts"]
    page131_placeholder[" "]
    style page131_placeholder fill:transparent,stroke:transparent
  end
  style page131 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page132 ["📄 shared/locales/zhCN/translations/index.ts"]
    page132_placeholder[" "]
    style page132_placeholder fill:transparent,stroke:transparent
  end
  style page132 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page133 ["📄 shared/locales/zhCN/translations/labs/index.ts"]
    page133_placeholder[" "]
    style page133_placeholder fill:transparent,stroke:transparent
  end
  style page133 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page134 ["📄 shared/locales/zhCN/translations/medications/index.ts"]
    page134_placeholder[" "]
    style page134_placeholder fill:transparent,stroke:transparent
  end
  style page134 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page135 ["📄 shared/locales/zhCN/translations/patient/index.ts"]
    page135_placeholder[" "]
    style page135_placeholder fill:transparent,stroke:transparent
  end
  style page135 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page136 ["📄 shared/locales/zhCN/translations/patients/index.ts"]
    page136_placeholder[" "]
    style page136_placeholder fill:transparent,stroke:transparent
  end
  style page136 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page137 ["📄 shared/locales/zhCN/translations/settings/index.ts"]
    page137_placeholder[" "]
    style page137_placeholder fill:transparent,stroke:transparent
  end
  style page137 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

  subgraph page138 ["📄 shared/store/index.ts"]
    page138_c0["🧩 components"]
    style page138_c0 fill:#7BB3F0,stroke:#4A90E2,color:#FFFFFF
  end
  style page138 fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32

```