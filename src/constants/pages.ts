/**
 * Static page placeholder content (Japanese).
 * Company/Contact/Privacy/Terms copy is placeholder only — to be reviewed
 * against real business/legal information before production launch.
 */

export const COMPANY_PAGE = {
  hero: {
    title: "運営会社",
    description: "ENGINEER MATCHを運営する会社の概要をご紹介します。",
  },
  overviewNote: "",
  overview: {
    label: "COMPANY",
    title: "会社概要",
    items: [
      { label: "会社名", value: "株式会社GAKUSAI" },
      { label: "設立", value: "2023年3月16日" },
      { label: "代表者", value: "代表取締役　前田 美香" },
      { label: "資本金", value: "6,300万円" },
      {
        label: "事業内容",
        value:
          "研修事業、産学連携事業、事業支援事業、人材支援事業、有料職業紹介事業（13-ユ-315843）、労働者派遣事業（派13-316932）",
      },
      {
        label: "所在地",
        value: "東京都中央区新川1-6-11　ニューリバータワーB1",
      },
      { label: "電話番号", value: "03-5244-9450" },
    ],
  },
  missionVision: {
    label: "MISSION & VISION",
    title: "私たちが目指すもの",
    mission: {
      title: "Mission",
      body: "スキルと機会を、正しくつなぐ。\nエンジニア一人ひとりの強みが正当に評価され、\n最適な仕事と出会える社会をつくります。",
    },
    vision: {
      title: "Vision",
      body: "エンジニアと企業が、\n仲介を挟まずフェアに向き合える\nマッチングのスタンダードになる。",
    },
  },
  business: {
    label: "BUSINESS",
    title: "事業内容",
    items: [
      {
        title: "マッチングプラットフォーム事業",
        description:
          "エンジニアとIT企業を直接つなぐマッチングプラットフォーム「ENGINEER MATCH」の企画・開発・運営を行っています。",
      },
      {
        title: "エンジニア向けキャリア支援",
        description:
          "スキルの見える化やキャリア相談を通じて、エンジニアの転職・案件探しを支援しています。",
      },
      {
        title: "IT企業向け採用支援",
        description:
          "求人・案件掲載からスキル検索、応募者管理まで、企業の採用活動をサポートしています。",
      },
    ],
  },
  cta: {
    title: "ご不明な点がございましたら",
    description: "サービスに関するご質問・お問い合わせはこちらから承っております。",
    buttonLabel: "お問い合わせはこちら",
    href: "/contact",
  },
} as const;

/**
 * Confirmed pricing (review #6): 求人者（企業） pay a flat monthly
 * subscription; 求職者（エンジニア） are always free. No other fees,
 * features, or contract terms have been confirmed, so none are stated here
 * beyond these two figures.
 */
export const PRICING_PAGE = {
  hero: {
    title: "料金プラン",
    description: "ENGINEER MATCHの料金についてご案内します。",
  },
  section: {
    label: "PRICING",
    title: "シンプルな料金体系",
    description: "求職者は登録・ご利用無料、求人者は月額制のサブスクリプションでご利用いただけます。",
  },
  plans: [
    {
      icon: "building2",
      audience: "求人者（企業）の方",
      price: "10,000",
      priceSuffix: "円／月（税別）",
      billingLabel: "サブスクリプション",
      note: "月額のサブスクリプションでご利用いただけます。",
      highlighted: true,
    },
    {
      icon: "usersRound",
      audience: "求職者（エンジニア）の方",
      price: "0",
      priceSuffix: "円",
      billingLabel: null,
      note: "登録・求人検索は無料でご利用いただけます。",
      highlighted: false,
    },
  ],
  cta: {
    title: "ご不明な点がございましたら",
    description: "料金に関するご質問はお問い合わせよりお気軽にご連絡ください。",
    buttonLabel: "お問い合わせはこちら",
    href: "/contact",
  },
} as const;

export const CONTACT_PAGE = {
  hero: {
    title: "お問い合わせ",
    description:
      "サービスに関するご質問・ご相談は、以下のフォームよりお気軽にお問い合わせください。",
  },
  formNote: "※ 現在このフォームはデモ表示のため、送信機能は実装されていません。",
  submittedMessage: "送信内容を受け付けました（デモ表示のため実際には送信されません）。",
  form: {
    companyName: {
      label: "会社名",
      placeholder: "株式会社サンプル",
      required: false,
    },
    name: {
      label: "お名前",
      placeholder: "山田 太郎",
      required: true,
    },
    email: {
      label: "メールアドレス",
      placeholder: "example@company.co.jp",
      required: true,
    },
    inquiryType: {
      label: "お問い合わせ種別",
      options: [
        "サービスについて",
        "導入のご相談",
        "取材・提携について",
        "その他",
      ],
    },
    message: {
      label: "お問い合わせ内容",
      placeholder: "お問い合わせ内容をご記入ください。",
      required: true,
    },
    submitLabel: "送信する",
  },
} as const;

