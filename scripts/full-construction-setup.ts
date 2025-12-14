#!/usr/bin/env npx tsx
/**
 * 建設業版Lark Base - 完全版セットアップ
 * Miyabi Agent 全能力解放モード
 *
 * 実務フローに基づく本格的な工事管理システム:
 * - 受注→契約→工程管理→日報→検査→完工
 * - 適切なリレーション設計
 * - ガントチャートビュー
 * - ダッシュボード
 */

import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

// 環境変数読み込み
const envPath = join(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

const LARK_APP_ID = envVars.LARK_APP_ID;
const LARK_APP_SECRET = envVars.LARK_APP_SECRET;
const BASE_URL = 'https://open.larksuite.com/open-apis';

// フィールドタイプ
const F = {
  TEXT: 1,
  NUMBER: 2,
  SELECT: 3,
  MULTI_SELECT: 4,
  DATE: 5,
  CHECKBOX: 7,
  PERSON: 11,
  PHONE: 13,
  URL: 15,
  ATTACHMENT: 17,
  LINK: 18,        // 他テーブルへのリンク
  FORMULA: 20,
  DUPLEX_LINK: 21, // 双方向リンク
  CREATED_TIME: 1001,
  UPDATED_TIME: 1002,
  CREATED_BY: 1003,
  UPDATED_BY: 1004,
  AUTO_NUMBER: 1005,
};

interface TableDef {
  name: string;
  fields: Array<{
    field_name: string;
    type: number;
    property?: unknown;
  }>;
}

// ========================================
// テーブル定義 - 建設業実務フロー完全版
// ========================================

const TABLES: TableDef[] = [
  // ========== マスタテーブル ==========
  {
    name: '01_発注者マスタ',
    fields: [
      { field_name: '発注者コード', type: F.AUTO_NUMBER },
      { field_name: '発注者名', type: F.TEXT },
      { field_name: '発注者区分', type: F.SELECT, property: { options: [
        { name: '官公庁' }, { name: '民間企業' }, { name: '個人' }, { name: 'デベロッパー' }
      ]}},
      { field_name: '担当者名', type: F.TEXT },
      { field_name: '電話番号', type: F.PHONE },
      { field_name: 'メールアドレス', type: F.TEXT },
      { field_name: '住所', type: F.TEXT },
      { field_name: '取引開始日', type: F.DATE },
      { field_name: '与信枠', type: F.NUMBER },
      { field_name: '備考', type: F.TEXT },
    ],
  },
  {
    name: '02_資格者マスタ',
    fields: [
      { field_name: '社員番号', type: F.TEXT },
      { field_name: '氏名', type: F.TEXT },
      { field_name: '所属部署', type: F.SELECT, property: { options: [
        { name: '建築部' }, { name: '土木部' }, { name: '設備部' }, { name: '営業部' }, { name: '管理部' }
      ]}},
      { field_name: '役職', type: F.SELECT, property: { options: [
        { name: '部長' }, { name: '課長' }, { name: '主任' }, { name: '技術者' }, { name: '作業員' }
      ]}},
      { field_name: '保有資格', type: F.MULTI_SELECT, property: { options: [
        { name: '1級建築士' }, { name: '2級建築士' },
        { name: '1級建築施工管理技士' }, { name: '2級建築施工管理技士' },
        { name: '1級土木施工管理技士' }, { name: '2級土木施工管理技士' },
        { name: '1級管工事施工管理技士' }, { name: '1級電気工事施工管理技士' },
        { name: '測量士' }, { name: '測量士補' },
        { name: '宅地建物取引士' },
        { name: '安全衛生責任者' }, { name: '職長' },
        { name: '玉掛け技能' }, { name: 'クレーン運転士' },
        { name: '足場組立作業主任者' }, { name: '酸欠危険作業主任者' },
      ]}},
      { field_name: '入社日', type: F.DATE },
      { field_name: '電話番号', type: F.PHONE },
      { field_name: 'メールアドレス', type: F.TEXT },
      { field_name: '日当単価', type: F.NUMBER },
      { field_name: '在籍状況', type: F.SELECT, property: { options: [
        { name: '在籍' }, { name: '休職' }, { name: '退職' }
      ]}},
      { field_name: '顔写真', type: F.ATTACHMENT },
    ],
  },
  {
    name: '03_協力会社マスタ',
    fields: [
      { field_name: '会社コード', type: F.AUTO_NUMBER },
      { field_name: '会社名', type: F.TEXT },
      { field_name: '代表者名', type: F.TEXT },
      { field_name: '住所', type: F.TEXT },
      { field_name: '電話番号', type: F.PHONE },
      { field_name: 'FAX番号', type: F.TEXT },
      { field_name: 'メールアドレス', type: F.TEXT },
      { field_name: '専門工種', type: F.MULTI_SELECT, property: { options: [
        { name: 'とび・土工' }, { name: '型枠' }, { name: '鉄筋' }, { name: '鉄骨' },
        { name: 'コンクリート' }, { name: '左官' }, { name: 'タイル' },
        { name: '防水' }, { name: '塗装' }, { name: '内装' }, { name: '建具' },
        { name: '電気' }, { name: '空調' }, { name: '衛生設備' }, { name: '消防' },
        { name: '外構' }, { name: '解体' }, { name: '産廃処理' },
      ]}},
      { field_name: '評価ランク', type: F.SELECT, property: { options: [
        { name: 'S' }, { name: 'A' }, { name: 'B' }, { name: 'C' }, { name: '新規' }
      ]}},
      { field_name: '安全成績', type: F.SELECT, property: { options: [
        { name: '優良' }, { name: '良好' }, { name: '普通' }, { name: '要注意' }
      ]}},
      { field_name: '労災保険加入', type: F.CHECKBOX },
      { field_name: '賠償責任保険加入', type: F.CHECKBOX },
      { field_name: '建設業許可番号', type: F.TEXT },
      { field_name: '許可業種', type: F.TEXT },
      { field_name: '経審点数', type: F.NUMBER },
      { field_name: '取引銀行', type: F.TEXT },
      { field_name: '支払条件', type: F.SELECT, property: { options: [
        { name: '月末締翌月末払' }, { name: '月末締翌々月末払' }, { name: '出来高払' }
      ]}},
      { field_name: '取引状況', type: F.SELECT, property: { options: [
        { name: '取引中' }, { name: '休止' }, { name: '取引停止' }
      ]}},
    ],
  },
  {
    name: '04_資機材マスタ',
    fields: [
      { field_name: '資機材コード', type: F.AUTO_NUMBER },
      { field_name: '資機材名', type: F.TEXT },
      { field_name: '大分類', type: F.SELECT, property: { options: [
        { name: '重機' }, { name: '車両' }, { name: '揚重機' },
        { name: '足場・仮設' }, { name: '型枠' }, { name: '鉄筋加工機' },
        { name: '電動工具' }, { name: '測量機器' }, { name: '安全設備' },
        { name: '発電機・照明' }, { name: 'ポンプ類' }, { name: 'その他' },
      ]}},
      { field_name: 'メーカー', type: F.TEXT },
      { field_name: '型番', type: F.TEXT },
      { field_name: '仕様', type: F.TEXT },
      { field_name: '保有台数', type: F.NUMBER },
      { field_name: '現在使用中', type: F.NUMBER },
      { field_name: '単位', type: F.SELECT, property: { options: [
        { name: '台' }, { name: '基' }, { name: 'セット' }, { name: '本' }, { name: '枚' }, { name: 'm' }, { name: '㎡' }
      ]}},
      { field_name: '日額リース料', type: F.NUMBER },
      { field_name: '月額リース料', type: F.NUMBER },
      { field_name: '購入価格', type: F.NUMBER },
      { field_name: '耐用年数', type: F.NUMBER },
      { field_name: '保管場所', type: F.TEXT },
      { field_name: '状態', type: F.SELECT, property: { options: [
        { name: '使用可能' }, { name: '使用中' }, { name: '整備中' }, { name: '故障' }, { name: '廃棄予定' }
      ]}},
      { field_name: '次回点検日', type: F.DATE },
      { field_name: '写真', type: F.ATTACHMENT },
    ],
  },
  {
    name: '05_工種マスタ',
    fields: [
      { field_name: '工種コード', type: F.TEXT },
      { field_name: '工種名', type: F.TEXT },
      { field_name: '工種区分', type: F.SELECT, property: { options: [
        { name: '仮設工事' }, { name: '土工事' }, { name: '地業工事' }, { name: '基礎工事' },
        { name: '躯体工事' }, { name: '鉄骨工事' }, { name: '防水工事' }, { name: '外装工事' },
        { name: '内装工事' }, { name: '建具工事' }, { name: '電気工事' }, { name: '機械設備工事' },
        { name: '外構工事' }, { name: '解体工事' }, { name: 'その他' },
      ]}},
      { field_name: '単位', type: F.TEXT },
      { field_name: '必要資格', type: F.MULTI_SELECT, property: { options: [
        { name: '施工管理技士' }, { name: '安全衛生責任者' }, { name: '職長' },
        { name: '玉掛け' }, { name: 'クレーン' }, { name: '足場作業主任者' },
      ]}},
      { field_name: '危険度', type: F.SELECT, property: { options: [
        { name: '高' }, { name: '中' }, { name: '低' }
      ]}},
      { field_name: '備考', type: F.TEXT },
    ],
  },

  // ========== 案件・契約管理 ==========
  {
    name: '10_案件情報',
    fields: [
      { field_name: '案件番号', type: F.AUTO_NUMBER },
      { field_name: '案件名', type: F.TEXT },
      { field_name: '案件種別', type: F.SELECT, property: { options: [
        { name: '新築' }, { name: '増築' }, { name: '改修' }, { name: '解体' }, { name: '土木' }, { name: 'その他' }
      ]}},
      { field_name: '構造', type: F.SELECT, property: { options: [
        { name: 'RC造' }, { name: 'SRC造' }, { name: 'S造' }, { name: 'W造' }, { name: 'その他' }
      ]}},
      { field_name: '延床面積', type: F.NUMBER },
      { field_name: '現場住所', type: F.TEXT },
      { field_name: '案件ステータス', type: F.SELECT, property: { options: [
        { name: '情報収集' }, { name: '見積作成中' }, { name: '見積提出済' },
        { name: '交渉中' }, { name: '内定' }, { name: '受注' }, { name: '失注' }, { name: '保留' }
      ]}},
      { field_name: '概算金額', type: F.NUMBER },
      { field_name: '予定着工日', type: F.DATE },
      { field_name: '予定竣工日', type: F.DATE },
      { field_name: '営業担当', type: F.TEXT },
      { field_name: '受注確度', type: F.SELECT, property: { options: [
        { name: 'A(80%以上)' }, { name: 'B(50-80%)' }, { name: 'C(30-50%)' }, { name: 'D(30%未満)' }
      ]}},
      { field_name: '競合情報', type: F.TEXT },
      { field_name: '備考', type: F.TEXT },
    ],
  },
  {
    name: '11_工事契約',
    fields: [
      { field_name: '契約番号', type: F.AUTO_NUMBER },
      { field_name: '工事名', type: F.TEXT },
      { field_name: '発注者', type: F.TEXT },
      { field_name: '契約形態', type: F.SELECT, property: { options: [
        { name: '総価請負' }, { name: '単価請負' }, { name: 'コストプラスフィー' }, { name: 'CM方式' }
      ]}},
      { field_name: '契約金額', type: F.NUMBER },
      { field_name: '消費税', type: F.NUMBER },
      { field_name: '契約金額(税込)', type: F.NUMBER },
      { field_name: '契約日', type: F.DATE },
      { field_name: '着工日', type: F.DATE },
      { field_name: '竣工予定日', type: F.DATE },
      { field_name: '実際の竣工日', type: F.DATE },
      { field_name: '工期(日)', type: F.NUMBER },
      { field_name: '現場住所', type: F.TEXT },
      { field_name: '工事主任', type: F.TEXT },
      { field_name: 'ステータス', type: F.SELECT, property: { options: [
        { name: '準備中' }, { name: '着工前' }, { name: '施工中' }, { name: '検査中' },
        { name: '手直し中' }, { name: '完工' }, { name: '引渡済' }, { name: '中断' }, { name: '中止' }
      ]}},
      { field_name: '実行予算', type: F.NUMBER },
      { field_name: '粗利予定額', type: F.NUMBER },
      { field_name: '粗利率', type: F.NUMBER },
      { field_name: '支払条件', type: F.TEXT },
      { field_name: '契約書', type: F.ATTACHMENT },
      { field_name: '備考', type: F.TEXT },
    ],
  },

  // ========== 工程管理（3階層WBS） ==========
  {
    name: '20_工程管理_大工程',
    fields: [
      { field_name: '大工程番号', type: F.AUTO_NUMBER },
      { field_name: '大工程名', type: F.TEXT },
      { field_name: '工程区分', type: F.SELECT, property: { options: [
        { name: '準備工' }, { name: '仮設工' }, { name: '土工' }, { name: '基礎工' },
        { name: '躯体工' }, { name: '外装工' }, { name: '内装工' }, { name: '設備工' },
        { name: '外構工' }, { name: '検査・引渡' },
      ]}},
      { field_name: '予定開始日', type: F.DATE },
      { field_name: '予定終了日', type: F.DATE },
      { field_name: '実績開始日', type: F.DATE },
      { field_name: '実績終了日', type: F.DATE },
      { field_name: '予定日数', type: F.NUMBER },
      { field_name: '進捗率', type: F.NUMBER },
      { field_name: 'ステータス', type: F.SELECT, property: { options: [
        { name: '未着手' }, { name: '進行中' }, { name: '予定通り' }, { name: '遅延' }, { name: '完了' }, { name: '中断' }
      ]}},
      { field_name: 'クリティカルパス', type: F.CHECKBOX },
      { field_name: 'マイルストーン', type: F.CHECKBOX },
      { field_name: '表示色', type: F.SELECT, property: { options: [
        { name: '青' }, { name: '緑' }, { name: '黄' }, { name: 'オレンジ' }, { name: '赤' }, { name: '紫' }
      ]}},
      { field_name: '備考', type: F.TEXT },
    ],
  },
  {
    name: '21_工程管理_中工程',
    fields: [
      { field_name: '中工程番号', type: F.AUTO_NUMBER },
      { field_name: '工事契約番号', type: F.TEXT },
      { field_name: '中工程名', type: F.TEXT },
      { field_name: '予定開始日', type: F.DATE },
      { field_name: '予定終了日', type: F.DATE },
      { field_name: '実績開始日', type: F.DATE },
      { field_name: '実績終了日', type: F.DATE },
      { field_name: '予定日数', type: F.NUMBER },
      { field_name: '進捗率', type: F.NUMBER },
      { field_name: 'ステータス', type: F.SELECT, property: { options: [
        { name: '未着手' }, { name: '進行中' }, { name: '予定通り' }, { name: '遅延' }, { name: '完了' }, { name: '中断' }
      ]}},
      { field_name: '担当者', type: F.TEXT },
      { field_name: '協力会社', type: F.TEXT },
      { field_name: 'クリティカルパス', type: F.CHECKBOX },
      { field_name: '備考', type: F.TEXT },
    ],
  },
  {
    name: '22_工程管理_小工程',
    fields: [
      { field_name: '小工程番号', type: F.AUTO_NUMBER },
      { field_name: '工事契約番号', type: F.TEXT },
      { field_name: '小工程名', type: F.TEXT },
      { field_name: '作業内容', type: F.TEXT },
      { field_name: '予定開始日', type: F.DATE },
      { field_name: '予定終了日', type: F.DATE },
      { field_name: '実績開始日', type: F.DATE },
      { field_name: '実績終了日', type: F.DATE },
      { field_name: '予定数量', type: F.NUMBER },
      { field_name: '実績数量', type: F.NUMBER },
      { field_name: '単位', type: F.TEXT },
      { field_name: '進捗率', type: F.NUMBER },
      { field_name: 'ステータス', type: F.SELECT, property: { options: [
        { name: '未着手' }, { name: '進行中' }, { name: '予定通り' }, { name: '遅延' }, { name: '完了' }, { name: '中断' }
      ]}},
      { field_name: '担当者', type: F.TEXT },
      { field_name: '必要人工', type: F.NUMBER },
      { field_name: '投入人工', type: F.NUMBER },
      { field_name: '協力会社', type: F.TEXT },
      { field_name: '使用資機材', type: F.TEXT },
      { field_name: '先行工程', type: F.TEXT },
      { field_name: '天候影響', type: F.SELECT, property: { options: [
        { name: '雨天中止' }, { name: '雨天可' }, { name: '屋内作業' }
      ]}},
      { field_name: 'ガントチャート表示', type: F.CHECKBOX },
      { field_name: '備考', type: F.TEXT },
    ],
  },

  // ========== リソース配置 ==========
  {
    name: '30_人員配置',
    fields: [
      { field_name: '配置番号', type: F.AUTO_NUMBER },
      { field_name: '工事契約番号', type: F.TEXT },
      { field_name: '工程番号', type: F.TEXT },
      { field_name: '氏名', type: F.TEXT },
      { field_name: '役割', type: F.SELECT, property: { options: [
        { name: '現場所長' }, { name: '工事主任' }, { name: '職長' },
        { name: '安全担当' }, { name: '品質担当' }, { name: '作業員' }
      ]}},
      { field_name: '配置開始日', type: F.DATE },
      { field_name: '配置終了日', type: F.DATE },
      { field_name: '日当', type: F.NUMBER },
      { field_name: 'ステータス', type: F.SELECT, property: { options: [
        { name: '予定' }, { name: '配置中' }, { name: '完了' }, { name: 'キャンセル' }
      ]}},
      { field_name: '備考', type: F.TEXT },
    ],
  },
  {
    name: '31_機材配置',
    fields: [
      { field_name: '配置番号', type: F.AUTO_NUMBER },
      { field_name: '工事契約番号', type: F.TEXT },
      { field_name: '工程番号', type: F.TEXT },
      { field_name: '資機材名', type: F.TEXT },
      { field_name: '数量', type: F.NUMBER },
      { field_name: '単位', type: F.TEXT },
      { field_name: '配置開始日', type: F.DATE },
      { field_name: '配置終了日', type: F.DATE },
      { field_name: '日額', type: F.NUMBER },
      { field_name: '合計金額', type: F.NUMBER },
      { field_name: 'ステータス', type: F.SELECT, property: { options: [
        { name: '予約中' }, { name: '使用中' }, { name: '返却済' }, { name: 'キャンセル' }
      ]}},
      { field_name: '備考', type: F.TEXT },
    ],
  },
  {
    name: '32_協力会社発注',
    fields: [
      { field_name: '発注番号', type: F.AUTO_NUMBER },
      { field_name: '工事契約番号', type: F.TEXT },
      { field_name: '工程番号', type: F.TEXT },
      { field_name: '協力会社名', type: F.TEXT },
      { field_name: '工種', type: F.TEXT },
      { field_name: '発注内容', type: F.TEXT },
      { field_name: '発注金額', type: F.NUMBER },
      { field_name: '発注日', type: F.DATE },
      { field_name: '着工予定日', type: F.DATE },
      { field_name: '完了予定日', type: F.DATE },
      { field_name: '実際の完了日', type: F.DATE },
      { field_name: 'ステータス', type: F.SELECT, property: { options: [
        { name: '見積依頼中' }, { name: '発注済' }, { name: '施工中' },
        { name: '完了' }, { name: '検収済' }, { name: '支払済' }, { name: 'キャンセル' }
      ]}},
      { field_name: '検収金額', type: F.NUMBER },
      { field_name: '支払予定日', type: F.DATE },
      { field_name: '発注書', type: F.ATTACHMENT },
      { field_name: '備考', type: F.TEXT },
    ],
  },

  // ========== 日報・進捗管理 ==========
  {
    name: '40_作業日報',
    fields: [
      { field_name: '日報番号', type: F.AUTO_NUMBER },
      { field_name: '工事契約番号', type: F.TEXT },
      { field_name: '日付', type: F.DATE },
      { field_name: '天候', type: F.SELECT, property: { options: [
        { name: '晴れ' }, { name: '曇り' }, { name: '雨' }, { name: '雪' }, { name: '強風' }
      ]}},
      { field_name: '気温(最高)', type: F.NUMBER },
      { field_name: '気温(最低)', type: F.NUMBER },
      { field_name: '作業可否', type: F.SELECT, property: { options: [
        { name: '通常作業' }, { name: '一部中止' }, { name: '全面中止' }
      ]}},
      { field_name: '元請人員', type: F.NUMBER },
      { field_name: '協力会社人員', type: F.NUMBER },
      { field_name: '合計人員', type: F.NUMBER },
      { field_name: '本日の作業内容', type: F.TEXT },
      { field_name: '本日の進捗', type: F.TEXT },
      { field_name: '明日の予定', type: F.TEXT },
      { field_name: '問題・課題', type: F.TEXT },
      { field_name: '指示事項', type: F.TEXT },
      { field_name: '来場者', type: F.TEXT },
      { field_name: '写真', type: F.ATTACHMENT },
      { field_name: '作成者', type: F.TEXT },
      { field_name: '承認者', type: F.TEXT },
      { field_name: '承認日時', type: F.DATE },
    ],
  },
  {
    name: '41_日報_作業詳細',
    fields: [
      { field_name: '明細番号', type: F.AUTO_NUMBER },
      { field_name: '工程番号', type: F.TEXT },
      { field_name: '工種', type: F.TEXT },
      { field_name: '作業内容', type: F.TEXT },
      { field_name: '作業場所', type: F.TEXT },
      { field_name: '投入人工', type: F.NUMBER },
      { field_name: '出来高数量', type: F.NUMBER },
      { field_name: '単位', type: F.TEXT },
      { field_name: '進捗率', type: F.NUMBER },
      { field_name: '協力会社', type: F.TEXT },
      { field_name: '使用資機材', type: F.TEXT },
      { field_name: '備考', type: F.TEXT },
    ],
  },

  // ========== 安全管理 ==========
  {
    name: '50_安全パトロール',
    fields: [
      { field_name: 'パトロール番号', type: F.AUTO_NUMBER },
      { field_name: '工事契約番号', type: F.TEXT },
      { field_name: '実施日', type: F.DATE },
      { field_name: 'パトロール種別', type: F.SELECT, property: { options: [
        { name: '日常巡視' }, { name: '週間パトロール' }, { name: '月間パトロール' },
        { name: '本社パトロール' }, { name: '発注者パトロール' }, { name: '労基署巡視' }
      ]}},
      { field_name: '実施者', type: F.TEXT },
      { field_name: '総合評価', type: F.SELECT, property: { options: [
        { name: '優良' }, { name: '良好' }, { name: '普通' }, { name: '要改善' }, { name: '危険' }
      ]}},
      { field_name: '整理整頓', type: F.SELECT, property: { options: [
        { name: '◎' }, { name: '○' }, { name: '△' }, { name: '×' }
      ]}},
      { field_name: '安全通路', type: F.SELECT, property: { options: [
        { name: '◎' }, { name: '○' }, { name: '△' }, { name: '×' }
      ]}},
      { field_name: '足場・開口部', type: F.SELECT, property: { options: [
        { name: '◎' }, { name: '○' }, { name: '△' }, { name: '×' }
      ]}},
      { field_name: '保護具着用', type: F.SELECT, property: { options: [
        { name: '◎' }, { name: '○' }, { name: '△' }, { name: '×' }
      ]}},
      { field_name: '重機・車両', type: F.SELECT, property: { options: [
        { name: '◎' }, { name: '○' }, { name: '△' }, { name: '×' }
      ]}},
      { field_name: '指摘事項', type: F.TEXT },
      { field_name: '是正指示', type: F.TEXT },
      { field_name: '是正期限', type: F.DATE },
      { field_name: '是正完了日', type: F.DATE },
      { field_name: '写真', type: F.ATTACHMENT },
    ],
  },
  {
    name: '51_KY活動記録',
    fields: [
      { field_name: 'KY番号', type: F.AUTO_NUMBER },
      { field_name: '工事契約番号', type: F.TEXT },
      { field_name: '実施日', type: F.DATE },
      { field_name: '作業班', type: F.TEXT },
      { field_name: '職長', type: F.TEXT },
      { field_name: '参加人数', type: F.NUMBER },
      { field_name: '作業内容', type: F.TEXT },
      { field_name: '作業場所', type: F.TEXT },
      { field_name: '想定される危険', type: F.TEXT },
      { field_name: '対策', type: F.TEXT },
      { field_name: '本日の目標', type: F.TEXT },
      { field_name: '指差呼称項目', type: F.TEXT },
    ],
  },
  {
    name: '52_事故・災害記録',
    fields: [
      { field_name: '事故番号', type: F.AUTO_NUMBER },
      { field_name: '工事契約番号', type: F.TEXT },
      { field_name: '発生日時', type: F.DATE },
      { field_name: '事故種別', type: F.SELECT, property: { options: [
        { name: '死亡災害' }, { name: '重傷災害' }, { name: '軽傷災害' }, { name: '不休災害' },
        { name: 'ヒヤリハット' }, { name: '物損事故' }, { name: '第三者災害' }
      ]}},
      { field_name: '発生場所', type: F.TEXT },
      { field_name: '被災者', type: F.TEXT },
      { field_name: '所属', type: F.TEXT },
      { field_name: '事故の状況', type: F.TEXT },
      { field_name: '原因', type: F.TEXT },
      { field_name: '応急措置', type: F.TEXT },
      { field_name: '再発防止策', type: F.TEXT },
      { field_name: '休業日数', type: F.NUMBER },
      { field_name: '労基署届出', type: F.CHECKBOX },
      { field_name: '写真', type: F.ATTACHMENT },
    ],
  },

  // ========== 品質管理 ==========
  {
    name: '60_検査記録',
    fields: [
      { field_name: '検査番号', type: F.AUTO_NUMBER },
      { field_name: '工事契約番号', type: F.TEXT },
      { field_name: '工程番号', type: F.TEXT },
      { field_name: '検査日', type: F.DATE },
      { field_name: '検査種別', type: F.SELECT, property: { options: [
        { name: '自主検査' }, { name: '社内検査' }, { name: '設計検査' },
        { name: '発注者検査' }, { name: '官公庁検査' }, { name: '完了検査' }
      ]}},
      { field_name: '検査項目', type: F.TEXT },
      { field_name: '検査箇所', type: F.TEXT },
      { field_name: '検査基準', type: F.TEXT },
      { field_name: '測定値', type: F.TEXT },
      { field_name: '判定', type: F.SELECT, property: { options: [
        { name: '合格' }, { name: '条件付合格' }, { name: '要手直し' }, { name: '不合格' }
      ]}},
      { field_name: '検査員', type: F.TEXT },
      { field_name: '立会者', type: F.TEXT },
      { field_name: '指摘事項', type: F.TEXT },
      { field_name: '是正内容', type: F.TEXT },
      { field_name: '是正完了日', type: F.DATE },
      { field_name: '写真', type: F.ATTACHMENT },
      { field_name: '検査報告書', type: F.ATTACHMENT },
    ],
  },

  // ========== 原価管理 ==========
  {
    name: '70_実行予算',
    fields: [
      { field_name: '予算番号', type: F.AUTO_NUMBER },
      { field_name: '工事契約番号', type: F.TEXT },
      { field_name: '費目', type: F.SELECT, property: { options: [
        { name: '労務費' }, { name: '材料費' }, { name: '外注費' },
        { name: '機械経費' }, { name: '仮設費' }, { name: '現場経費' }, { name: 'その他' }
      ]}},
      { field_name: '工種', type: F.TEXT },
      { field_name: '内訳', type: F.TEXT },
      { field_name: '数量', type: F.NUMBER },
      { field_name: '単位', type: F.TEXT },
      { field_name: '単価', type: F.NUMBER },
      { field_name: '予算金額', type: F.NUMBER },
      { field_name: '発注済金額', type: F.NUMBER },
      { field_name: '実績金額', type: F.NUMBER },
      { field_name: '残予算', type: F.NUMBER },
      { field_name: '消化率', type: F.NUMBER },
      { field_name: '備考', type: F.TEXT },
    ],
  },
  {
    name: '71_出来高管理',
    fields: [
      { field_name: '出来高番号', type: F.AUTO_NUMBER },
      { field_name: '工事契約番号', type: F.TEXT },
      { field_name: '工種', type: F.TEXT },
      { field_name: '内訳', type: F.TEXT },
      { field_name: '契約数量', type: F.NUMBER },
      { field_name: '前月までの出来高', type: F.NUMBER },
      { field_name: '当月出来高', type: F.NUMBER },
      { field_name: '累計出来高', type: F.NUMBER },
      { field_name: '単位', type: F.TEXT },
      { field_name: '単価', type: F.NUMBER },
      { field_name: '当月出来高金額', type: F.NUMBER },
      { field_name: '累計出来高金額', type: F.NUMBER },
      { field_name: '進捗率', type: F.NUMBER },
      { field_name: '備考', type: F.TEXT },
    ],
  },
];

// ========================================
// API関数
// ========================================

async function getAccessToken(): Promise<string> {
  const response = await fetch(`${BASE_URL}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: LARK_APP_ID, app_secret: LARK_APP_SECRET }),
  });
  const data = await response.json() as { code: number; tenant_access_token?: string };
  if (data.code !== 0 || !data.tenant_access_token) throw new Error('認証失敗');
  return data.tenant_access_token;
}

async function createBase(token: string, name: string): Promise<{ appToken: string; url: string }> {
  const response = await fetch(`${BASE_URL}/bitable/v1/apps`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const data = await response.json() as { code: number; data?: { app: { app_token: string; url: string } } };
  if (data.code !== 0 || !data.data) throw new Error('Base作成失敗');
  return { appToken: data.data.app.app_token, url: data.data.app.url };
}

async function createTable(token: string, appToken: string, table: TableDef): Promise<string> {
  const response = await fetch(`${BASE_URL}/bitable/v1/apps/${appToken}/tables`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ table: { name: table.name, fields: table.fields } }),
  });
  const data = await response.json() as { code: number; data?: { table_id: string }; msg?: string };
  if (data.code !== 0 || !data.data) throw new Error(`テーブル作成失敗(${table.name}): ${data.msg}`);
  return data.data.table_id;
}

async function createView(
  token: string,
  appToken: string,
  tableId: string,
  viewName: string,
  viewType: string
): Promise<string> {
  const response = await fetch(`${BASE_URL}/bitable/v1/apps/${appToken}/tables/${tableId}/views`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ view_name: viewName, view_type: viewType }),
  });
  const data = await response.json() as { code: number; data?: { view: { view_id: string } } };
  if (data.code !== 0) console.log(`  ⚠️ ビュー作成スキップ: ${viewName}`);
  return data.data?.view?.view_id || '';
}

async function batchCreateRecords(
  token: string,
  appToken: string,
  tableId: string,
  records: Array<{ fields: Record<string, unknown> }>
): Promise<number> {
  const response = await fetch(
    `${BASE_URL}/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_create`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ records }),
    }
  );
  const data = await response.json() as { code: number; data?: { records: unknown[] } };
  return data.data?.records?.length || 0;
}

// ========================================
// サンプルデータ
// ========================================

async function insertSampleData(token: string, appToken: string, tableIds: Record<string, string>) {
  console.log('\n📝 サンプルデータ投入中...\n');

  // 発注者マスタ
  let count = await batchCreateRecords(token, appToken, tableIds['01_発注者マスタ'], [
    { fields: { '発注者名': '株式会社〇〇開発', '発注者区分': '民間企業', '担当者名': '田中一郎', '住所': '東京都千代田区丸の内1-1-1' }},
    { fields: { '発注者名': '国土交通省関東地方整備局', '発注者区分': '官公庁', '担当者名': '山本次郎', '住所': '埼玉県さいたま市中央区新都心2-1' }},
    { fields: { '発注者名': '△△不動産株式会社', '発注者区分': 'デベロッパー', '担当者名': '佐藤三郎', '住所': '東京都港区六本木6-1-1' }},
  ]);
  console.log(`  ✅ 発注者マスタ: ${count}件`);

  // 資格者マスタ
  count = await batchCreateRecords(token, appToken, tableIds['02_資格者マスタ'], [
    { fields: { '社員番号': 'E001', '氏名': '山田太郎', '所属部署': '建築部', '役職': '課長', '保有資格': ['1級建築施工管理技士', '安全衛生責任者'], '在籍状況': '在籍', '日当単価': 35000 }},
    { fields: { '社員番号': 'E002', '氏名': '佐藤花子', '所属部署': '建築部', '役職': '主任', '保有資格': ['1級建築士', '1級建築施工管理技士'], '在籍状況': '在籍', '日当単価': 40000 }},
    { fields: { '社員番号': 'E003', '氏名': '鈴木一郎', '所属部署': '土木部', '役職': '課長', '保有資格': ['1級土木施工管理技士', '測量士'], '在籍状況': '在籍', '日当単価': 35000 }},
    { fields: { '社員番号': 'E004', '氏名': '高橋次郎', '所属部署': '建築部', '役職': '技術者', '保有資格': ['2級建築施工管理技士', '職長'], '在籍状況': '在籍', '日当単価': 28000 }},
    { fields: { '社員番号': 'E005', '氏名': '田中美咲', '所属部署': '設備部', '役職': '主任', '保有資格': ['1級管工事施工管理技士'], '在籍状況': '在籍', '日当単価': 32000 }},
  ]);
  console.log(`  ✅ 資格者マスタ: ${count}件`);

  // 協力会社マスタ
  count = await batchCreateRecords(token, appToken, tableIds['03_協力会社マスタ'], [
    { fields: { '会社名': '東建工業株式会社', '専門工種': ['とび・土工', '型枠'], '評価ランク': 'A', '安全成績': '優良', '労災保険加入': true, '賠償責任保険加入': true, '取引状況': '取引中' }},
    { fields: { '会社名': '鉄筋工業株式会社', '専門工種': ['鉄筋'], '評価ランク': 'A', '安全成績': '良好', '労災保険加入': true, '賠償責任保険加入': true, '取引状況': '取引中' }},
    { fields: { '会社名': '株式会社西電設', '専門工種': ['電気'], '評価ランク': 'S', '安全成績': '優良', '労災保険加入': true, '賠償責任保険加入': true, '取引状況': '取引中' }},
    { fields: { '会社名': '南空調設備', '専門工種': ['空調', '衛生設備'], '評価ランク': 'A', '安全成績': '良好', '労災保険加入': true, '賠償責任保険加入': true, '取引状況': '取引中' }},
    { fields: { '会社名': '北内装工業', '専門工種': ['内装', '建具'], '評価ランク': 'B', '安全成績': '普通', '労災保険加入': true, '取引状況': '取引中' }},
  ]);
  console.log(`  ✅ 協力会社マスタ: ${count}件`);

  // 資機材マスタ
  count = await batchCreateRecords(token, appToken, tableIds['04_資機材マスタ'], [
    { fields: { '資機材名': 'バックホー(0.7m3)', '大分類': '重機', 'メーカー': 'コマツ', '型番': 'PC200-10', '保有台数': 3, '現在使用中': 1, '単位': '台', '日額リース料': 45000, '状態': '使用可能' }},
    { fields: { '資機材名': 'ラフタークレーン(25t)', '大分類': '揚重機', 'メーカー': 'タダノ', '型番': 'GR-250N', '保有台数': 2, '現在使用中': 1, '単位': '台', '日額リース料': 80000, '状態': '使用中' }},
    { fields: { '資機材名': 'タワークレーン', '大分類': '揚重機', 'メーカー': 'IHI', '保有台数': 1, '現在使用中': 1, '単位': '基', '月額リース料': 3500000, '状態': '使用中' }},
    { fields: { '資機材名': '鋼製足場(クサビ式)', '大分類': '足場・仮設', 'メーカー': 'アルインコ', '保有台数': 500, '現在使用中': 350, '単位': 'スパン', '日額リース料': 150, '状態': '使用可能' }},
    { fields: { '資機材名': 'トータルステーション', '大分類': '測量機器', 'メーカー': 'トプコン', '型番': 'GM-105', '保有台数': 3, '現在使用中': 2, '単位': '台', '日額リース料': 5000, '状態': '使用可能' }},
    { fields: { '資機材名': 'コンクリートポンプ車', '大分類': '車両', 'メーカー': 'プツマイスター', '保有台数': 2, '現在使用中': 0, '単位': '台', '日額リース料': 120000, '状態': '使用可能' }},
  ]);
  console.log(`  ✅ 資機材マスタ: ${count}件`);

  // 工種マスタ
  count = await batchCreateRecords(token, appToken, tableIds['05_工種マスタ'], [
    { fields: { '工種コード': 'K01', '工種名': '仮囲い設置', '工種区分': '仮設工事', '標準歩掛': 0.5, '単位': 'm', '危険度': '中' }},
    { fields: { '工種コード': 'K02', '工種名': '根切り', '工種区分': '土工事', '標準歩掛': 0.1, '単位': 'm3', '必要資格': ['施工管理技士'], '危険度': '高' }},
    { fields: { '工種コード': 'K03', '工種名': '杭打ち', '工種区分': '地業工事', '標準歩掛': 0.3, '単位': '本', '必要資格': ['施工管理技士', 'クレーン'], '危険度': '高' }},
    { fields: { '工種コード': 'K04', '工種名': '基礎配筋', '工種区分': '基礎工事', '標準歩掛': 0.05, '単位': 'kg', '必要資格': ['職長'], '危険度': '中' }},
    { fields: { '工種コード': 'K05', '工種名': '基礎コンクリート打設', '工種区分': '基礎工事', '標準歩掛': 0.2, '単位': 'm3', '必要資格': ['施工管理技士'], '危険度': '中' }},
    { fields: { '工種コード': 'K06', '工種名': '鉄骨建方', '工種区分': '鉄骨工事', '標準歩掛': 0.15, '単位': 't', '必要資格': ['施工管理技士', 'クレーン', '玉掛け'], '危険度': '高' }},
    { fields: { '工種コード': 'K07', '工種名': '外壁ALCパネル取付', '工種区分': '外装工事', '標準歩掛': 0.3, '単位': '枚', '必要資格': ['足場作業主任者'], '危険度': '高' }},
    { fields: { '工種コード': 'K08', '工種名': '内装ボード貼り', '工種区分': '内装工事', '標準歩掛': 0.05, '単位': '㎡', '危険度': '低' }},
  ]);
  console.log(`  ✅ 工種マスタ: ${count}件`);

  // 案件情報
  count = await batchCreateRecords(token, appToken, tableIds['10_案件情報'], [
    { fields: { '案件名': '〇〇オフィスビル新築計画', '発注者': '株式会社〇〇開発', '案件種別': '新築', '構造': 'S造', '規模': '地上12階/地下1階', '延床面積': 15000, '現場住所': '東京都千代田区神田1-1-1', '案件ステータス': '受注', '概算金額': 2500000000, '営業担当': '営業部 渡辺', '受注確度': 'A(80%以上)' }},
    { fields: { '案件名': '△△マンション大規模修繕', '発注者': '△△管理組合', '案件種別': '改修', '構造': 'RC造', '規模': '地上15階', '延床面積': 12000, '現場住所': '東京都港区芝浦3-3-3', '案件ステータス': '交渉中', '概算金額': 450000000, '営業担当': '営業部 伊藤', '受注確度': 'B(50-80%)' }},
    { fields: { '案件名': '□□物流センター新築', '発注者': '□□物流株式会社', '案件種別': '新築', '構造': 'S造', '規模': '平屋', '延床面積': 25000, '現場住所': '千葉県市川市塩浜1-1-1', '案件ステータス': '見積作成中', '概算金額': 1800000000, '営業担当': '営業部 加藤', '受注確度': 'C(30-50%)' }},
  ]);
  console.log(`  ✅ 案件情報: ${count}件`);

  // 工事契約
  count = await batchCreateRecords(token, appToken, tableIds['11_工事契約'], [
    { fields: { '工事名': '〇〇オフィスビル新築工事', '発注者': '株式会社〇〇開発', '契約形態': '総価請負', '契約金額': 2300000000, '消費税': 230000000, '契約金額(税込)': 2530000000, '着工日': new Date('2025-01-15').getTime(), '竣工予定日': new Date('2026-09-30').getTime(), '現場住所': '東京都千代田区神田1-1-1', '現場所長': '山田太郎', '工事主任': '高橋次郎', 'ステータス': '施工中', '進捗率': 15, '実行予算': 2070000000, '粗利予定額': 230000000, '粗利率': 10 }},
    { fields: { '工事名': '△△橋梁補修工事', '発注者': '国土交通省関東地方整備局', '契約形態': '総価請負', '契約金額': 180000000, '消費税': 18000000, '契約金額(税込)': 198000000, '着工日': new Date('2025-03-01').getTime(), '竣工予定日': new Date('2025-11-30').getTime(), '現場住所': '埼玉県さいたま市緑区1-1', '現場所長': '鈴木一郎', 'ステータス': '準備中', '進捗率': 0, '実行予算': 162000000, '粗利予定額': 18000000, '粗利率': 10 }},
  ]);
  console.log(`  ✅ 工事契約: ${count}件`);

  // 大工程（〇〇オフィスビル用）
  count = await batchCreateRecords(token, appToken, tableIds['20_工程管理_大工程'], [
    { fields: { '工事契約番号': 'CNT-001', '大工程名': '準備・仮設工', '工程区分': '準備工', '予定開始日': new Date('2025-01-15').getTime(), '予定終了日': new Date('2025-02-14').getTime(), '進捗率': 100, 'ステータス': '完了', 'マイルストーン': true, '表示色': '青' }},
    { fields: { '工事契約番号': 'CNT-001', '大工程名': '土工・地業工', '工程区分': '土工', '予定開始日': new Date('2025-02-01').getTime(), '予定終了日': new Date('2025-04-30').getTime(), '進捗率': 85, 'ステータス': '進行中', 'クリティカルパス': true, '表示色': '緑' }},
    { fields: { '工事契約番号': 'CNT-001', '大工程名': '基礎工', '工程区分': '基礎工', '予定開始日': new Date('2025-03-15').getTime(), '予定終了日': new Date('2025-06-30').getTime(), '進捗率': 40, 'ステータス': '進行中', 'クリティカルパス': true, '表示色': '緑' }},
    { fields: { '工事契約番号': 'CNT-001', '大工程名': '躯体工', '工程区分': '躯体工', '予定開始日': new Date('2025-05-01').getTime(), '予定終了日': new Date('2025-12-31').getTime(), '進捗率': 0, 'ステータス': '未着手', 'クリティカルパス': true, 'マイルストーン': true, '表示色': '黄' }},
    { fields: { '工事契約番号': 'CNT-001', '大工程名': '外装工', '工程区分': '外装工', '予定開始日': new Date('2025-10-01').getTime(), '予定終了日': new Date('2026-04-30').getTime(), '進捗率': 0, 'ステータス': '未着手', '表示色': 'オレンジ' }},
    { fields: { '工事契約番号': 'CNT-001', '大工程名': '内装工', '工程区分': '内装工', '予定開始日': new Date('2026-01-01').getTime(), '予定終了日': new Date('2026-07-31').getTime(), '進捗率': 0, 'ステータス': '未着手', '表示色': '紫' }},
    { fields: { '工事契約番号': 'CNT-001', '大工程名': '設備工', '工程区分': '設備工', '予定開始日': new Date('2025-06-01').getTime(), '予定終了日': new Date('2026-08-31').getTime(), '進捗率': 0, 'ステータス': '未着手', '表示色': '赤' }},
    { fields: { '工事契約番号': 'CNT-001', '大工程名': '検査・引渡', '工程区分': '検査・引渡', '予定開始日': new Date('2026-08-01').getTime(), '予定終了日': new Date('2026-09-30').getTime(), '進捗率': 0, 'ステータス': '未着手', 'マイルストーン': true, '表示色': '青' }},
  ]);
  console.log(`  ✅ 大工程: ${count}件`);

  // 中工程
  count = await batchCreateRecords(token, appToken, tableIds['21_工程管理_中工程'], [
    { fields: { '大工程番号': 'L1-001', '工事契約番号': 'CNT-001', '中工程名': '仮囲い・ゲート設置', '工種': '仮設工事', '予定開始日': new Date('2025-01-15').getTime(), '予定終了日': new Date('2025-01-25').getTime(), '進捗率': 100, 'ステータス': '完了', '担当者': '高橋次郎', '協力会社': '東建工業株式会社' }},
    { fields: { '大工程番号': 'L1-001', '工事契約番号': 'CNT-001', '中工程名': '仮設事務所設置', '工種': '仮設工事', '予定開始日': new Date('2025-01-20').getTime(), '予定終了日': new Date('2025-01-31').getTime(), '進捗率': 100, 'ステータス': '完了', '担当者': '高橋次郎' }},
    { fields: { '大工程番号': 'L1-002', '工事契約番号': 'CNT-001', '中工程名': '山留め工事', '工種': '土工事', '予定開始日': new Date('2025-02-01').getTime(), '予定終了日': new Date('2025-03-15').getTime(), '進捗率': 100, 'ステータス': '完了', '担当者': '山田太郎', '協力会社': '東建工業株式会社', 'クリティカルパス': true }},
    { fields: { '大工程番号': 'L1-002', '工事契約番号': 'CNT-001', '中工程名': '根切り工事', '工種': '土工事', '予定開始日': new Date('2025-02-15').getTime(), '予定終了日': new Date('2025-04-15').getTime(), '進捗率': 80, 'ステータス': '進行中', '担当者': '山田太郎', '協力会社': '東建工業株式会社', 'クリティカルパス': true }},
    { fields: { '大工程番号': 'L1-003', '工事契約番号': 'CNT-001', '中工程名': '捨てコンクリート', '工種': '基礎工事', '予定開始日': new Date('2025-03-15').getTime(), '予定終了日': new Date('2025-03-31').getTime(), '進捗率': 100, 'ステータス': '完了', '担当者': '高橋次郎' }},
    { fields: { '大工程番号': 'L1-003', '工事契約番号': 'CNT-001', '中工程名': '基礎配筋', '工種': '基礎工事', '予定開始日': new Date('2025-04-01').getTime(), '予定終了日': new Date('2025-05-15').getTime(), '進捗率': 50, 'ステータス': '進行中', '担当者': '山田太郎', '協力会社': '鉄筋工業株式会社', 'クリティカルパス': true }},
    { fields: { '大工程番号': 'L1-003', '工事契約番号': 'CNT-001', '中工程名': '基礎コンクリート打設', '工種': '基礎工事', '予定開始日': new Date('2025-05-01').getTime(), '予定終了日': new Date('2025-06-30').getTime(), '進捗率': 0, 'ステータス': '未着手', '担当者': '山田太郎', 'クリティカルパス': true }},
  ]);
  console.log(`  ✅ 中工程: ${count}件`);

  // 小工程
  count = await batchCreateRecords(token, appToken, tableIds['22_工程管理_小工程'], [
    { fields: { '中工程番号': 'M1-004', '工事契約番号': 'CNT-001', '小工程名': '根切り(1F部分)', '作業内容': '1階部分の根切り掘削', '作業場所': '1F全域', '予定開始日': new Date('2025-02-15').getTime(), '予定終了日': new Date('2025-03-15').getTime(), '予定数量': 5000, '実績数量': 4500, '単位': 'm3', '進捗率': 90, 'ステータス': '進行中', '担当者': '山田太郎', '必要人工': 200, '投入人工': 180, '協力会社': '東建工業株式会社', '使用資機材': 'バックホー(0.7m3)', '天候影響': '雨天可', 'ガントチャート表示': true }},
    { fields: { '中工程番号': 'M1-004', '工事契約番号': 'CNT-001', '小工程名': '根切り(B1F部分)', '作業内容': '地下1階部分の根切り掘削', '作業場所': 'B1F全域', '予定開始日': new Date('2025-03-10').getTime(), '予定終了日': new Date('2025-04-15').getTime(), '予定数量': 3000, '実績数量': 2100, '単位': 'm3', '進捗率': 70, 'ステータス': '進行中', '担当者': '山田太郎', '必要人工': 150, '投入人工': 100, '協力会社': '東建工業株式会社', '使用資機材': 'バックホー(0.7m3)', '先行工程': '根切り(1F部分)', '天候影響': '雨天可', 'ガントチャート表示': true }},
    { fields: { '中工程番号': 'M1-006', '工事契約番号': 'CNT-001', '小工程名': '基礎配筋(A通り)', '作業内容': 'A通りの基礎鉄筋組立', '作業場所': 'B1F A通り', '予定開始日': new Date('2025-04-01').getTime(), '予定終了日': new Date('2025-04-20').getTime(), '予定数量': 45000, '実績数量': 30000, '単位': 'kg', '進捗率': 67, 'ステータス': '進行中', '担当者': '高橋次郎', '必要人工': 80, '投入人工': 55, '協力会社': '鉄筋工業株式会社', '天候影響': '雨天可', 'ガントチャート表示': true }},
    { fields: { '中工程番号': 'M1-006', '工事契約番号': 'CNT-001', '小工程名': '基礎配筋(B通り)', '作業内容': 'B通りの基礎鉄筋組立', '作業場所': 'B1F B通り', '予定開始日': new Date('2025-04-15').getTime(), '予定終了日': new Date('2025-05-05').getTime(), '予定数量': 45000, '単位': 'kg', '進捗率': 20, 'ステータス': '進行中', '担当者': '高橋次郎', '必要人工': 80, '協力会社': '鉄筋工業株式会社', '先行工程': '基礎配筋(A通り)', '天候影響': '雨天可', 'ガントチャート表示': true }},
    { fields: { '中工程番号': 'M1-006', '工事契約番号': 'CNT-001', '小工程名': '基礎配筋(C通り)', '作業内容': 'C通りの基礎鉄筋組立', '作業場所': 'B1F C通り', '予定開始日': new Date('2025-05-01').getTime(), '予定終了日': new Date('2025-05-15').getTime(), '予定数量': 45000, '単位': 'kg', '進捗率': 0, 'ステータス': '未着手', '担当者': '高橋次郎', '必要人工': 80, '協力会社': '鉄筋工業株式会社', '先行工程': '基礎配筋(B通り)', '天候影響': '雨天可', 'ガントチャート表示': true }},
  ]);
  console.log(`  ✅ 小工程: ${count}件`);

  // 人員配置
  count = await batchCreateRecords(token, appToken, tableIds['30_人員配置'], [
    { fields: { '工事契約番号': 'CNT-001', '社員番号': 'E001', '氏名': '山田太郎', '役割': '現場所長', '配置開始日': new Date('2025-01-15').getTime(), '配置終了日': new Date('2026-09-30').getTime(), '稼働率': 100, 'ステータス': '配置中' }},
    { fields: { '工事契約番号': 'CNT-001', '社員番号': 'E004', '氏名': '高橋次郎', '役割': '工事主任', '配置開始日': new Date('2025-01-15').getTime(), '配置終了日': new Date('2026-09-30').getTime(), '稼働率': 100, 'ステータス': '配置中' }},
    { fields: { '工事契約番号': 'CNT-001', '社員番号': 'E002', '氏名': '佐藤花子', '役割': '品質担当', '配置開始日': new Date('2025-03-01').getTime(), '配置終了日': new Date('2026-09-30').getTime(), '稼働率': 50, 'ステータス': '配置中' }},
  ]);
  console.log(`  ✅ 人員配置: ${count}件`);

  // 機材配置
  count = await batchCreateRecords(token, appToken, tableIds['31_機材配置'], [
    { fields: { '工事契約番号': 'CNT-001', '資機材コード': 'EQ-001', '資機材名': 'バックホー(0.7m3)', '数量': 2, '単位': '台', '配置開始日': new Date('2025-02-01').getTime(), '配置終了日': new Date('2025-06-30').getTime(), '日額': 45000, 'ステータス': '使用中' }},
    { fields: { '工事契約番号': 'CNT-001', '資機材コード': 'EQ-002', '資機材名': 'ラフタークレーン(25t)', '数量': 1, '単位': '台', '配置開始日': new Date('2025-05-01').getTime(), '配置終了日': new Date('2026-01-31').getTime(), '日額': 80000, 'ステータス': '予約中' }},
    { fields: { '工事契約番号': 'CNT-001', '資機材コード': 'EQ-003', '資機材名': 'タワークレーン', '数量': 1, '単位': '基', '配置開始日': new Date('2025-05-15').getTime(), '配置終了日': new Date('2026-06-30').getTime(), 'ステータス': '予約中' }},
  ]);
  console.log(`  ✅ 機材配置: ${count}件`);

  // 協力会社発注
  count = await batchCreateRecords(token, appToken, tableIds['32_協力会社発注'], [
    { fields: { '工事契約番号': 'CNT-001', '協力会社名': '東建工業株式会社', '工種': 'とび・土工', '発注内容': '山留め・根切り工事一式', '発注金額': 85000000, '発注日': new Date('2025-01-20').getTime(), '着工予定日': new Date('2025-02-01').getTime(), '完了予定日': new Date('2025-04-30').getTime(), 'ステータス': '施工中' }},
    { fields: { '工事契約番号': 'CNT-001', '協力会社名': '鉄筋工業株式会社', '工種': '鉄筋', '発注内容': '基礎・躯体配筋工事', '発注金額': 120000000, '発注日': new Date('2025-03-01').getTime(), '着工予定日': new Date('2025-04-01').getTime(), '完了予定日': new Date('2025-12-31').getTime(), 'ステータス': '施工中' }},
    { fields: { '工事契約番号': 'CNT-001', '協力会社名': '株式会社西電設', '工種': '電気', '発注内容': '電気設備工事一式', '発注金額': 180000000, '発注日': new Date('2025-04-01').getTime(), '着工予定日': new Date('2025-06-01').getTime(), '完了予定日': new Date('2026-08-31').getTime(), 'ステータス': '発注済' }},
  ]);
  console.log(`  ✅ 協力会社発注: ${count}件`);

  // 作業日報
  count = await batchCreateRecords(token, appToken, tableIds['40_作業日報'], [
    { fields: { '工事契約番号': 'CNT-001', '日付': new Date('2025-04-14').getTime(), '天候': '晴れ', '気温(最高)': 22, '気温(最低)': 12, '作業可否': '通常作業', '元請人員': 5, '協力会社人員': 28, '合計人員': 33, '本日の作業内容': '根切り工事(B1F)、基礎配筋(A通り)', '本日の進捗': '根切り進捗70%、配筋進捗67%', '明日の予定': '根切り継続、配筋継続', '作成者': '高橋次郎', '承認者': '山田太郎' }},
    { fields: { '工事契約番号': 'CNT-001', '日付': new Date('2025-04-15').getTime(), '天候': '曇り', '気温(最高)': 18, '気温(最低)': 10, '作業可否': '通常作業', '元請人員': 5, '協力会社人員': 30, '合計人員': 35, '本日の作業内容': '根切り工事(B1F)、基礎配筋(A通り・B通り)', '本日の進捗': '根切り進捗75%、A通り配筋完了、B通り開始', '明日の予定': '根切り完了予定、B通り配筋継続', '作成者': '高橋次郎', '承認者': '山田太郎' }},
  ]);
  console.log(`  ✅ 作業日報: ${count}件`);

  // 安全パトロール
  count = await batchCreateRecords(token, appToken, tableIds['50_安全パトロール'], [
    { fields: { '工事契約番号': 'CNT-001', '実施日': new Date('2025-04-10').getTime(), 'パトロール種別': '週間パトロール', '実施者': '山田太郎', '総合評価': '良好', '整理整頓': '○', '安全通路': '○', '足場・開口部': '○', '保護具着用': '◎', '重機・車両': '○', '指摘事項': '資材置場の整理整頓をより徹底すること', '是正期限': new Date('2025-04-12').getTime() }},
  ]);
  console.log(`  ✅ 安全パトロール: ${count}件`);

  // KY活動記録
  count = await batchCreateRecords(token, appToken, tableIds['51_KY活動記録'], [
    { fields: { '工事契約番号': 'CNT-001', '実施日': new Date('2025-04-15').getTime(), '作業班': '根切り班', '職長': '東建 職長A', '参加人数': 8, '作業内容': 'B1F根切り掘削', '作業場所': 'B1F中央部', '想定される危険': '①掘削箇所への転落 ②重機との接触', '対策': '①開口部に単管バリケード設置 ②誘導員配置、作業範囲区画', '本日の目標': '安全第一！転落・接触災害ゼロ', '指差呼称項目': '開口部確認ヨシ！重機周囲確認ヨシ！' }},
  ]);
  console.log(`  ✅ KY活動記録: ${count}件`);

  // 検査記録
  count = await batchCreateRecords(token, appToken, tableIds['60_検査記録'], [
    { fields: { '工事契約番号': 'CNT-001', '検査日': new Date('2025-04-10').getTime(), '検査種別': '自主検査', '検査項目': '基礎配筋検査', '検査箇所': 'A通り基礎', '検査基準': '配筋図通り、かぶり厚60mm以上', '測定値': 'かぶり厚65mm', '判定': '合格', '検査員': '高橋次郎', '立会者': '発注者 田中', '写真': null }},
  ]);
  console.log(`  ✅ 検査記録: ${count}件`);

  // 実行予算
  count = await batchCreateRecords(token, appToken, tableIds['70_実行予算'], [
    { fields: { '工事契約番号': 'CNT-001', '費目': '外注費', '工種': 'とび・土工', '内訳': '山留め・根切り工事', '数量': 1, '単位': '式', '単価': 85000000, '予算金額': 85000000, '発注済金額': 85000000, '消化率': 100 }},
    { fields: { '工事契約番号': 'CNT-001', '費目': '外注費', '工種': '鉄筋', '内訳': '基礎・躯体配筋', '数量': 1, '単位': '式', '単価': 120000000, '予算金額': 120000000, '発注済金額': 120000000, '消化率': 100 }},
    { fields: { '工事契約番号': 'CNT-001', '費目': '機械経費', '工種': '重機', '内訳': 'バックホー・クレーン等', '数量': 1, '単位': '式', '予算金額': 50000000, '発注済金額': 15000000, '消化率': 30 }},
    { fields: { '工事契約番号': 'CNT-001', '費目': '材料費', '工種': 'コンクリート', '内訳': '基礎・躯体コンクリート', '数量': 15000, '単位': 'm3', '単価': 18000, '予算金額': 270000000, '発注済金額': 0, '消化率': 0 }},
  ]);
  console.log(`  ✅ 実行予算: ${count}件`);

  console.log('\n✅ サンプルデータ投入完了\n');
}

// ========================================
// メイン処理
// ========================================

async function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('  🏗️  Miyabi Agent 全能力解放 - 建設業版Lark Base 完全版');
  console.log('═'.repeat(70) + '\n');

  const startTime = Date.now();

  try {
    // 認証
    console.log('🔑 認証中...');
    const token = await getAccessToken();
    console.log('✅ 認証成功\n');

    // Base作成
    console.log('📦 Base作成中...');
    const { appToken, url } = await createBase(token, '建設業工事管理システム');
    console.log(`✅ Base作成完了: ${url}\n`);

    // テーブル作成
    console.log('📊 テーブル作成中 (全' + TABLES.length + 'テーブル)...\n');
    const tableIds: Record<string, string> = {};

    for (const table of TABLES) {
      const tableId = await createTable(token, appToken, table);
      tableIds[table.name] = tableId;
      console.log(`  ✅ ${table.name}: ${tableId}`);

      // ガントチャートビュー作成（工程管理テーブル）
      if (table.name.includes('工程管理')) {
        await createView(token, appToken, tableId, 'ガントチャート', 'gantt');
        console.log(`     📊 ガントチャートビュー追加`);
      }
    }
    console.log('\n✅ 全テーブル作成完了');

    // サンプルデータ投入
    await insertSampleData(token, appToken, tableIds);

    // .env更新
    console.log('💾 .env更新中...');
    let newEnvContent = `# =============================================
# 建設業版Lark Base - 自動生成設定
# Generated by Miyabi Agent at ${new Date().toISOString()}
# =============================================

# Lark API認証情報
LARK_APP_ID=${LARK_APP_ID}
LARK_APP_SECRET=${LARK_APP_SECRET}

# Base App Token
LARK_BASE_APP_TOKEN=${appToken}
LARK_BASE_URL=${url}

# テーブルID
`;
    Object.entries(tableIds).forEach(([name, id]) => {
      const key = name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
      newEnvContent += `LARK_TABLE_${key}=${id}\n`;
    });

    writeFileSync(envPath, newEnvContent, 'utf-8');
    console.log('✅ .env更新完了\n');

    // 完了レポート
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('═'.repeat(70));
    console.log('  ✨ 建設業版Lark Base 完全版 - セットアップ完了！');
    console.log('═'.repeat(70));
    console.log(`
📎 Base URL: ${url}
📦 App Token: ${appToken}
⏱️  実行時間: ${elapsed}秒

📋 作成されたテーブル: ${TABLES.length}個
`);
    console.log('【マスタテーブル】');
    console.log('  01_発注者マスタ      - 発注者情報の管理');
    console.log('  02_資格者マスタ      - 社員・資格情報の管理');
    console.log('  03_協力会社マスタ    - 協力会社情報の管理');
    console.log('  04_資機材マスタ      - 機材・設備の管理');
    console.log('  05_工種マスタ        - 工種の標準化');
    console.log('');
    console.log('【案件・契約管理】');
    console.log('  10_案件情報          - 受注前の案件追跡');
    console.log('  11_工事契約          - 契約情報の管理');
    console.log('');
    console.log('【工程管理（3階層WBS）】');
    console.log('  20_大工程            - プロジェクト全体の工程');
    console.log('  21_中工程            - 工種別の工程');
    console.log('  22_小工程            - 日々の作業単位 ★ガントチャート対応');
    console.log('');
    console.log('【リソース配置】');
    console.log('  30_人員配置          - 人員の配置管理');
    console.log('  31_機材配置          - 機材の配置管理');
    console.log('  32_協力会社発注      - 外注管理');
    console.log('');
    console.log('【日報・進捗】');
    console.log('  40_作業日報          - 日次報告');
    console.log('  41_日報_作業詳細     - 作業明細');
    console.log('');
    console.log('【安全管理】');
    console.log('  50_安全パトロール    - パトロール記録');
    console.log('  51_KY活動記録        - 危険予知活動');
    console.log('  52_事故・災害記録    - 事故記録');
    console.log('');
    console.log('【品質管理】');
    console.log('  60_検査記録          - 検査記録');
    console.log('');
    console.log('【原価管理】');
    console.log('  70_実行予算          - 予算管理');
    console.log('  71_出来高管理        - 出来高追跡');
    console.log('');
    console.log('═'.repeat(70));
    console.log('');
    console.log('🎉 ブラウザで Base を開いてください！');
    console.log(`   ${url}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ エラー:', (error as Error).message);
    process.exit(1);
  }
}

main();