export const PRIVACY_PAGE = {
  title: "プライバシーポリシー",
  updatedAt: "最終更新日：2026年7月15日",
  intro:
    "株式会社エンジニアマッチ（以下「当社」といいます）は、当社が提供するマッチングプラットフォーム「ENGINEER MATCH」（以下「本サービス」といいます）における、ユーザーの個人情報の取り扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。",
  sections: [
    {
      heading: "第1条（個人情報）",
      body: "「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報、および容貌、指紋、声紋にかかるデータ、健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報（個人識別情報）を指します。",
    },
    {
      heading: "第2条（取得する情報）",
      body: "当社は、ユーザーが本サービスの利用登録をする際に、氏名、メールアドレス、生年月日、スキル・職務経歴等の情報をお尋ねすることがあります。また、本サービスの利用状況に関する情報を、Cookie等の技術を用いて取得する場合があります。",
    },
    {
      heading: "第3条（利用目的）",
      body: "当社は、取得した個人情報を、本サービスの提供・運営、ユーザー本人確認、お問い合わせへの対応、利用規約に違反したユーザーへの対応、本サービスの改善・新機能の開発のために利用します。",
    },
    {
      heading: "第4条（第三者提供）",
      body: "当社は、法令に基づく場合を除き、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、業務委託先に対して、利用目的の達成に必要な範囲内で個人情報を提供する場合があります。",
    },
    {
      heading: "第5条（個人情報の管理）",
      body: "当社は、個人情報の漏えい、滅失または毀損の防止その他の個人情報の安全管理のために必要かつ適切な措置を講じます。",
    },
    {
      heading: "第6条（開示・訂正・削除等の請求）",
      body: "ユーザーは、当社の定める手続きに従い、当社に対して自己の個人情報の開示、訂正、追加、削除、利用停止を請求することができます。請求方法は本ポリシー末尾のお問い合わせ窓口までご連絡ください。",
    },
    {
      heading: "第7条（本ポリシーの変更）",
      body: "当社は、必要と判断した場合には、ユーザーに通知することなく本ポリシーを変更することがあります。変更後のプライバシーポリシーは、本サービス上に掲載した時点から効力を生じるものとします。",
    },
    {
      heading: "第8条（お問い合わせ窓口）",
      body: "本ポリシーに関するお問い合わせは、下記お問い合わせフォームよりご連絡ください。",
    },
  ],
} as const;

export const TERMS_PAGE = {
  title: "利用規約",
  updatedAt: "最終更新日：2026年7月15日",
  intro:
    "この利用規約（以下「本規約」といいます）は、株式会社エンジニアマッチ（以下「当社」といいます）が提供するマッチングプラットフォーム「ENGINEER MATCH」（以下「本サービス」といいます）の利用条件を定めるものです。登録ユーザーの皆さまには、本規約に従って本サービスをご利用いただきます。",
  sections: [
    {
      heading: "第1条（適用）",
      body: "本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されるものとします。",
    },
    {
      heading: "第2条（利用登録）",
      body: "登録希望者が当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。当社は、利用登録の申請に際して虚偽の事項を届け出た場合など、当社が利用登録を相当でないと判断した場合、利用登録の申請を承認しないことがあります。",
    },
    {
      heading: "第3条（禁止事項）",
      body: "ユーザーは、本サービスの利用にあたり、法令または公序良俗に違反する行為、犯罪行為に関連する行為、当社や第三者の知的財産権・プライバシーを侵害する行為、本サービスの運営を妨害する行為をしてはなりません。",
    },
    {
      heading: "第4条（本サービスの提供の停止等）",
      body: "当社は、システムの保守点検・更新を行う場合、地震・落雷・火災等の不可抗力により本サービスの提供が困難となった場合、その他当社が本サービスの提供が困難と判断した場合には、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。",
    },
    {
      heading: "第5条（免責事項）",
      body: "当社は、本サービスに事実上または法律上の瑕疵がないことを明示的にも黙示的にも保証しておりません。当社は、本サービスに起因してユーザーに生じたあらゆる損害について、当社の故意または重過失による場合を除き、一切の責任を負いません。",
    },
    {
      heading: "第6条（サービス内容の変更等）",
      body: "当社は、ユーザーに通知することなく、本サービスの内容を変更し、または本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。",
    },
    {
      heading: "第7条（利用規約の変更）",
      body: "当社は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。変更後の利用規約は、本サービス上に掲載した時点から効力を生じるものとします。",
    },
    {
      heading: "第8条（準拠法・裁判管轄）",
      body: "本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。",
    },
  ],
} as const;
