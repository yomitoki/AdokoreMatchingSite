/*
  =====================================================================
  アドコレ対戦マッチング - サーバー側スクリプト（Google Apps Script）

  ■ 設定値（Discord Webhook URL・カレンダーID など）について
    秘密情報をコードに書かないよう、スプレッドシートの「設定」シートから読み込みます。
    設定の変更はスプレッドシートを直接編集するだけです（スクリプトの実行は不要）。

    シートの構成（設定セットごとに1シート。使うシートの名前を「設定」シートに書きます）:

      「設定」シート
            A列            B列
        1   使用する設定    設定_本番        ← ここを「設定_テスト」にするとテスト用に切り替わる

      「設定_本番」シート（「設定_テスト」も同じ形）
            A列                      B列        C列
        1   項目                     値         説明
        2   dataSheetId              （空欄）   待機データなどを置くスプレッドシート。空欄ならこのスプレッドシート
        3   calendarId               …
        4   eventWebhookUrl          …
        5〜 webhook_環境_バージョン   …

    ・切り替えは最大1分で反映されます。
    ・設定セットを増やすときは、シートを「コピーを作成」して名前を変え、その名前を「設定」の B1 に書きます。

    注意:
      「設定」シートはスプレッドシートを共有している人なら誰でも見られます。
      スプレッドシートの共有は「制限付き」（運営メンバーのみ）にしてください。
  =====================================================================
*/

// 「設定」シートがあるスプレッドシートのID
const SETTINGS_SPREADSHEET_ID = '1D7luwGuHJBZkg1Qm0yTHh3eogzhIocfhIcI_GKh0xT0';

var rulearray = [
      //ゲームタイプ,バージョン,ルール名,隠しフラグ名,ネットワーク設定[1-5],カジュアル/ランク[],練習[]\本番, シングル[]/トリプル, 改造あり[]/改造なし,省略名称
["Switch","exe1",'ランク(S↑) [ワールドワイド]','Switch_exe1_hidden1',"1","True","True","True","False",'ランク(S↑)'],
["Switch","exe1",'ランク(A↓) [ワールドワイド]','Switch_exe1_hidden6',"1","True","True","True","False",'ランク(A↓)'],
["Switch","exe1",'カジュアル(制限なし) [ワールドワイド]','Switch_exe1_hidden2',"1","False","True","True","False",'カジュアル(制限なし)'],
["Switch","exe1",'カジュアル(制限あり) [アジア/オセアニア]','Switch_exe1_hidden3',"5","False","True","True","False",'カジュアル(制限あり)'],
["Switch","exe1",'特殊ルール [ヨーロッパ]','Switch_exe1_hidden4',"4",,,,,'特殊ルール'],
["Switch","exe1",'その他 [その他]','Switch_exe1_hidden5',"6",,,,,'その他'],

["Steam","exe1",'ランク(S↑) [ワールドワイド]','Steam_exe1_hidden1',"1","True","True","True","False",'ランク(S↑)'],
["Steam","exe1",'ランク(A↓) [ワールドワイド]','Steam_exe1_hidden6',"1","True","True","True","False",'ランク(A↓)'],
["Steam","exe1",'カジュアル(制限なし) [ワールドワイド]','Steam_exe1_hidden2',"1","False","True","True","False",'カジュアル(制限なし)'],
["Steam","exe1",'カジュアル(制限あり) [アジア/オセアニア]','Steam_exe1_hidden3',"5","False","True","True","False",'カジュアル(制限あり)'],
["Steam","exe1",'特殊ルール [ヨーロッパ]','Steam_exe1_hidden4',"4",,,,,'特殊ルール'],
["Steam","exe1",'その他 [その他]','Steam_exe1_hidden5',"6",,,,,'その他'],

["PS4/PS5","exe1",'ランク(S↑) [ワールドワイド]','PS4/PS5_exe1_hidden1',"1","True","True","True","False",'ランク(S↑)'],
["PS4/PS5","exe1",'ランク(A↓) [ワールドワイド]','PS4/PS5_exe1_hidden6',"1","True","True","True","False",'ランク(A↓)'],
["PS4/PS5","exe1",'カジュアル(制限なし) [ワールドワイド]','PS4/PS5_exe1_hidden2',"1","False","True","True","False",'カジュアル(制限なし)'],
["PS4/PS5","exe1",'カジュアル(制限あり) [アジア/オセアニア]','PS4/PS5_exe1_hidden3',"5","False","True","True","False",'カジュアル(制限あり)'],
["PS4/PS5","exe1",'特殊ルール [ヨーロッパ]','PS4/PS5_exe1_hidden4',"4",,,,,'特殊ルール'],
["PS4/PS5","exe1",'その他 [その他]','PS4/PS5_exe1_hidden5',"6",,,,,'その他'],

["Switch","exe2",'ランク(S↑) [ワールドワイド]','Switch_exe2_hidden1',"1","True","True","True","False",'ランク(S↑)'],
["Switch","exe2",'ランク(A↓) [ワールドワイド]','Switch_exe2_hidden6',"1","True","True","True","False",'ランク(A↓)'],
["Switch","exe2",'カジュアル(制限なし) [ワールドワイド]','Switch_exe2_hidden2',"1","False","True","True","False",'カジュアル(制限なし)'],
["Switch","exe2",'カジュアル(制限あり) [アジア/オセアニア]','Switch_exe2_hidden3',"5","False","True","True","False",'カジュアル(制限あり)'],
["Switch","exe2",'カジュアル本番(制限なし) [ワールドワイド]','Switch_exe2_hidden7',"1","False","False","True","False",'カジュアル本番(制限なし)'],
["Switch","exe2",'特殊ルール [ヨーロッパ]','Switch_exe2_hidden4',"4",,,,,'特殊ルール'],
["Switch","exe2",'その他 [その他]','Switch_exe2_hidden5',"6",,,,,'その他'],

["Steam","exe2",'ランク(S↑) [ワールドワイド]','Steam_exe2_hidden1',"1","True","True","True","False",'ランク(S↑)'],
["Steam","exe2",'ランク(A↓) [ワールドワイド]','Steam_exe2_hidden6',"1","True","True","True","False",'ランク(A↓)'],
["Steam","exe2",'カジュアル(制限なし) [ワールドワイド]','Steam_exe2_hidden2',"1","False","True","True","False",'カジュアル(制限なし)'],
["Steam","exe2",'カジュアル(制限あり) [アジア/オセアニア]','Steam_exe2_hidden3',"5","False","True","True","False",'カジュアル(制限あり)'],
["Steam","exe2",'カジュアル本番(制限なし) [ワールドワイド]','Steam_exe2_hidden7',"1","False","False","True","False",'カジュアル本番(制限なし)'],
["Steam","exe2",'特殊ルール [ヨーロッパ]','Steam_exe2_hidden4',"4",,,,,'特殊ルール'],
["Steam","exe2",'その他 [その他]','Steam_exe2_hidden5',"6",,,,,'その他'],

["PS4/PS5","exe2",'ランク(S↑) [ワールドワイド]','PS4/PS5_exe2_hidden1',"1","True","True","True","False",'ランク(S↑)'],
["PS4/PS5","exe2",'ランク(A↓) [ワールドワイド]','PS4/PS5_exe2_hidden6',"1","True","True","True","False",'ランク(A↓)'],
["PS4/PS5","exe2",'カジュアル(制限なし) [ワールドワイド]','PS4/PS5_exe2_hidden2',"1","False","True","True","False",'カジュアル(制限なし)'],
["PS4/PS5","exe2",'カジュアル(制限あり) [アジア/オセアニア]','PS4/PS5_exe2_hidden3',"5","False","True","True","False",'カジュアル(制限あり)'],
["PS4/PS5","exe2",'カジュアル本番(制限なし) [ワールドワイド]','PS4/PS5_exe2_hidden7',"1","False","False","True","False",'カジュアル本番(制限なし)'],
["PS4/PS5","exe2",'特殊ルール [ヨーロッパ]','PS4/PS5_exe2_hidden4',"4",,,,,'特殊ルール'],
["PS4/PS5","exe2",'その他 [その他]','PS4/PS5_exe2_hidden5',"6",,,,,'その他'],

["Switch","exe3",'ランク(S↑) [ワールドワイド]','Switch_exe3_hidden1',"1","True","True","True","False",'ランク(S↑)'],
["Switch","exe3",'ランク(A↓) [ワールドワイド]','Switch_exe3_hidden6',"1","True","True","True","False",'ランク(A↓)'],
["Switch","exe3",'カジュアル(制限なし) [ワールドワイド]','Switch_exe3_hidden2',"1","False","True","True","False",'カジュアル(制限なし)'],
["Switch","exe3",'カジュアル(制限あり) [アジア/オセアニア]','Switch_exe3_hidden3',"5","False","True","True","False",'カジュアル(制限あり)'],
["Switch","exe3",'カジュアル本番(制限なし) [ワールドワイド]','Switch_exe3_hidden7',"1","False","False","True","False",'カジュアル本番(制限なし)'],
["Switch","exe3",'特殊ルール [ヨーロッパ]','Switch_exe3_hidden4',"4",,,,,'特殊ルール'],
["Switch","exe3",'その他 [その他]','Switch_exe3_hidden5',"6",,,,,'その他'],

["Steam","exe3",'ランク(S↑) [ワールドワイド]','Steam_exe3_hidden1',"1","True","True","True","False",'ランク(S↑)'],
["Steam","exe3",'ランク(A↓) [ワールドワイド]','Steam_exe3_hidden6',"1","True","True","True","False",'ランク(A↓)'],
["Steam","exe3",'カジュアル(制限なし) [ワールドワイド]','Steam_exe3_hidden2',"1","False","True","True","False",'カジュアル(制限なし)'],
["Steam","exe3",'カジュアル(制限あり) [アジア/オセアニア]','Steam_exe3_hidden3',"5","False","True","True","False",'カジュアル(制限あり)'],
["Steam","exe3",'カジュアル本番(制限なし) [ワールドワイド]','Steam_exe3_hidden7',"1","False","False","True","False",'カジュアル本番(制限なし)'],
["Steam","exe3",'特殊ルール [ヨーロッパ]','Steam_exe3_hidden4',"4",,,,,'特殊ルール'],
["Steam","exe3",'その他 [その他]','Steam_exe3_hidden5',"6",,,,,'その他'],

["PS4/PS5","exe3",'ランク(S↑) [ワールドワイド]','PS4/PS5_exe3_hidden1',"1","True","True","True","False",'ランク(S↑)'],
["PS4/PS5","exe3",'ランク(A↓) [ワールドワイド]','PS4/PS5_exe3_hidden6',"1","True","True","True","False",'ランク(A↓)'],
["PS4/PS5","exe3",'カジュアル(制限なし) [ワールドワイド]','PS4/PS5_exe3_hidden2',"1","False","True","True","False",'カジュアル(制限なし)'],
["PS4/PS5","exe3",'カジュアル(制限あり) [アジア/オセアニア]','PS4/PS5_exe3_hidden3',"5","False","True","True","False",'カジュアル(制限あり)'],
["PS4/PS5","exe3",'カジュアル本番(制限なし) [ワールドワイド]','PS4/PS5_exe3_hidden7',"1","False","False","True","False",'カジュアル本番(制限なし)'],
["PS4/PS5","exe3",'特殊ルール [ヨーロッパ]','PS4/PS5_exe3_hidden4',"4",,,,,'特殊ルール'],
["PS4/PS5","exe3",'その他 [その他]','PS4/PS5_exe3_hidden5',"6",,,,,'その他'],

["Switch","exe4",'ランク(S↑) 改造なし [ワールドワイド]','Switch_exe4_hidden1',"1","True","True","True","False",'ランク(S↑)改造なし'],
["Switch","exe4",'ランク(A↓) 改造なし [ワールドワイド]','Switch_exe4_hidden9',"1","True","True","True","False",'ランク(A↓)改造なし'],
["Switch","exe4",'ランク(S↑) 改造あり [ワールドワイド]','Switch_exe4_hidden2',"1","True","True","True","True",'ランク(S↑)改造あり'],
["Switch","exe4",'ランク(A↓) 改造あり [ワールドワイド]','Switch_exe4_hidden10',"1","True","True","True","True",'ランク(A↓)改造あり'],
["Switch","exe4",'カジュアル(制限なし) 改造なし [ワールドワイド]','Switch_exe4_hidden3',"1","False","True","True","False",'カジュアル(制限なし)改造なし'],
["Switch","exe4",'カジュアル(制限なし) 改造あり [ワールドワイド]','Switch_exe4_hidden4',"1","False","True","True","True",'カジュアル(制限なし)改造あり'],
["Switch","exe4",'カジュアル(制限あり) 改造なし [アジア/オセアニア]','Switch_exe4_hidden5',"5","False","True","True","False",'カジュアル(制限あり)改造なし'],
["Switch","exe4",'カジュアル(制限あり) 改造あり [アジア/オセアニア]','Switch_exe4_hidden6',"5","False","True","True","True",'カジュアル(制限あり)改造あり'],
["Switch","exe4",'特殊ルール [ヨーロッパ]','Switch_exe4_hidden7',"4",,,,,'特殊ルール'],
["Switch","exe4",'その他 [その他]','Switch_exe4_hidden8',"6",,,,,'その他'],

["Steam","exe4",'ランク(S↑) 改造なし [ワールドワイド]','Steam_exe4_hidden1',"1","True","True","True","False",'ランク(S↑)改造なし'],
["Steam","exe4",'ランク(A↓) 改造なし [ワールドワイド]','Steam_exe4_hidden9',"1","True","True","True","False",'ランク(A↓)改造なし'],
["Steam","exe4",'ランク(S↑) 改造あり [ワールドワイド]','Steam_exe4_hidden2',"1","True","True","True","True",'ランク(S↑)改造あり'],
["Steam","exe4",'ランク(A↓) 改造あり [ワールドワイド]','Steam_exe4_hidden10',"1","True","True","True","True",'ランク(A↓)改造あり'],
["Steam","exe4",'カジュアル(制限なし) 改造なし [ワールドワイド]','Steam_exe4_hidden3',"1","False","True","True","False",'カジュアル(制限なし)改造なし'],
["Steam","exe4",'カジュアル(制限なし) 改造あり [ワールドワイド]','Steam_exe4_hidden4',"1","False","True","True","True",'カジュアル(制限なし)改造あり'],
["Steam","exe4",'カジュアル(制限あり) 改造なし [アジア/オセアニア]','Steam_exe4_hidden5',"5","False","True","True","False",'カジュアル(制限あり)改造なし'],
["Steam","exe4",'カジュアル(制限あり) 改造あり [アジア/オセアニア]','Steam_exe4_hidden6',"5","False","True","True","True",'カジュアル(制限あり)改造あり'],
["Steam","exe4",'特殊ルール [ヨーロッパ]','Steam_exe4_hidden7',"4",,,,,'特殊ルール'],
["Steam","exe4",'その他 [その他]','Steam_exe4_hidden8',"6",,,,,'その他'],

["PS4/PS5","exe4",'ランク(S↑) 改造なし [ワールドワイド]','PS4/PS5_exe4_hidden1',"1","True","True","True","False",'ランク(S↑)改造なし'],
["PS4/PS5","exe4",'ランク(A↓) 改造なし [ワールドワイド]','PS4/PS5_exe4_hidden9',"1","True","True","True","False",'ランク(A↓)改造なし'],
["PS4/PS5","exe4",'ランク(S↑) 改造あり [ワールドワイド]','PS4/PS5_exe4_hidden2',"1","True","True","True","True",'ランク(S↑)改造あり'],
["PS4/PS5","exe4",'ランク(A↓) 改造あり [ワールドワイド]','PS4/PS5_exe4_hidden10',"1","True","True","True","True",'ランク(A↓)改造あり'],
["PS4/PS5","exe4",'カジュアル(制限なし) 改造なし [ワールドワイド]','PS4/PS5_exe4_hidden3',"1","False","True","True","False",'カジュアル(制限なし)改造なし'],
["PS4/PS5","exe4",'カジュアル(制限なし) 改造あり [ワールドワイド]','PS4/PS5_exe4_hidden4',"1","False","True","True","True",'カジュアル(制限なし)改造あり'],
["PS4/PS5","exe4",'カジュアル(制限あり) 改造なし [アジア/オセアニア]','PS4/PS5_exe4_hidden5',"5","False","True","True","False",'カジュアル(制限あり)改造なし'],
["PS4/PS5","exe4",'カジュアル(制限あり) 改造あり [アジア/オセアニア]','PS4/PS5_exe4_hidden6',"5","False","True","True","True",'カジュアル(制限あり)改造あり'],
["PS4/PS5","exe4",'特殊ルール [ヨーロッパ]','PS4/PS5_exe4_hidden7',"4",,,,,'特殊ルール'],
["PS4/PS5","exe4",'その他 [その他]','PS4/PS5_exe4_hidden8',"6",,,,,'その他'],

["Switch","exe5",'ランク(S↑) 改造なし [ワールドワイド]','Switch_exe5_hidden1',"1","True","True","True","False",'ランク(S↑)改造なし'],
["Switch","exe5",'ランク(A↓) 改造なし [ワールドワイド]','Switch_exe5_hidden9',"1","True","True","True","False",'ランク(A↓)改造なし'],
["Switch","exe5",'ランク(S↑) 改造あり [ワールドワイド]','Switch_exe5_hidden2',"1","True","True","True","True",'ランク(S↑)改造あり'],
["Switch","exe5",'ランク(A↓) 改造あり [ワールドワイド]','Switch_exe5_hidden10',"1","True","True","True","True",'ランク(A↓)改造あり'],
["Switch","exe5",'カジュアル(制限なし) 改造なし [ワールドワイド]','Switch_exe5_hidden3',"1","False","True","True","False",'カジュアル(制限なし)改造なし'],
["Switch","exe5",'カジュアル(制限なし) 改造あり [ワールドワイド]','Switch_exe5_hidden4',"1","False","True","True","True",'カジュアル(制限なし)改造あり'],
["Switch","exe5",'カジュアル(制限あり) 改造なし [アジア/オセアニア]','Switch_exe5_hidden5',"5","False","True","True","False",'カジュアル(制限あり)改造なし'],
["Switch","exe5",'カジュアル(制限あり) 改造あり [アジア/オセアニア]','Switch_exe5_hidden6',"5","False","True","True","True",'カジュアル(制限あり)改造あり'],
["Switch","exe5",'特殊ルール [ヨーロッパ]','Switch_exe5_hidden7',"4",,,,,'特殊ルール'],
["Switch","exe5",'その他 [その他]','Switch_exe5_hidden8',"6",,,,,'その他'],

["Steam","exe5",'ランク(S↑) 改造なし [ワールドワイド]','Steam_exe5_hidden1',"1","True","True","True","False",'ランク(S↑)改造なし'],
["Steam","exe5",'ランク(A↓) 改造なし [ワールドワイド]','Steam_exe5_hidden9',"1","True","True","True","False",'ランク(A↓)改造なし'],
["Steam","exe5",'ランク(S↑) 改造あり [ワールドワイド]','Steam_exe5_hidden2',"1","True","True","True","True",'ランク(S↑)改造あり'],
["Steam","exe5",'ランク(A↓) 改造あり [ワールドワイド]','Steam_exe5_hidden10',"1","True","True","True","True",'ランク(A↓)改造あり'],
["Steam","exe5",'カジュアル(制限なし) 改造なし [ワールドワイド]','Steam_exe5_hidden3',"1","False","True","True","False",'カジュアル(制限なし)改造なし'],
["Steam","exe5",'カジュアル(制限なし) 改造あり [ワールドワイド]','Steam_exe5_hidden4',"1","False","True","True","True",'カジュアル(制限なし)改造あり'],
["Steam","exe5",'カジュアル(制限あり) 改造なし [アジア/オセアニア]','Steam_exe5_hidden5',"5","False","True","True","False",'カジュアル(制限あり)改造なし'],
["Steam","exe5",'カジュアル(制限あり) 改造あり [アジア/オセアニア]','Steam_exe5_hidden6',"5","False","True","True","True",'カジュアル(制限あり)改造あり'],
["Steam","exe5",'特殊ルール [ヨーロッパ]','Steam_exe5_hidden7',"4",,,,,'特殊ルール'],
["Steam","exe5",'その他 [その他]','Steam_exe5_hidden8',"6",,,,,'その他'],

["PS4/PS5","exe5",'ランク(S↑) 改造なし [ワールドワイド]','PS4/PS5_exe5_hidden1',"1","True","True","True","False",'ランク(S↑)改造なし'],
["PS4/PS5","exe5",'ランク(A↓) 改造なし [ワールドワイド]','PS4/PS5_exe5_hidden9',"1","True","True","True","False",'ランク(A↓)改造なし'],
["PS4/PS5","exe5",'ランク(S↑) 改造あり [ワールドワイド]','PS4/PS5_exe5_hidden2',"1","True","True","True","True",'ランク(S↑)改造あり'],
["PS4/PS5","exe5",'ランク(A↓) 改造あり [ワールドワイド]','PS4/PS5_exe5_hidden10',"1","True","True","True","True",'ランク(A↓)改造あり'],
["PS4/PS5","exe5",'カジュアル(制限なし) 改造なし [ワールドワイド]','PS4/PS5_exe5_hidden3',"1","False","True","True","False",'カジュアル(制限なし)改造なし'],
["PS4/PS5","exe5",'カジュアル(制限なし) 改造あり [ワールドワイド]','PS4/PS5_exe5_hidden4',"1","False","True","True","True",'カジュアル(制限なし)改造あり'],
["PS4/PS5","exe5",'カジュアル(制限あり) 改造なし [アジア/オセアニア]','PS4/PS5_exe5_hidden5',"5","False","True","True","False",'カジュアル(制限あり)改造なし'],
["PS4/PS5","exe5",'カジュアル(制限あり) 改造あり [アジア/オセアニア]','PS4/PS5_exe5_hidden6',"5","False","True","True","True",'カジュアル(制限あり)改造あり'],
["PS4/PS5","exe5",'特殊ルール [ヨーロッパ]','PS4/PS5_exe5_hidden7',"4",,,,,'特殊ルール'],
["PS4/PS5","exe5",'その他 [その他]','PS4/PS5_exe5_hidden8',"6",,,,,'その他'],

["Switch","exe6",'ランク(S↑) 改造なし [ワールドワイド]','Switch_exe6_hidden1',"1","True","True","True","False",'ランク(S↑)改造なし'],
["Switch","exe6",'ランク(A↓) 改造なし [ワールドワイド]','Switch_exe6_hidden9',"1","True","True","True","False",'ランク(A↓)改造なし'],
["Switch","exe6",'ランク(S↑) 改造あり [ワールドワイド]','Switch_exe6_hidden2',"1","True","True","True","True",'ランク(S↑)改造あり'],
["Switch","exe6",'ランク(A↓) 改造あり [ワールドワイド]','Switch_exe6_hidden10',"1","True","True","True","True",'ランク(A↓)改造あり'],
["Switch","exe6",'カジュアル(制限なし) 改造なし [ワールドワイド]','Switch_exe6_hidden3',"1","False","True","True","False",'カジュアル(制限なし)改造なし'],
["Switch","exe6",'カジュアル(制限なし) 改造あり [ワールドワイド]','Switch_exe6_hidden4',"1","False","True","True","True",'カジュアル(制限なし)改造あり'],
["Switch","exe6",'カジュアル(制限あり) 改造なし [アジア/オセアニア]','Switch_exe6_hidden5',"5","False","True","True","False",'カジュアル(制限あり)改造なし'],
["Switch","exe6",'カジュアル(制限あり) 改造あり [アジア/オセアニア]','Switch_exe6_hidden6',"5","False","True","True","True",'カジュアル(制限あり)改造あり'],
["Switch","exe6",'特殊ルール [ヨーロッパ]','Switch_exe6_hidden7',"4",,,,,'特殊ルール'],
["Switch","exe6",'その他 [その他]','Switch_exe6_hidden8',"6",,,,,'その他'],

["Steam","exe6",'ランク(S↑) 改造なし [ワールドワイド]','Steam_exe6_hidden1',"1","True","True","True","False",'ランク(S↑)改造なし'],
["Steam","exe6",'ランク(A↓) 改造なし [ワールドワイド]','Steam_exe6_hidden9',"1","True","True","True","False",'ランク(A↓)改造なし'],
["Steam","exe6",'ランク(S↑) 改造あり [ワールドワイド]','Steam_exe6_hidden2',"1","True","True","True","True",'ランク(S↑)改造あり'],
["Steam","exe6",'ランク(A↓) 改造あり [ワールドワイド]','Steam_exe6_hidden10',"1","True","True","True","True",'ランク(A↓)改造あり'],
["Steam","exe6",'カジュアル(制限なし) 改造なし [ワールドワイド]','Steam_exe6_hidden3',"1","False","True","True","False",'カジュアル(制限なし)改造なし'],
["Steam","exe6",'カジュアル(制限なし) 改造あり [ワールドワイド]','Steam_exe6_hidden4',"1","False","True","True","True",'カジュアル(制限なし)改造あり'],
["Steam","exe6",'カジュアル(制限あり) 改造なし [アジア/オセアニア]','Steam_exe6_hidden5',"5","False","True","True","False",'カジュアル(制限あり)改造なし'],
["Steam","exe6",'カジュアル(制限あり) 改造あり [アジア/オセアニア]','Steam_exe6_hidden6',"5","False","True","True","True",'カジュアル(制限あり)改造あり'],
["Steam","exe6",'特殊ルール [ヨーロッパ]','Steam_exe6_hidden7',"4",,,,,'特殊ルール'],
["Steam","exe6",'その他 [その他]','Steam_exe6_hidden8',"6",,,,,'その他'],

["PS4/PS5","exe6",'ランク(S↑) 改造なし [ワールドワイド]','PS4/PS5_exe6_hidden1',"1","True","True","True","False",'ランク(S↑)改造なし'],
["PS4/PS5","exe6",'ランク(A↓) 改造なし [ワールドワイド]','PS4/PS5_exe6_hidden9',"1","True","True","True","False",'ランク(A↓)改造なし'],
["PS4/PS5","exe6",'ランク(S↑) 改造あり [ワールドワイド]','PS4/PS5_exe6_hidden2',"1","True","True","True","True",'ランク(S↑)改造あり'],
["PS4/PS5","exe6",'ランク(A↓) 改造あり [ワールドワイド]','PS4/PS5_exe6_hidden10',"1","True","True","True","True",'ランク(A↓)改造あり'],
["PS4/PS5","exe6",'カジュアル(制限なし) 改造なし [ワールドワイド]','PS4/PS5_exe6_hidden3',"1","False","True","True","False",'カジュアル(制限なし)改造なし'],
["PS4/PS5","exe6",'カジュアル(制限なし) 改造あり [ワールドワイド]','PS4/PS5_exe6_hidden4',"1","False","True","True","True",'カジュアル(制限なし)改造あり'],
["PS4/PS5","exe6",'カジュアル(制限あり) 改造なし [アジア/オセアニア]','PS4/PS5_exe6_hidden5',"5","False","True","True","False",'カジュアル(制限あり)改造なし'],
["PS4/PS5","exe6",'カジュアル(制限あり) 改造あり [アジア/オセアニア]','PS4/PS5_exe6_hidden6',"5","False","True","True","True",'カジュアル(制限あり)改造あり'],
["PS4/PS5","exe6",'特殊ルール [ヨーロッパ]','PS4/PS5_exe6_hidden7',"4",,,,,'特殊ルール'],
["PS4/PS5","exe6",'その他 [その他]','PS4/PS5_exe6_hidden8',"6",,,,,'その他'],
]; 


  var accessnum = [
    ['Switch','exe1','Switch_exe1_hidden1','button1',0],
    ['Switch','exe1','Switch_exe1_hidden1','button2',0],
    ['Switch','exe1','Switch_exe1_hidden6','button1',0],
    ['Switch','exe1','Switch_exe1_hidden6','button2',0],
    ['Switch','exe1','Switch_exe1_hidden2','button1',0],
    ['Switch','exe1','Switch_exe1_hidden2','button2',0],
    ['Switch','exe1','Switch_exe1_hidden3','button1',0],
    ['Switch','exe1','Switch_exe1_hidden3','button2',0],
    ['Switch','exe1','Switch_exe1_hidden4','button1',0],
    ['Switch','exe1','Switch_exe1_hidden4','button2',0],
    ['Switch','exe1','Switch_exe1_hidden5','button1',0],
    ['Switch','exe1','Switch_exe1_hidden5','button2',0],


    ['Steam','exe1','Steam_exe1_hidden1','button1',0],
    ['Steam','exe1','Steam_exe1_hidden1','button2',0],
    ['Steam','exe1','Steam_exe1_hidden6','button1',0],
    ['Steam','exe1','Steam_exe1_hidden6','button2',0],
    ['Steam','exe1','Steam_exe1_hidden2','button1',0],
    ['Steam','exe1','Steam_exe1_hidden2','button2',0],
    ['Steam','exe1','Steam_exe1_hidden3','button1',0],
    ['Steam','exe1','Steam_exe1_hidden3','button2',0],
    ['Steam','exe1','Steam_exe1_hidden4','button1',0],
    ['Steam','exe1','Steam_exe1_hidden4','button2',0],
    ['Steam','exe1','Steam_exe1_hidden5','button1',0],
    ['Steam','exe1','Steam_exe1_hidden5','button2',0],


    ['PS4/PS5','exe1','PS4/PS5_exe1_hidden1','button1',0],
    ['PS4/PS5','exe1','PS4/PS5_exe1_hidden1','button2',0],
    ['PS4/PS5','exe1','PS4/PS5_exe1_hidden6','button1',0],
    ['PS4/PS5','exe1','PS4/PS5_exe1_hidden6','button2',0],
    ['PS4/PS5','exe1','PS4/PS5_exe1_hidden2','button1',0],
    ['PS4/PS5','exe1','PS4/PS5_exe1_hidden2','button2',0],
    ['PS4/PS5','exe1','PS4/PS5_exe1_hidden3','button1',0],
    ['PS4/PS5','exe1','PS4/PS5_exe1_hidden3','button2',0],
    ['PS4/PS5','exe1','PS4/PS5_exe1_hidden4','button1',0],
    ['PS4/PS5','exe1','PS4/PS5_exe1_hidden4','button2',0],
    ['PS4/PS5','exe1','PS4/PS5_exe1_hidden5','button1',0],
    ['PS4/PS5','exe1','PS4/PS5_exe1_hidden5','button2',0],

    ['Switch','exe2','Switch_exe2_hidden1','button1',0],
    ['Switch','exe2','Switch_exe2_hidden1','button2',0],
    ['Switch','exe2','Switch_exe2_hidden6','button1',0],
    ['Switch','exe2','Switch_exe2_hidden6','button2',0],
    ['Switch','exe2','Switch_exe2_hidden2','button1',0],
    ['Switch','exe2','Switch_exe2_hidden2','button2',0],
    ['Switch','exe2','Switch_exe2_hidden3','button1',0],
    ['Switch','exe2','Switch_exe2_hidden3','button2',0],

    ['Switch','exe2','Switch_exe2_hidden7','button1',0],
    ['Switch','exe2','Switch_exe2_hidden7','button2',0],

    ['Switch','exe2','Switch_exe2_hidden4','button1',0],
    ['Switch','exe2','Switch_exe2_hidden4','button2',0],
    ['Switch','exe2','Switch_exe2_hidden5','button1',0],
    ['Switch','exe2','Switch_exe2_hidden5','button2',0],

    ['Steam','exe2','Steam_exe2_hidden1','button1',0],
    ['Steam','exe2','Steam_exe2_hidden1','button2',0],
    ['Steam','exe2','Steam_exe2_hidden6','button1',0],
    ['Steam','exe2','Steam_exe2_hidden6','button2',0],
    ['Steam','exe2','Steam_exe2_hidden2','button1',0],
    ['Steam','exe2','Steam_exe2_hidden2','button2',0],
    ['Steam','exe2','Steam_exe2_hidden3','button1',0],
    ['Steam','exe2','Steam_exe2_hidden3','button2',0],

    ['Steam','exe2','Steam_exe2_hidden7','button1',0],
    ['Steam','exe2','Steam_exe2_hidden7','button2',0],

    ['Steam','exe2','Steam_exe2_hidden4','button1',0],
    ['Steam','exe2','Steam_exe2_hidden4','button2',0],
    ['Steam','exe2','Steam_exe2_hidden5','button1',0],
    ['Steam','exe2','Steam_exe2_hidden5','button2',0],


    ['PS4/PS5','exe2','PS4/PS5_exe2_hidden1','button1',0],
    ['PS4/PS5','exe2','PS4/PS5_exe2_hidden1','button2',0],
    ['PS4/PS5','exe2','PS4/PS5_exe2_hidden6','button1',0],
    ['PS4/PS5','exe2','PS4/PS5_exe2_hidden6','button2',0],
    ['PS4/PS5','exe2','PS4/PS5_exe2_hidden2','button1',0],
    ['PS4/PS5','exe2','PS4/PS5_exe2_hidden2','button2',0],
    ['PS4/PS5','exe2','PS4/PS5_exe2_hidden3','button1',0],
    ['PS4/PS5','exe2','PS4/PS5_exe2_hidden3','button2',0],

    ['PS4/PS5','exe2','PS4/PS5_exe2_hidden7','button1',0],
    ['PS4/PS5','exe2','PS4/PS5_exe2_hidden7','button2',0],

    ['PS4/PS5','exe2','PS4/PS5_exe2_hidden4','button1',0],
    ['PS4/PS5','exe2','PS4/PS5_exe2_hidden4','button2',0],
    ['PS4/PS5','exe2','PS4/PS5_exe2_hidden5','button1',0],
    ['PS4/PS5','exe2','PS4/PS5_exe2_hidden5','button2',0],


    ['Switch','exe3','Switch_exe3_hidden1','button1',0],
    ['Switch','exe3','Switch_exe3_hidden1','button2',0],
    ['Switch','exe3','Switch_exe3_hidden6','button1',0],
    ['Switch','exe3','Switch_exe3_hidden6','button2',0],
    ['Switch','exe3','Switch_exe3_hidden2','button1',0],
    ['Switch','exe3','Switch_exe3_hidden2','button2',0],
    ['Switch','exe3','Switch_exe3_hidden3','button1',0],
    ['Switch','exe3','Switch_exe3_hidden3','button2',0],

    ['Switch','exe3','Switch_exe3_hidden7','button1',0],
    ['Switch','exe3','Switch_exe3_hidden7','button2',0],

    ['Switch','exe3','Switch_exe3_hidden4','button1',0],
    ['Switch','exe3','Switch_exe3_hidden4','button2',0],
    ['Switch','exe3','Switch_exe3_hidden5','button1',0],
    ['Switch','exe3','Switch_exe3_hidden5','button2',0],

    ['Steam','exe3','Steam_exe3_hidden1','button1',0],
    ['Steam','exe3','Steam_exe3_hidden1','button2',0],
    ['Steam','exe3','Steam_exe3_hidden6','button1',0],
    ['Steam','exe3','Steam_exe3_hidden6','button2',0],
    ['Steam','exe3','Steam_exe3_hidden2','button1',0],
    ['Steam','exe3','Steam_exe3_hidden2','button2',0],
    ['Steam','exe3','Steam_exe3_hidden3','button1',0],
    ['Steam','exe3','Steam_exe3_hidden3','button2',0],

    ['Steam','exe3','Steam_exe3_hidden7','button1',0],
    ['Steam','exe3','Steam_exe3_hidden7','button2',0],

    ['Steam','exe3','Steam_exe3_hidden4','button1',0],
    ['Steam','exe3','Steam_exe3_hidden4','button2',0],
    ['Steam','exe3','Steam_exe3_hidden5','button1',0],
    ['Steam','exe3','Steam_exe3_hidden5','button2',0],


    ['PS4/PS5','exe3','PS4/PS5_exe3_hidden1','button1',0],
    ['PS4/PS5','exe3','PS4/PS5_exe3_hidden1','button2',0],
    ['PS4/PS5','exe3','PS4/PS5_exe3_hidden6','button1',0],
    ['PS4/PS5','exe3','PS4/PS5_exe3_hidden6','button2',0],
    ['PS4/PS5','exe3','PS4/PS5_exe3_hidden2','button1',0],
    ['PS4/PS5','exe3','PS4/PS5_exe3_hidden2','button2',0],
    ['PS4/PS5','exe3','PS4/PS5_exe3_hidden3','button1',0],
    ['PS4/PS5','exe3','PS4/PS5_exe3_hidden3','button2',0],

    ['PS4/PS5','exe3','PS4/PS5_exe3_hidden7','button1',0],
    ['PS4/PS5','exe3','PS4/PS5_exe3_hidden7','button2',0],

    ['PS4/PS5','exe3','PS4/PS5_exe3_hidden4','button1',0],
    ['PS4/PS5','exe3','PS4/PS5_exe3_hidden4','button2',0],
    ['PS4/PS5','exe3','PS4/PS5_exe3_hidden5','button1',0],
    ['PS4/PS5','exe3','PS4/PS5_exe3_hidden5','button2',0],


    ['Switch','exe4','Switch_exe4_hidden1','button1',0],
    ['Switch','exe4','Switch_exe4_hidden1','button2',0],
    ['Switch','exe4','Switch_exe4_hidden9','button1',0],
    ['Switch','exe4','Switch_exe4_hidden9','button2',0],
    ['Switch','exe4','Switch_exe4_hidden2','button1',0],
    ['Switch','exe4','Switch_exe4_hidden2','button2',0],
    ['Switch','exe4','Switch_exe4_hidden10','button1',0],
    ['Switch','exe4','Switch_exe4_hidden10','button2',0],
    ['Switch','exe4','Switch_exe4_hidden3','button1',0],
    ['Switch','exe4','Switch_exe4_hidden3','button2',0],
    ['Switch','exe4','Switch_exe4_hidden4','button1',0],
    ['Switch','exe4','Switch_exe4_hidden4','button2',0],
    ['Switch','exe4','Switch_exe4_hidden5','button1',0],
    ['Switch','exe4','Switch_exe4_hidden5','button2',0],
    ['Switch','exe4','Switch_exe4_hidden6','button1',0],
    ['Switch','exe4','Switch_exe4_hidden6','button2',0],
    ['Switch','exe4','Switch_exe4_hidden7','button1',0],
    ['Switch','exe4','Switch_exe4_hidden7','button2',0],
    ['Switch','exe4','Switch_exe4_hidden8','button1',0],
    ['Switch','exe4','Switch_exe4_hidden8','button2',0],



    ['Steam','exe4','Steam_exe4_hidden1','button1',0],
    ['Steam','exe4','Steam_exe4_hidden1','button2',0],
    ['Steam','exe4','Steam_exe4_hidden9','button1',0],
    ['Steam','exe4','Steam_exe4_hidden9','button2',0],
    ['Steam','exe4','Steam_exe4_hidden2','button1',0],
    ['Steam','exe4','Steam_exe4_hidden2','button2',0],
    ['Steam','exe4','Steam_exe4_hidden10','button1',0],
    ['Steam','exe4','Steam_exe4_hidden10','button2',0],
    ['Steam','exe4','Steam_exe4_hidden3','button1',0],
    ['Steam','exe4','Steam_exe4_hidden3','button2',0],
    ['Steam','exe4','Steam_exe4_hidden4','button1',0],
    ['Steam','exe4','Steam_exe4_hidden4','button2',0],
    ['Steam','exe4','Steam_exe4_hidden5','button1',0],
    ['Steam','exe4','Steam_exe4_hidden5','button2',0],
    ['Steam','exe4','Steam_exe4_hidden6','button1',0],
    ['Steam','exe4','Steam_exe4_hidden6','button2',0],
    ['Steam','exe4','Steam_exe4_hidden7','button1',0],
    ['Steam','exe4','Steam_exe4_hidden7','button2',0],
    ['Steam','exe4','Steam_exe4_hidden8','button1',0],
    ['Steam','exe4','Steam_exe4_hidden8','button2',0],



    ['PS4/PS5','exe4','PS4/PS5_exe4_hidden1','button1',0],
    ['PS4/PS5','exe4','PS4/PS5_exe4_hidden1','button2',0],
    ['PS4/PS5','exe4','PS4/PS5_exe4_hidden9','button1',0],
    ['PS4/PS5','exe4','PS4/PS5_exe4_hidden9','button2',0],
    ['PS4/PS5','exe4','PS4/PS5_exe4_hidden2','button1',0],
    ['PS4/PS5','exe4','PS4/PS5_exe4_hidden2','button2',0],

    ['PS4/PS5','exe4','PS4/PS5_exe4_hidden10','button1',0],
    ['PS4/PS5','exe4','PS4/PS5_exe4_hidden10','button2',0],
    ['PS4/PS5','exe4','PS4/PS5_exe4_hidden3','button1',0],
    ['PS4/PS5','exe4','PS4/PS5_exe4_hidden3','button2',0],
    ['PS4/PS5','exe4','PS4/PS5_exe4_hidden4','button1',0],
    ['PS4/PS5','exe4','PS4/PS5_exe4_hidden4','button2',0],
    ['PS4/PS5','exe4','PS4/PS5_exe4_hidden5','button1',0],
    ['PS4/PS5','exe4','PS4/PS5_exe4_hidden5','button2',0],
    ['PS4/PS5','exe4','PS4/PS5_exe4_hidden6','button1',0],
    ['PS4/PS5','exe4','PS4/PS5_exe4_hidden6','button2',0],
    ['PS4/PS5','exe4','PS4/PS5_exe4_hidden7','button1',0],
    ['PS4/PS5','exe4','PS4/PS5_exe4_hidden7','button2',0],
    ['PS4/PS5','exe4','PS4/PS5_exe4_hidden8','button1',0],
    ['PS4/PS5','exe4','PS4/PS5_exe4_hidden8','button2',0],


    ['Switch','exe5','Switch_exe5_hidden1','button1',0],
    ['Switch','exe5','Switch_exe5_hidden1','button2',0],
    ['Switch','exe5','Switch_exe5_hidden9','button1',0],
    ['Switch','exe5','Switch_exe5_hidden9','button2',0],
    ['Switch','exe5','Switch_exe5_hidden2','button1',0],
    ['Switch','exe5','Switch_exe5_hidden2','button2',0],
    ['Switch','exe5','Switch_exe5_hidden10','button1',0],
    ['Switch','exe5','Switch_exe5_hidden10','button2',0],
    ['Switch','exe5','Switch_exe5_hidden3','button1',0],
    ['Switch','exe5','Switch_exe5_hidden3','button2',0],
    ['Switch','exe5','Switch_exe5_hidden4','button1',0],
    ['Switch','exe5','Switch_exe5_hidden4','button2',0],
    ['Switch','exe5','Switch_exe5_hidden5','button1',0],
    ['Switch','exe5','Switch_exe5_hidden5','button2',0],
    ['Switch','exe5','Switch_exe5_hidden6','button1',0],
    ['Switch','exe5','Switch_exe5_hidden6','button2',0],
    ['Switch','exe5','Switch_exe5_hidden7','button1',0],
    ['Switch','exe5','Switch_exe5_hidden7','button2',0],
    ['Switch','exe5','Switch_exe5_hidden8','button1',0],
    ['Switch','exe5','Switch_exe5_hidden8','button2',0],



    ['Steam','exe5','Steam_exe5_hidden1','button1',0],
    ['Steam','exe5','Steam_exe5_hidden1','button2',0],
    ['Steam','exe5','Steam_exe5_hidden9','button1',0],
    ['Steam','exe5','Steam_exe5_hidden9','button2',0],
    ['Steam','exe5','Steam_exe5_hidden2','button1',0],
    ['Steam','exe5','Steam_exe5_hidden2','button2',0],
    ['Steam','exe5','Steam_exe5_hidden10','button1',0],
    ['Steam','exe5','Steam_exe5_hidden10','button2',0],

    ['Steam','exe5','Steam_exe5_hidden3','button1',0],
    ['Steam','exe5','Steam_exe5_hidden3','button2',0],
    ['Steam','exe5','Steam_exe5_hidden4','button1',0],
    ['Steam','exe5','Steam_exe5_hidden4','button2',0],
    ['Steam','exe5','Steam_exe5_hidden5','button1',0],
    ['Steam','exe5','Steam_exe5_hidden5','button2',0],
    ['Steam','exe5','Steam_exe5_hidden6','button1',0],
    ['Steam','exe5','Steam_exe5_hidden6','button2',0],
    ['Steam','exe5','Steam_exe5_hidden7','button1',0],
    ['Steam','exe5','Steam_exe5_hidden7','button2',0],
    ['Steam','exe5','Steam_exe5_hidden8','button1',0],
    ['Steam','exe5','Steam_exe5_hidden8','button2',0],


    ['PS4/PS5','exe5','PS4/PS5_exe5_hidden1','button1',0],
    ['PS4/PS5','exe5','PS4/PS5_exe5_hidden1','button2',0],
    ['PS4/PS5','exe5','PS4/PS5_exe5_hidden9','button1',0],
    ['PS4/PS5','exe5','PS4/PS5_exe5_hidden9','button2',0],
    ['PS4/PS5','exe5','PS4/PS5_exe5_hidden2','button1',0],
    ['PS4/PS5','exe5','PS4/PS5_exe5_hidden2','button2',0],
    ['PS4/PS5','exe5','PS4/PS5_exe5_hidden10','button1',0],
    ['PS4/PS5','exe5','PS4/PS5_exe5_hidden10','button2',0],

    ['PS4/PS5','exe5','PS4/PS5_exe5_hidden3','button1',0],
    ['PS4/PS5','exe5','PS4/PS5_exe5_hidden3','button2',0],
    ['PS4/PS5','exe5','PS4/PS5_exe5_hidden4','button1',0],
    ['PS4/PS5','exe5','PS4/PS5_exe5_hidden4','button2',0],
    ['PS4/PS5','exe5','PS4/PS5_exe5_hidden5','button1',0],
    ['PS4/PS5','exe5','PS4/PS5_exe5_hidden5','button2',0],
    ['PS4/PS5','exe5','PS4/PS5_exe5_hidden6','button1',0],
    ['PS4/PS5','exe5','PS4/PS5_exe5_hidden6','button2',0],
    ['PS4/PS5','exe5','PS4/PS5_exe5_hidden7','button1',0],
    ['PS4/PS5','exe5','PS4/PS5_exe5_hidden7','button2',0],
    ['PS4/PS5','exe5','PS4/PS5_exe5_hidden8','button1',0],
    ['PS4/PS5','exe5','PS4/PS5_exe5_hidden8','button2',0],


    ['Switch','exe6','Switch_exe6_hidden1','button1',0],
    ['Switch','exe6','Switch_exe6_hidden1','button2',0],
    ['Switch','exe6','Switch_exe6_hidden9','button1',0],
    ['Switch','exe6','Switch_exe6_hidden9','button2',0],
    ['Switch','exe6','Switch_exe6_hidden2','button1',0],
    ['Switch','exe6','Switch_exe6_hidden2','button2',0],
    ['Switch','exe6','Switch_exe6_hidden10','button1',0],
    ['Switch','exe6','Switch_exe6_hidden10','button2',0],

    ['Switch','exe6','Switch_exe6_hidden3','button1',0],
    ['Switch','exe6','Switch_exe6_hidden3','button2',0],
    ['Switch','exe6','Switch_exe6_hidden4','button1',0],
    ['Switch','exe6','Switch_exe6_hidden4','button2',0],
    ['Switch','exe6','Switch_exe6_hidden5','button1',0],
    ['Switch','exe6','Switch_exe6_hidden5','button2',0],
    ['Switch','exe6','Switch_exe6_hidden6','button1',0],
    ['Switch','exe6','Switch_exe6_hidden6','button2',0],
    ['Switch','exe6','Switch_exe6_hidden7','button1',0],
    ['Switch','exe6','Switch_exe6_hidden7','button2',0],
    ['Switch','exe6','Switch_exe6_hidden8','button1',0],
    ['Switch','exe6','Switch_exe6_hidden8','button2',0],


    ['Steam','exe6','Steam_exe6_hidden1','button1',0],
    ['Steam','exe6','Steam_exe6_hidden1','button2',0],
    ['Steam','exe6','Steam_exe6_hidden9','button1',0],
    ['Steam','exe6','Steam_exe6_hidden9','button2',0],
    ['Steam','exe6','Steam_exe6_hidden2','button1',0],
    ['Steam','exe6','Steam_exe6_hidden2','button2',0],
    ['Steam','exe6','Steam_exe6_hidden10','button1',0],
    ['Steam','exe6','Steam_exe6_hidden10','button2',0],
    ['Steam','exe6','Steam_exe6_hidden3','button1',0],
    ['Steam','exe6','Steam_exe6_hidden3','button2',0],
    ['Steam','exe6','Steam_exe6_hidden4','button1',0],
    ['Steam','exe6','Steam_exe6_hidden4','button2',0],
    ['Steam','exe6','Steam_exe6_hidden5','button1',0],
    ['Steam','exe6','Steam_exe6_hidden5','button2',0],
    ['Steam','exe6','Steam_exe6_hidden6','button1',0],
    ['Steam','exe6','Steam_exe6_hidden6','button2',0],
    ['Steam','exe6','Steam_exe6_hidden7','button1',0],
    ['Steam','exe6','Steam_exe6_hidden7','button2',0],
    ['Steam','exe6','Steam_exe6_hidden8','button1',0],
    ['Steam','exe6','Steam_exe6_hidden8','button2',0],



    ['PS4/PS5','exe6','PS4/PS5_exe6_hidden1','button1',0],
    ['PS4/PS5','exe6','PS4/PS5_exe6_hidden1','button2',0],
    ['PS4/PS5','exe6','PS4/PS5_exe6_hidden9','button1',0],
    ['PS4/PS5','exe6','PS4/PS5_exe6_hidden9','button2',0],
    ['PS4/PS5','exe6','PS4/PS5_exe6_hidden2','button1',0],
    ['PS4/PS5','exe6','PS4/PS5_exe6_hidden2','button2',0],
    ['PS4/PS5','exe6','PS4/PS5_exe6_hidden10','button1',0],
    ['PS4/PS5','exe6','PS4/PS5_exe6_hidden10','button2',0],
    ['PS4/PS5','exe6','PS4/PS5_exe6_hidden3','button1',0],
    ['PS4/PS5','exe6','PS4/PS5_exe6_hidden3','button2',0],
    ['PS4/PS5','exe6','PS4/PS5_exe6_hidden4','button1',0],
    ['PS4/PS5','exe6','PS4/PS5_exe6_hidden4','button2',0],
    ['PS4/PS5','exe6','PS4/PS5_exe6_hidden5','button1',0],
    ['PS4/PS5','exe6','PS4/PS5_exe6_hidden5','button2',0],
    ['PS4/PS5','exe6','PS4/PS5_exe6_hidden6','button1',0],
    ['PS4/PS5','exe6','PS4/PS5_exe6_hidden6','button2',0],
    ['PS4/PS5','exe6','PS4/PS5_exe6_hidden7','button1',0],
    ['PS4/PS5','exe6','PS4/PS5_exe6_hidden7','button2',0],
    ['PS4/PS5','exe6','PS4/PS5_exe6_hidden8','button1',0],
    ['PS4/PS5','exe6','PS4/PS5_exe6_hidden8','button2',0],


  ]

  var oldversionnumdata = [
    ['Switch','exe1',0],
    ['Switch','exe2',0],
    ['Switch','exe3',0],
    ['Switch','exe4',0],
    ['Switch','exe5',0],
    ['Switch','exe6',0],

    ['PS4/PS5','exe1',0],
    ['PS4/PS5','exe2',0],
    ['PS4/PS5','exe3',0],
    ['PS4/PS5','exe4',0],
    ['PS4/PS5','exe5',0],
    ['PS4/PS5','exe6',0],

    ['Steam','exe1',0],
    ['Steam','exe2',0],
    ['Steam','exe3',0],
    ['Steam','exe4',0],
    ['Steam','exe5',0],
    ['Steam','exe6',0],
  ]
var exe1_rule_deatil = [
  "アーマー:アーマー禁止",
  "チップ/PA:回復効果を含むチップ・PA禁止",
  "チップ:ポイズンアヌビス禁止",
  "チップ:ストーンボディ・ユカシタ禁止",
]
var exe2_rule_deatil = [
  "スタイル:サイトスタイル禁止",
]

var exe3_rule_deatil = [
  "チップ:クイックゲージ禁止",
  "チップ:フォルダリターン禁止",
]

var exe4_rule_deatil = [

]

var exe4_rule_deatil_ex = [
  "改造カードCSフルカスタム禁止",
  "改造カードB左エアシュート禁止",
  "改造カード永続ジャンクソウル禁止",
]


var exe5_rule_deatil = [
  "改造カード:B左エアシュート禁止",
  "改造カード:永続ジャンクソウル禁止",
]

var exe5_rule_deatil_ex = [
  "改造カード:CSマヒ禁止",
  "改造カード:CSチップ破壊禁止",
  "改造カード:CSインビジブル禁止",
  "改造カード:CSサンダーボール禁止",
  "改造カード:CSラビリング禁止",
  "チップ:バリア100禁止",
  "チップ:レッドフルーツ2禁止",
  "改造カードの組み合わせ:ジャンクマン・フデローの組み合わせ禁止",

]

var exe6_rule_deatil = [

]

var exe6_rule_deatil_ex = [
  "改造カード:CSインビジブル禁止",
  "改造カード:バスターこおり禁止",
  "改造カード:CS凍結禁止",
  "改造カード:CS左すいよせ禁止",
  "改造カード:CSマシンガン禁止",
  "チップ:バグシュウセイ禁止",
]

var ruledetails=[
  ['Switch_exe1_hidden3',exe1_rule_deatil],
  ['Switch_exe2_hidden3',exe2_rule_deatil],
  ['Switch_exe3_hidden3',exe3_rule_deatil],
  ['Switch_exe4_hidden5',exe4_rule_deatil],
  ['Switch_exe4_hidden6',exe4_rule_deatil_ex],
  ['Switch_exe5_hidden5',exe5_rule_deatil],
  ['Switch_exe5_hidden6',exe5_rule_deatil_ex],
  ['Switch_exe6_hidden5',exe6_rule_deatil],
  ['Switch_exe6_hidden6',exe6_rule_deatil_ex],
]


// =====================================================================
//  定数
// =====================================================================
const GAMETYPES = ['Switch', 'PS4/PS5', 'Steam'];
const VERSIONS = ['exe1', 'exe2', 'exe3', 'exe4', 'exe5', 'exe6'];
const DAYS_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];

const SHEET_MATCHING = 'matching';
const SHEET_HIDDENTIME = 'hiddentime';
const SHEET_EVENTID = 'eventid';
const SHEET_EVENTDETAIL = 'eventdetail';
const CONFIG_SHEET_NAME = '設定';

const WAIT_EXPIRE_MS = 5 * 60 * 1000;                 // 待機の有効期限（5分）
const LOCK_TIMEOUT_MS = 3000;                         // 書き込みロックの最大待ち時間（取れなければロックなしで続行）
const CONFIG_SELECTOR_LABEL = '使用する設定';           // 「設定」シートで、使う設定シートの名前を書く行
const CONFIG_HEADER_LABEL = '項目';                     // 設定シートの見出し行（読み飛ばす）
const CONFIG_CACHE_KEY = 'config:v3';
const CONFIG_CACHE_SECONDS = 60;                      // 設定値のキャッシュ（1分。シートの変更は最大1分で反映）
const SNAPSHOT_CACHE_KEY = 'snapshot:v1';
const SNAPSHOT_CACHE_SECONDS = 5;                     // 待機人数のキャッシュ（5秒。書き込み時は即破棄）
const CALENDAR_CACHE_KEY = 'calendarEvents:v1';
const CALENDAR_CACHE_SECONDS = 60;                    // カレンダー予定のキャッシュ（60秒。追加・変更・削除時は即破棄）
const CALENDAR_RANGE_DAYS = 90;                       // 取得するカレンダー予定の範囲（今日から3か月）
const ADD_EVENT_DEDUP_SECONDS = 600;                  // イベント追加の二重登録防止（10分）
const EXPIRED_NOTIFY_WITHIN_MS = 3 * 60 * 60 * 1000;  // これより前に期限切れになった参加表明は通知せずに消す

// 一時的なエラー（再試行すれば成功する可能性が高いもの）の判定用
const TRANSIENT_ERROR_RE = /too many times|rate limit|timed out|timeout|temporar|try again|internal error|backend error|service unavailable|unavailable|多すぎ|タイムアウト|一時的|しばらくして|内部エラー|サーバー ?エラー/i;


// =====================================================================
//  設定（「設定」シート。形式はファイル先頭のコメントを参照）
// =====================================================================

// 戻り値 { profile: 使用中の設定名, values: { 項目名: 値 } }
let configMemo_ = null;
function getConfig_() {
  if (configMemo_) return configMemo_;

  const cached = safeCacheGet_(CONFIG_CACHE_KEY);
  if (cached) {
    try {
      configMemo_ = JSON.parse(cached);
      return configMemo_;
    } catch (e) {
      // キャッシュが壊れていたら読み直す
    }
  }

  const config = readConfigSheet_();
  safeCachePut_(CONFIG_CACHE_KEY, JSON.stringify(config), CONFIG_CACHE_SECONDS);
  configMemo_ = config;
  return config;
}

// 「設定」シートの B1（使用する設定）に書かれた名前のシートを読み込む
function readConfigSheet_() {
  const ss = getSettingsSpreadsheet_();
  const selectorSheet = ss.getSheetByName(CONFIG_SHEET_NAME);
  if (!selectorSheet) {
    // 未導入でも待機の表は動くようにする（通知とカレンダーは使えない）
    console.warn('「設定」シートがないため、Discord 通知とカレンダーは使えません');
    return { profile: '', values: {} };
  }
  const selectorRows = readSheetValues_(selectorSheet);

  let profile = '';
  for (let i = 0; i < selectorRows.length; i++) {
    if (String(selectorRows[i][0] || '').trim() === CONFIG_SELECTOR_LABEL) {
      profile = String(selectorRows[i][1] || '').trim();
      break;
    }
  }

  let rows = selectorRows;  // 「使用する設定」がなければ「設定」シート自体に項目が書いてあるものとして読む
  if (profile && profile !== CONFIG_SHEET_NAME) {
    const setSheet = ss.getSheetByName(profile);
    if (!setSheet) {
      throw userError_('「' + profile + '」という名前のシートがありません。管理者は「設定」シートの「' + CONFIG_SELECTOR_LABEL + '」とシート名を合わせてください。');
    }
    rows = readSheetValues_(setSheet);
  }

  const values = {};
  rows.forEach(function (r) {
    const key = String(r[0] || '').trim();
    if (!key || key === CONFIG_HEADER_LABEL || key === CONFIG_SELECTOR_LABEL) return;
    values[key] = String(r[1] || '').trim();
  });
  return { profile: profile || CONFIG_SHEET_NAME, values: values };
}

// Webhook URL が読めなくても本来の処理（登録など）は失敗させず、通知だけスキップする
function getWebhookUrl_(gametype, version) {
  return readConfigValueSafely_('webhook_' + gametype + '_' + version);
}

function getEventWebhookUrl_() {
  return readConfigValueSafely_('eventWebhookUrl');
}

function readConfigValueSafely_(key) {
  try {
    return getConfig_().values[key] || '';
  } catch (e) {
    console.error('設定値 ' + key + ' を読めませんでした: ' + e.message);
    return '';
  }
}

function getCalendarId_() {
  const config = getConfig_();
  const id = config.values.calendarId;
  if (!id) {
    throw userError_('「' + (config.profile || CONFIG_SHEET_NAME) + '」シートの calendarId が未入力です。管理者に連絡してください。');
  }
  return id;
}

// 待機データなどを置くスプレッドシート（dataSheetId が空欄なら「設定」シートと同じスプレッドシート）
function getDataSpreadsheetId_() {
  return getConfig_().values.dataSheetId || SETTINGS_SPREADSHEET_ID;
}


// =====================================================================
//  共通処理（エラー処理・再試行・ロック・キャッシュ）
// =====================================================================

// 利用者にそのまま見せてよいエラー
function userError_(message) {
  const e = new Error(message);
  e.userMessage = message;
  return e;
}

function isTransientError_(e) {
  return !!e && !e.userMessage && TRANSIENT_ERROR_RE.test(String((e && e.message) || e));
}

function friendlyMessage_(e, label) {
  if (e && e.userMessage) return e.userMessage;
  if (isTransientError_(e)) return 'Google のサービスが混み合っています。少し待ってからもう一度お試しください。';
  return label + 'でエラーが発生しました: ' + ((e && e.message) || e);
}

// 画面から呼ばれる処理の共通ラッパー（ログを残し、利用者向けのメッセージにして投げ直す）
function runForClient_(label, fn) {
  try {
    return fn();
  } catch (e) {
    console.error('[' + label + '] ' + ((e && e.stack) || e));
    throw new Error(friendlyMessage_(e, label));
  }
}

// 一時的なエラーのときだけ、待ち時間を伸ばしながら再試行する
function withRetry_(fn, label, maxAttempts) {
  const attempts = maxAttempts || 3;
  for (let attempt = 1; ; attempt++) {
    try {
      return fn();
    } catch (e) {
      if (attempt >= attempts || !isTransientError_(e)) throw e;
      const waitMs = 500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
      console.warn('[再試行] ' + label + ' (' + attempt + '回目失敗: ' + e.message + ') ' + waitMs + 'ms 後に再試行します');
      Utilities.sleep(waitMs);
    }
  }
}

// 複数人が同時に同じ所を書き換えないよう、取れればロックを使う（スクリプト全体で1つ。中の処理は短く保つこと）
// ロックが取れなくても処理は止めない。同時に同じ所を書き換えることはまれで、影響も小さいため、
// 利用者にエラーを見せるより続行する（取れなかったことは実行ログに残す）
function withLock_(fn, timeoutMs, label) {
  const lock = LockService.getScriptLock();
  const startedAt = Date.now();
  let locked = false;
  try {
    locked = lock.tryLock(timeoutMs || LOCK_TIMEOUT_MS);
  } catch (e) {
    console.warn('[ロック] 取得時にエラー: ' + e.message);
  }
  if (!locked) {
    console.warn('[ロック取得できず] ' + (label || '') + ' ' + (Date.now() - startedAt) + 'ms 待ちましたが、ロックなしで続行します');
  }
  try {
    return fn();
  } finally {
    if (locked) {
      try {
        SpreadsheetApp.flush();  // 書き込みを確定させてから次の人にロックを渡す
      } catch (e) {
        console.error('flush エラー: ' + e);
      }
      lock.releaseLock();
    }
  }
}

function safeCacheGet_(key) {
  try {
    return CacheService.getScriptCache().get(key);
  } catch (e) {
    console.warn('キャッシュ読み込みエラー(' + key + '): ' + e);
    return null;
  }
}

function safeCachePut_(key, value, seconds) {
  try {
    CacheService.getScriptCache().put(key, value, seconds);
  } catch (e) {
    // 100KB を超える値などはキャッシュしない（動作には影響なし）
    console.warn('キャッシュ書き込みエラー(' + key + '): ' + e);
  }
}

function safeCacheRemove_(key) {
  try {
    CacheService.getScriptCache().remove(key);
  } catch (e) {
    console.warn('キャッシュ削除エラー(' + key + '): ' + e);
  }
}


// =====================================================================
//  スプレッドシート・カレンダーへのアクセス
// =====================================================================
function openSpreadsheet_(id, label) {
  try {
    return withRetry_(function () { return SpreadsheetApp.openById(id); }, 'openSpreadsheet');
  } catch (e) {
    if (isTransientError_(e)) throw e;
    console.error(label + 'を開けません(' + id + '): ' + e);
    throw userError_(label + 'を開けません。管理者はスプレッドシートIDと共有設定を確認してください。');
  }
}

let settingsSpreadsheetMemo_ = null;
function getSettingsSpreadsheet_() {
  if (!settingsSpreadsheetMemo_) settingsSpreadsheetMemo_ = openSpreadsheet_(SETTINGS_SPREADSHEET_ID, 'スプレッドシート');
  return settingsSpreadsheetMemo_;
}

// 待機・イベントなどのデータを読み書きするスプレッドシート
let spreadsheetMemo_ = null;
function getSpreadsheet_() {
  if (spreadsheetMemo_) return spreadsheetMemo_;
  const id = getDataSpreadsheetId_();
  spreadsheetMemo_ = (id === SETTINGS_SPREADSHEET_ID)
    ? getSettingsSpreadsheet_()
    : openSpreadsheet_(id, 'データ用スプレッドシート（「設定」シートの dataSheetId）');
  return spreadsheetMemo_;
}

function getSheet_(name) {
  const sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) {
    throw userError_('シート「' + name + '」が見つかりません。管理者はスプレッドシートのシート名を確認してください。');
  }
  return sheet;
}

function readSheetValues_(sheet) {
  return withRetry_(function () { return sheet.getDataRange().getValues(); }, 'read:' + sheet.getName());
}

let calendarMemo_ = null;
function getCalendar_() {
  if (calendarMemo_) return calendarMemo_;
  const id = getCalendarId_();
  const calendar = withRetry_(function () { return CalendarApp.getCalendarById(id); }, 'getCalendarById');
  if (!calendar) {
    throw userError_('カレンダーにアクセスできません。管理者は「設定」シートの calendarId とカレンダーの共有設定を確認してください。');
  }
  calendarMemo_ = calendar;
  return calendar;
}


// =====================================================================
//  Discord 通知
// =====================================================================

// 失敗しても例外は投げず、true/false を返す（通知失敗で本来の処理まで失敗させないため）
function postDiscord_(url, content) {
  if (!url) {
    console.warn('Discord Webhook URL が未設定のため、通知をスキップしました');
    return false;
  }
  if (!content) {
    console.warn('通知内容が空のため、Discord 通知をスキップしました');
    return false;
  }
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      content: String(content).slice(0, 2000),  // Discord の上限は2000文字
      username: 'My Bot',
      allowed_mentions: { parse: [] },          // イベント名などに @everyone 等が書かれても通知を飛ばさない
    }),
    muteHttpExceptions: true,
  };
  for (let attempt = 1; attempt <= 2; attempt++) {
    let response;
    try {
      response = UrlFetchApp.fetch(url, options);
    } catch (e) {
      console.error('Discord 通知の送信エラー(' + attempt + '回目): ' + e.message);
      if (attempt === 2) return false;
      Utilities.sleep(1000);
      continue;
    }
    const code = response.getResponseCode();
    if (code >= 200 && code < 300) return true;
    if (code === 429 && attempt === 1) {
      // 送信しすぎ → Discord が指定する時間だけ待って1回だけ再送
      let waitMs = 1000;
      try {
        const body = JSON.parse(response.getContentText());
        if (body.retry_after) waitMs = Math.min(5000, Math.ceil(Number(body.retry_after) * 1000));
      } catch (e) {
        // 本文が読めなければ1秒待つ
      }
      Utilities.sleep(waitMs);
      continue;
    }
    console.error('Discord 通知の送信失敗: HTTP ' + code + ' ' + response.getContentText().slice(0, 300));
    return false;
  }
  return false;
}

function notifyEventChannel_(content) {
  try {
    return postDiscord_(getEventWebhookUrl_(), content);
  } catch (e) {
    console.error('イベント通知の準備でエラー: ' + e);
    return false;
  }
}

function formatJpDateTime_(date, withTimeZone) {
  const d = (date instanceof Date) ? date : new Date(date);
  const pad = function (n) { return ('0' + n).slice(-2); };
  let text = d.getFullYear() + '/' + pad(d.getMonth() + 1) + '/' + pad(d.getDate())
    + '(' + DAYS_OF_WEEK[d.getDay()] + ') ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  if (withTimeZone) {
    const m = d.toTimeString().match(/\(.*?\)/);
    if (m) text += ' ' + m[0];
  }
  return text;
}

// イベント通知の本文。oldTimes を渡すと「変更前 → 変更後」の形式になる
function buildEventMessage_(header, title, start, end, rule, description, oldTimes) {
  const startText = (oldTimes ? formatJpDateTime_(oldTimes.start, false) + ' → ' : '') + formatJpDateTime_(start, true);
  const endText = (oldTimes ? formatJpDateTime_(oldTimes.end, false) + ' → ' : '') + formatJpDateTime_(end, true);
  return header + "\n\n"
    + "タイトル : " + title + "\n"
    + "開始時間 : " + startText + "\n"
    + "終了時間 : " + endText + "\n\n"
    + "環境 : " + rule[0] + "\n"
    + "バージョン : " + rule[1] + "\n"
    + "ルール : " + rule[9] + "\n"
    + "詳細:\n" + (description || '');
}


// =====================================================================
//  ルール情報
// =====================================================================
function findRuleByHidden_(hidden) {
  for (let i = 0; i < rulearray.length; i++) {
    if (rulearray[i][3] === hidden) return rulearray[i];
  }
  return null;
}

// ルール詳細（禁止事項）は ruledetails に登録したルールだけ表示する（未登録は「制限がありません」）
function findRuleDetailsEntry_(hidden) {
  for (let i = 0; i < ruledetails.length; i++) {
    if (ruledetails[i][0] === hidden) return ruledetails[i];
  }
  return null;
}

function getRuleDetails_(hidden) {
  const entry = findRuleDetailsEntry_(hidden);
  return entry ? entry[1].slice() : null;
}

function ruledatile(hiddenData) {
  return findRuleDetailsEntry_(hiddenData) || [];
}

function getRules(gametype, version) {
  const rules = [];
  for (let i = 0; i < rulearray.length; i++) {
    if (rulearray[i][0] == gametype && rulearray[i][1] == version) {
      rules.push({ hidden: rulearray[i][3], rule: rulearray[i][2] });
    }
  }
  return rules;
}

function validateView_(gametype, version) {
  if (GAMETYPES.indexOf(gametype) === -1 || VERSIONS.indexOf(version) === -1) {
    throw userError_('環境またはバージョンの指定が正しくありません。');
  }
}


// =====================================================================
//  Web アプリの入口（画面表示 と Python 用 API）
// =====================================================================
function doGet(e) {
  const p = (e && e.parameter) || {};
  const operation = p.operation || '';

  if (!operation) {
    // 画面のファイル名は GAS 側が「test」でも「index」でも動くようにする
    let page;
    try {
      page = HtmlService.createHtmlOutputFromFile('test');
    } catch (err) {
      page = HtmlService.createHtmlOutputFromFile('index');
    }
    return page
      .setTitle('アドコレ対戦詳細')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  try {
    let result;
    if (operation === 'getuser') {
      result = userIdupdate(p.arg1 || '');
    } else if (operation === 'waitbattle') {
      const args = [p.arg1, p.arg2, p.arg3, p.arg4, p.arg5, p.arg6, p.arg7, p.arg8, p.arg9].map(function (v) { return v || ''; });
      if (args.some(function (v) { return v === ''; })) {
        return jsonResponse_({ message: 'Missing parameters (arg1-arg9 are required)', status: 'error' });
      }
      waitbattle.apply(null, args);
      result = operation + "- user:" + args[0] + "- Nset:" + args[1] + "- isLank:" + args[2] + "- isHost:" + args[3]
        + "- ispratice:" + args[4] + " - is Single:" + args[5] + " - ismod:" + args[6] + " - gametype:" + args[7] + " - version:" + args[8];
    } else if (operation === 'endbattle') {
      if (!p.arg1) return jsonResponse_({ message: 'Missing parameter: arg1', status: 'error' });
      endbattle(p.arg1);
      result = operation + "- user:" + p.arg1;
    } else {
      return jsonResponse_({ message: 'Invalid operation', status: 'error' });
    }
    return jsonResponse_({ message: 'Operation processed successfully', result: result, status: 'success' });
  } catch (err) {
    console.error('doGet(' + operation + '): ' + ((err && err.stack) || err));
    return jsonResponse_({ message: friendlyMessage_(err, operation), status: 'error' });
  }
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}


// =====================================================================
//  待機（matching シート）
// =====================================================================
function waitKey_(gametype, version, hidden, button) {
  return [gametype, version, hidden, button].join('|');
}

// 待機の登録・解除（button1=親待機 / button2=子待機 / それ以外=解除）。ロックは使わない
//   ・自分の行が既にある人: 自分の行だけ書き換える（行は消えたり並び替わったりしないので他の人とぶつからない）
//   ・初めての人: appendRow で最終行の次に追加する（同時に追加されても行を取り合わない）
//     同じ人の行が万一2行できても、人数は1人として数える（buildSnapshot_ / getTableData）
function toggleButton(userId, gametype, version, ruleData, buttonType) {
  if (!userId) throw userError_('ユーザーIDがありません。ページを再読み込みしてください。');
  const isWait = (buttonType === 'button1' || buttonType === 'button2');
  const values = [userId, gametype, version, isWait ? ruleData : '', isWait ? buttonType : '', new Date()];
  const sheet = getSheet_(SHEET_MATCHING);

  if (!writeOwnMatchingRow_(sheet, userId, values)) {
    sheet.appendRow(values);  // 再試行すると二重追加になるので、ここは再試行しない
  }
  invalidateSnapshot_();
}

// 自分の行があれば書き換えて true、なければ false
function writeOwnMatchingRow_(sheet, userId, values) {
  const data = readSheetValues_(sheet);
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === userId) {
      const row = i + 1;
      withRetry_(function () { sheet.getRange(row, 1, 1, 6).setValues([values]); }, 'matching.setValues');
      return true;
    }
  }
  return false;
}

// 画面用: 待機の登録・解除をして、そのまま最新の画面データを返す（1回の通信で完了）
function toggleButtonAndGetPageData(userId, gametype, version, ruleData, buttonType, viewGametype, viewVersion) {
  return runForClient_('待機状態の更新', function () {
    validateView_(viewGametype, viewVersion);
    if (buttonType === 'button1' || buttonType === 'button2') {
      validateView_(gametype, version);
      const rule = findRuleByHidden_(ruleData);
      if (!rule || rule[0] !== gametype || rule[1] !== version) {
        throw userError_('ルールが見つかりません。画面を更新してからもう一度お試しください。');
      }
    }
    toggleButton(userId, gametype, version, ruleData, buttonType);
    return buildPageData_(viewGametype, viewVersion, getSnapshot_(true), getEventInfo_());
  });
}

// 【トリガー用】5分以上前の待機をクリアする
// ロックは使わず、期限切れの行だけを書き換える（他の人の書き込みを待たせない）
function userreset() {
  const sheet = getSheet_(SHEET_MATCHING);
  const data = readSheetValues_(sheet);
  let cleared = 0;
  for (let i = 0; i < data.length; i++) {
    if (!isExpiredWaitRow_(data[i], Date.now())) continue;
    const row = i + 1;
    // 読んでから消すまでの間に本人が登録し直していないか、その行だけ読み直して確かめる
    const current = sheet.getRange(row, 1, 1, 6).getValues()[0];
    if (current[0] !== data[i][0] || !isExpiredWaitRow_(current, Date.now())) continue;
    sheet.getRange(row, 2, 1, 4).setValues([['', '', '', '']]);
    cleared++;
  }
  if (cleared > 0) invalidateSnapshot_();
}

// 待機中（B〜E列に値がある）で、登録から5分以上たっている行か
function isExpiredWaitRow_(row, now) {
  const registered = new Date(row[5]);
  if (isNaN(registered.getTime())) return false;  // 見出し行など
  const waiting = [row[1], row[2], row[3], row[4]].some(function (v) { return v !== '' && v !== null && v !== undefined; });
  return waiting && now - registered.getTime() > WAIT_EXPIRE_MS;
}

function getTableData() {
  const data = readSheetValues_(getSheet_(SHEET_MATCHING));
  const rowsData = [];
  const seen = {};
  for (let i = 0; i < data.length; i++) {
    if (!data[i][0] || seen[data[i][0]]) continue;  // 同じ人の2行目以降は数えない
    seen[data[i][0]] = true;
    rowsData.push({ gametype: data[i][1], version: data[i][2], hidden: data[i][3], button: data[i][4] });
  }
  return rowsData;
}

// 待機人数・参加表明の状態をまとめて読む（matching と hiddentime を1回ずつ読むだけ）
function buildSnapshot_() {
  const matching = readSheetValues_(getSheet_(SHEET_MATCHING));
  const hiddentime = readSheetValues_(getSheet_(SHEET_HIDDENTIME));

  const waitCounts = {};
  const versionCounts = {};
  const seen = {};
  matching.forEach(function (r) {
    if (!r[0] || seen[r[0]]) return;  // 同じ人の2行目以降は数えない
    seen[r[0]] = true;
    const vKey = r[1] + '|' + r[2];
    versionCounts[vKey] = (versionCounts[vKey] || 0) + 1;
    const wKey = waitKey_(r[1], r[2], r[3], r[4]);
    waitCounts[wKey] = (waitCounts[wKey] || 0) + 1;
  });

  // hiddentime に載っているルールだけ画面に表示する。B列に時刻があれば「参加表明あり」
  const hiddenTime = {};
  hiddentime.forEach(function (r) {
    const hidden = r[0];
    if (hidden === '' || Object.prototype.hasOwnProperty.call(hiddenTime, hidden)) return;
    hiddenTime[hidden] = (r[1] !== '' && r[1] !== undefined && r[1] !== null);
  });

  return { waitCounts: waitCounts, versionCounts: versionCounts, hiddenTime: hiddenTime };
}

// キャッシュはデータ用スプレッドシートごとに分ける（本番/テストを切り替えても混ざらないように）
function snapshotCacheKey_() {
  return SNAPSHOT_CACHE_KEY + ':' + getDataSpreadsheetId_();
}

function getSnapshot_(forceFresh) {
  if (!forceFresh) {
    const cached = safeCacheGet_(snapshotCacheKey_());
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // 読み直す
      }
    }
  }
  const snapshot = buildSnapshot_();
  safeCachePut_(snapshotCacheKey_(), JSON.stringify(snapshot), SNAPSHOT_CACHE_SECONDS);
  return snapshot;
}

function invalidateSnapshot_() {
  try {
    safeCacheRemove_(snapshotCacheKey_());
  } catch (e) {
    console.warn('待機人数キャッシュの破棄に失敗: ' + e.message);
  }
}

function buildPageData_(gametype, version, snapshot, eventInfo) {
  const rows = [];
  for (let i = 0; i < rulearray.length; i++) {
    const r = rulearray[i];
    if (r[0] != gametype || r[1] != version) continue;
    const hidden = r[3];
    if (!Object.prototype.hasOwnProperty.call(snapshot.hiddenTime, hidden)) continue;
    rows.push({
      rule: r[2],
      button1: '親待機',
      accessnum1: snapshot.waitCounts[waitKey_(gametype, version, hidden, 'button1')] || 0,
      button2: '子待機',
      accessnum2: snapshot.waitCounts[waitKey_(gametype, version, hidden, 'button2')] || 0,
      hidden: hidden,
      rulebutton: r[9],
      exbutton2: snapshot.hiddenTime[hidden] ? '参加表明あり' : '参加表明なし',
      eventCount: (eventInfo && eventInfo.counts) ? (eventInfo.counts[hidden] || 0) : null,
      details: getRuleDetails_(hidden),
    });
  }

  // 下の表（環境・バージョンごとの人数）。table1=Switch, table2=PS4/PS5, table3=Steam
  const versionCounts = { table1: [], table2: [], table3: [] };
  [['table1', 'Switch'], ['table2', 'PS4/PS5'], ['table3', 'Steam']].forEach(function (t) {
    VERSIONS.forEach(function (v) {
      versionCounts[t[0]].push([snapshot.versionCounts[t[1] + '|' + v] || 0]);
    });
  });

  return {
    gametype: gametype,
    version: version,
    rows: rows,
    versionCounts: versionCounts,
    eventError: (eventInfo && eventInfo.error) || '',
    calendarId: (eventInfo && eventInfo.calendarId) || '',
  };
}

// 画面用: 1画面分のデータ（ルール行・待機人数・バージョン別人数・イベント件数）を1回で返す
function getPageData(gametype, version) {
  return runForClient_('画面データの取得', function () {
    validateView_(gametype, version);
    return buildPageData_(gametype, version, getSnapshot_(false), getEventInfo_());
  });
}

// カレンダーが読めなくても待機の表は表示できるよう、エラーはここで受け止める
function getEventInfo_() {
  try {
    const counts = {};
    getCalendarEventsCached_().forEach(function (ev) {
      counts[ev.location] = (counts[ev.location] || 0) + 1;
    });
    return { counts: counts, calendarId: getCalendarId_() };
  } catch (e) {
    console.error('カレンダー情報の取得エラー: ' + ((e && e.stack) || e));
    let calendarId = '';
    try {
      calendarId = getConfig_().values.calendarId || '';
    } catch (ignore) {
      // 設定も読めない場合は空のまま
    }
    return { counts: null, error: 'イベント情報を取得できませんでした: ' + friendlyMessage_(e, 'カレンダー'), calendarId: calendarId };
  }
}

// 互換用（旧画面・外部から呼ばれていた場合のため）
function getRowData(gametype, version) {
  return buildPageData_(gametype || 'Switch', version || 'exe1', getSnapshot_(false), null).rows;
}

function getAllversionRowData() {
  return buildPageData_('Switch', 'exe1', getSnapshot_(false), null).versionCounts;
}


// =====================================================================
//  Python 用 API
// =====================================================================
function userIdupdate(userId) {
  let retuserId = "";
  if (userId === "") {
    retuserId = getUserId();
    toggleButton(retuserId, "", "", "", "");
  } else {
    toggleButton(userId, "", "", "", "");
    retuserId = userId;
  }
  return retuserId;
}

function getUserId() {
  return 'user-' + Math.random().toString(36).substr(2, 9);
}

// 待機モード
// 指定された環境・バージョンのルールの中から選ぶ。各グループの最後の2つは「特殊ルール」「その他」
//   ・それ以外のルール: ネットワーク設定・ランク・練習・シングル・改造がすべて一致したもの
//   ・特殊ルール: ネットワーク設定が一致したもの
//   ・その他: どれにも当てはまらないとき
function waitbattle(userId, networksetting, matchingtype, isHost, ispractice, isSingle, ismod, gametype, version) {
  const group = rulearray.filter(function (r) { return r[0] === gametype && r[1] === version; });
  if (group.length === 0) throw userError_('環境またはバージョンの指定が正しくありません: ' + gametype + ' ' + version);

  let rule = null;
  for (let i = 0; i < group.length && !rule; i++) {
    const r = group[i];
    if (i < group.length - 2) {
      if (r[4] === networksetting && r[5] === matchingtype && r[6] === ispractice && r[7] === isSingle && r[8] === ismod) rule = r;
    } else if (i < group.length - 1) {
      if (r[4] === networksetting) rule = r;
    } else {
      rule = r;
    }
  }
  toggleButton(userId, gametype, version, rule[3], isHost === "True" ? 'button1' : 'button2');
}

// 待機モード終了
function endbattle(userId) {
  toggleButton(userId, "", "", "", "");
}


// =====================================================================
//  待機人数の Discord 通知（トリガー用）
// =====================================================================
function sendNotificationToDiscord2() {
  notifyWaitingPlayers_(false);
}

function sendNotificationToDiscord() {
  notifyWaitingPlayers_(true);
}

// countAllRows=true: バージョンごとの人数をルールに関係なく数える（旧 sendNotificationToDiscord の数え方）
function notifyWaitingPlayers_(countAllRows) {
  const rowsData = getTableData();
  const validKeys = {};
  accessnum.forEach(function (a) { validKeys[waitKey_(a[0], a[1], a[2], a[3])] = true; });

  const waitCounts = {};
  const versionCount = {};
  rowsData.forEach(function (r) {
    if (r.gametype === '' && r.version === '') return;
    const key = waitKey_(r.gametype, r.version, r.hidden, r.button);
    const vKey = r.gametype + '|' + r.version;
    if (validKeys[key]) waitCounts[key] = (waitCounts[key] || 0) + 1;
    if (countAllRows || validKeys[key]) versionCount[vKey] = (versionCount[vKey] || 0) + 1;
  });

  const versionnumdata = [];
  GAMETYPES.forEach(function (g) {
    VERSIONS.forEach(function (v) { versionnumdata.push([g, v, versionCount[g + '|' + v] || 0]); });
  });

  // 前回の人数はデータ用スプレッドシートごとに覚える（本番/テストの切り替えで通知が誤爆しないように）
  const dataId = getDataSpreadsheetId_();
  const propertyKey = (dataId === SETTINGS_SPREADSHEET_ID) ? 'oldversionnumdata' : 'oldversionnumdata:' + dataId;
  const properties = PropertiesService.getScriptProperties();
  let previous = null;
  try {
    previous = JSON.parse(properties.getProperty(propertyKey));
  } catch (e) {
    console.warn('前回の人数データが読めないため、0人として扱います: ' + e);
  }
  if (!Array.isArray(previous)) previous = versionnumdata.map(function (r) { return [r[0], r[1], 0]; });

  versionnumdata.forEach(function (current, i) {
    const before = previous[i] ? (Number(previous[i][2]) || 0) : 0;
    if (current[2] <= before) return;

    let messagecontent = current[0] + " " + current[1] + "に" + current[2] + "人のプレイヤーがいます。\n";
    rulearray.forEach(function (r) {
      if (r[0] != current[0] || r[1] != current[1]) return;
      const n = (waitCounts[waitKey_(r[0], r[1], r[3], 'button1')] || 0) + (waitCounts[waitKey_(r[0], r[1], r[3], 'button2')] || 0);
      if (n > 0) messagecontent += r[9] + " : " + n + "\n";
    });
    postDiscord_(getWebhookUrl_(current[0], current[1]), messagecontent);
  });

  properties.setProperty(propertyKey, JSON.stringify(versionnumdata));
}


// =====================================================================
//  カレンダー（イベント）
// =====================================================================
function fetchCalendarEvents_() {
  const calendar = getCalendar_();
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + CALENDAR_RANGE_DAYS);
  const events = withRetry_(function () { return calendar.getEvents(today, endDate); }, 'calendar.getEvents');

  return events.map(function (event) {
    const location = event.getLocation() || '';
    const parts = location.split('_');
    const hasRule = parts.length >= 3;  // 「環境_バージョン_hiddenN」の形式
    return {
      title: event.getTitle(),
      startTime: event.getStartTime().toISOString(),
      endTime: event.getEndTime().toISOString(),
      location: hasRule ? parts[0] + '_' + parts[1] + '_' + parts[2] : location,
      description: event.getDescription() || '',
      platform: hasRule ? parts[0] : '',
      version: hasRule ? parts[1] : '',
      eventid: event.getId(),
    };
  });
}

// キャッシュはカレンダーごとに分ける（本番/テストを切り替えても混ざらないように）
function calendarCacheKey_() {
  return CALENDAR_CACHE_KEY + ':' + getCalendarId_();
}

function getCalendarEventsCached_() {
  const cacheKey = calendarCacheKey_();
  const cached = safeCacheGet_(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      // 読み直す
    }
  }
  const events = fetchCalendarEvents_();
  safeCachePut_(cacheKey, JSON.stringify(events), CALENDAR_CACHE_SECONDS);
  return events;
}

function invalidateCalendarCache_() {
  try {
    safeCacheRemove_(calendarCacheKey_());
  } catch (e) {
    console.warn('カレンダーキャッシュの破棄に失敗: ' + e.message);
  }
}

// 互換用: 今日から3か月分のイベント一覧（カレンダーが読めない場合は空）
function getCalendarEvents() {
  try {
    return getCalendarEventsCached_();
  } catch (e) {
    console.error('getCalendarEvents: ' + ((e && e.stack) || e));
    return [];
  }
}

// 画面用: 指定ルールのイベント一覧（参加予定人数つき）
function getEventsForRule(hidden) {
  return runForClient_('イベント情報の取得', function () {
    const events = getCalendarEventsCached_().filter(function (ev) { return ev.location === hidden; });
    const counts = getParticipantCounts_(events.map(function (ev) { return ev.eventid; }));
    return events.map(function (ev) {
      return Object.assign({}, ev, { participantCount: counts[ev.eventid] || 0 });
    });
  });
}

// 画面用: 自分が作成したイベント一覧
function getMyEvents(userid) {
  return runForClient_('自分のイベントの取得', function () {
    if (!userid) return [];
    const mine = {};
    getmyeventsid(userid).forEach(function (x) { mine[x.eventid] = true; });
    return getCalendarEventsCached_().filter(function (ev) { return mine[ev.eventid]; });
  });
}

function parseDate_(value) {
  if (value === '' || value === null || value === undefined) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function validateEventInput_(data) {
  if (!data) throw userError_('イベント情報がありません。');
  const title = String(data.title || '').trim();
  if (!title) throw userError_('タイトルを入力してください。');
  if (title.length > 200) throw userError_('タイトルは200文字以内にしてください。');
  const start = parseDate_(data.startTime);
  const end = parseDate_(data.endTime);
  if (!start || !end) throw userError_('開始日時と終了日時を入力してください。');
  if (end.getTime() <= start.getTime()) throw userError_('終了日時は開始日時より後にしてください。');
  const rule = findRuleByHidden_(data.rule);
  if (!rule) throw userError_('ルールを選択してください。');
  if ((data.platform && data.platform !== rule[0]) || (data.version && data.version !== rule[1])) {
    throw userError_('プラットフォーム・バージョンとルールが一致しません。ルールを選び直してください。');
  }
  const description = String(data.description || '');
  if (description.length > 5000) throw userError_('説明は5000文字以内にしてください。');
  return { title: title, start: start, end: end, rule: rule, description: description };
}

// eventid シートに「イベントID, 作成者のユーザーID」を記録する
// appendRow は他の人の追加と重ならない（行の取り合いが起きない）ので、ロックは不要
function setEventRow_(sheet, userid, eventid) {
  const data = readSheetValues_(sheet);
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === eventid) return;  // 登録済み
  }
  sheet.appendRow([eventid, userid]);
}

function setEvent(userid, eventid) {
  setEventRow_(getSheet_(SHEET_EVENTID), userid, eventid);
}

function isEventOwner_(eventId, userid) {
  if (!eventId || !userid) return false;
  return readSheetValues_(getSheet_(SHEET_EVENTID)).some(function (r) {
    return r[0] === eventId && r[1] === userid;
  });
}

// カレンダーにイベントを追加
function addCalendarEvent(eventData, userid) {
  try {
    if (!userid) throw userError_('ユーザーIDがありません。ページを再読み込みしてください。');
    const input = validateEventInput_(eventData);
    const requestKey = eventData.requestId ? 'addEvent:' + String(eventData.requestId).slice(0, 80) : '';

    // カレンダーとシートを先に開く（ここで失敗しても「登録中」の印が残らないように）
    // カレンダーへの登録は時間がかかるので、ロックは使わない（他の人の書き込みを待たせない）
    const calendar = getCalendar_();
    const sheet = getSheet_(SHEET_EVENTID);

    // 同じ送信（タイムアウト後の押し直しなど）なら、2回目は登録しない
    if (requestKey) {
      const previous = safeCacheGet_(requestKey);
      if (previous) {
        const info = JSON.parse(previous);
        if (info.pending) return { success: false, message: "同じイベントを登録中です。少し待ってから「イベント変更・削除」で確認してください。" };
        return { success: true, message: "イベントが正常に追加されました。（同じ内容の送信を検出したため、二重登録はしていません）" };
      }
      safeCachePut_(requestKey, JSON.stringify({ pending: true }), ADD_EVENT_DEDUP_SECONDS);
    }

    let eventid;
    try {
      const event = calendar.createEvent(input.title, input.start, input.end, {
        location: input.rule[3],
        description: input.description,
      });
      eventid = event.getId();
      try {
        setEventRow_(sheet, userid, eventid);
      } catch (e) {
        // シートに記録できないと作成者が編集・削除できなくなるため、カレンダー側も取り消す
        try {
          event.deleteEvent();
        } catch (rollbackError) {
          console.error('イベント追加の取り消しに失敗しました(' + eventid + '): ' + rollbackError);
        }
        throw e;
      }
    } catch (e) {
      if (requestKey) safeCacheRemove_(requestKey);  // 失敗したら押し直せるようにする
      throw e;
    }
    if (requestKey) safeCachePut_(requestKey, JSON.stringify({ eventid: eventid }), ADD_EVENT_DEDUP_SECONDS);

    invalidateCalendarCache_();

    let message = "イベントが正常に追加されました。";
    const content = buildEventMessage_('イベントが登録されました。', input.title, input.start, input.end, input.rule, input.description, null);
    if (!notifyEventChannel_(content)) message += "\n（Discord への通知は送信できませんでした）";
    return { success: true, message: message };
  } catch (error) {
    console.error('addCalendarEvent: ' + ((error && error.stack) || error));
    return { success: false, message: friendlyMessage_(error, 'イベントの追加') };
  }
}

function getmyeventsid(userid) {
  const myeventsid = [];
  const data = readSheetValues_(getSheet_(SHEET_EVENTID));
  for (let i = 0; i < data.length; i++) {
    if (data[i][1] === userid) {
      myeventsid.push({ eventid: data[i][0] });
    } else if (data[i][0] === "") {
      break;
    }
  }
  return myeventsid;
}

// カレンダーのイベントを変更（開始・終了日時）
function updateCalendarEvent(eventId, newEventData, userid) {
  try {
    const start = parseDate_(newEventData && newEventData.startDateTime);
    const end = parseDate_(newEventData && newEventData.endDateTime);
    if (!start || !end) return { success: false, message: "無効な日時が指定されました。" };
    if (end.getTime() <= start.getTime()) return { success: false, message: "終了日時は開始日時より後にしてください。" };
    if (!isEventOwner_(eventId, userid)) return { success: false, message: "このイベントを変更できるのは作成者だけです。" };

    const calendar = getCalendar_();
    // 期間で探すと、重ならない時間に移動したときに見つからないため ID で直接取得する
    const event = withRetry_(function () { return calendar.getEventById(eventId); }, 'calendar.getEventById');
    if (!event) return { success: false, message: "イベントが見つかりません。" };

    const oldTimes = { start: event.getStartTime(), end: event.getEndTime() };
    withRetry_(function () { event.setTime(start, end); }, 'calendar.setTime');
    invalidateCalendarCache_();

    let message = "イベントが正常に更新されました。";
    const rule = findRuleByHidden_(event.getLocation());
    if (rule) {
      const content = buildEventMessage_('イベントが更新されました。', event.getTitle(), start, end, rule, event.getDescription(), oldTimes);
      if (!notifyEventChannel_(content)) message += "\n（Discord への通知は送信できませんでした）";
    }
    return { success: true, message: message };
  } catch (error) {
    console.error('updateCalendarEvent: ' + ((error && error.stack) || error));
    return { success: false, message: friendlyMessage_(error, 'イベントの更新') };
  }
}

// カレンダーのイベントを削除
function deleteCalendarEvent(eventId, newEventData, userid) {
  try {
    if (!isEventOwner_(eventId, userid)) return { success: false, message: "このイベントを削除できるのは作成者だけです。" };
    const calendar = getCalendar_();
    const event = withRetry_(function () { return calendar.getEventById(eventId); }, 'calendar.getEventById');
    if (!event) return { success: false, message: "イベントが見つかりません。" };
    event.deleteEvent();  // 二重削除を避けるため再試行はしない
    invalidateCalendarCache_();
    return { success: true, message: "イベントが正常に削除されました。" };
  } catch (error) {
    console.error('deleteCalendarEvent: ' + ((error && error.stack) || error));
    return { success: false, message: friendlyMessage_(error, 'イベントの削除') };
  }
}

// イベントの参加予定を登録し、登録後の参加予定人数を返す
function setparticipateEvent(eventid, userid) {
  return runForClient_('参加予定の登録', function () {
    if (!eventid || !userid) throw userError_('イベントまたはユーザーの情報がありません。画面を更新してください。');
    const sheet = getSheet_(SHEET_EVENTDETAIL);  // シートはロックの外で開いておく
    return withLock_(function () {
      const data = readSheetValues_(sheet);

      // 1行目の2列目以降からユーザーIDの列を探す（なければ空き列に追加）
      let userCol = -1;
      let userFound = false;
      for (let i = 1; i < data[0].length; i++) {
        if (data[0][i] === userid) {
          userFound = true;
          userCol = i + 1;
          break;
        } else if (data[0][i] === "") {
          userCol = i + 1;
          break;
        }
      }
      if (userCol === -1) userCol = data[0].length + 1;
      if (!userFound) sheet.getRange(1, userCol).setValue(userid);

      // 2行目以降からイベントIDの行を探す（なければ空き行に追加）
      let eventRow = -1;
      let eventFound = false;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === eventid) {
          eventFound = true;
          eventRow = i + 1;
          break;
        } else if (data[i][0] === "") {
          eventRow = i + 1;
          break;
        }
      }
      if (eventRow === -1) eventRow = data.length + 1;
      if (!eventFound) sheet.getRange(eventRow, 1).setValue(eventid);

      sheet.getRange(eventRow, userCol).setValue("1");

      // 登録後の参加予定人数（読み直さずに、読み込んだ内容から数える）
      const rowValues = eventFound ? data[eventRow - 1] : [];
      let count = 1;  // 自分
      for (let j = 1; j < rowValues.length; j++) {
        if (j !== userCol - 1 && rowValues[j] == 1) count++;
      }
      return count;
    }, LOCK_TIMEOUT_MS, '参加予定の登録');
  });
}

// 複数イベントの参加予定人数をまとめて取得する（eventdetail シートを1回読むだけ）
function getParticipantCounts_(eventIds) {
  const result = {};
  if (!eventIds || eventIds.length === 0) return result;
  const wanted = {};
  eventIds.forEach(function (id) { wanted[id] = true; });
  const data = readSheetValues_(getSheet_(SHEET_EVENTDETAIL));
  for (let i = 1; i < data.length; i++) {
    const id = data[i][0];
    if (!wanted[id] || Object.prototype.hasOwnProperty.call(result, id)) continue;
    let count = 0;
    for (let j = 1; j < data[0].length; j++) {
      if (data[i][j] == 1) count++;
    }
    result[id] = count;
  }
  return result;
}

function getparticipateEvent(eventid) {
  try {
    return getParticipantCounts_([eventid])[eventid] || 0;
  } catch (e) {
    console.error('getparticipateEvent: ' + e);
    return 0;
  }
}


// =====================================================================
//  イベントのリマインド通知（トリガー用）
// =====================================================================
function sendNotificationToDiscord_CalendarEvent(event, timeType) {
  const rule = findRuleByHidden_(event.getLocation());
  if (!rule) return false;
  const header = (timeType == 1)
    ? "以下イベントが24時間以内に予定されています。"
    : "以下イベントが1時間以内に予定されています。";
  const content = buildEventMessage_(header, event.getTitle(), event.getStartTime(), event.getEndTime(), rule, event.getDescription(), null);
  return notifyEventChannel_(content);
}

function sendNotificationToDiscord_CalendarEventsWithin24Hours() {
  notifyUpcomingEvents_(24, 2, 1);  // eventid シートの C 列に送信済みフラグ
}

function sendNotificationToDiscord_CalendarEventsWithin1Hours() {
  notifyUpcomingEvents_(1, 3, 2);   // eventid シートの D 列に送信済みフラグ
}

function notifyUpcomingEvents_(hours, flagColumnIndex, timeType) {
  const sheet = getSheet_(SHEET_EVENTID);
  const data = readSheetValues_(sheet);
  const calendar = getCalendar_();

  const now = new Date();
  const until = new Date(now);
  until.setHours(now.getHours() + hours);
  const events = withRetry_(function () { return calendar.getEvents(now, until); }, 'calendar.getEvents');

  const rowById = {};
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === "") break;
    if (!Object.prototype.hasOwnProperty.call(rowById, data[i][0])) rowById[data[i][0]] = i;
  }

  events.forEach(function (event) {
    try {
      const id = event.getId();
      if (!Object.prototype.hasOwnProperty.call(rowById, id)) return;
      const i = rowById[id];
      if (data[i][flagColumnIndex] == "1") return;
      // 送信できたときだけ「送信済み」にする（失敗したら次回のトリガーで再送）
      if (sendNotificationToDiscord_CalendarEvent(event, timeType)) {
        sheet.getRange(i + 1, flagColumnIndex + 1).setValue("1");
      }
    } catch (e) {
      console.error('リマインド通知エラー: ' + ((e && e.stack) || e));
    }
  });
}


// =====================================================================
//  参加表明（hiddentime シート）
// =====================================================================

// 画面用: 参加表明を登録して Discord に通知する
// 戻り値 { success, code, message }  code: 1=新規登録 / 2=時刻を延長 / 0=更新なし（既存の方が遅い）
function setParticipationClosed(hidden, dateTime) {
  return runForClient_('参加表明', function () {
    const rule = findRuleByHidden_(hidden);
    if (!rule) throw userError_('ルールが見つかりません。画面を更新してからもう一度お試しください。');
    const newTime = parseDate_(dateTime);
    if (!newTime) throw userError_('参加表明の日時が正しくありません。');
    if (newTime.getTime() < Date.now() - 60 * 1000) throw userError_('参加表明の日時は現在より後にしてください。');

    const sheet = getSheet_(SHEET_HIDDENTIME);  // シートはロックの外で開いておく
    const code = withLock_(function () {
      const data = readSheetValues_(sheet);
      for (let i = 0; i < data.length; i++) {
        if (data[i][0] !== hidden) continue;
        const existing = parseDate_(data[i][1]);
        if (!existing) {
          sheet.getRange(i + 1, 2).setValue(dateTime);
          return 1;
        }
        existing.setSeconds(0, 0);
        const compareTime = new Date(newTime.getTime());
        compareTime.setSeconds(0, 0);
        if (compareTime > existing) {
          sheet.getRange(i + 1, 2).setValue(dateTime);
          return 2;
        }
        return 0;
      }
      return -1;
    }, LOCK_TIMEOUT_MS, '参加表明');

    if (code === -1) throw userError_('このルールは参加表明の対象外です（hiddentime シートに登録がありません）。');
    if (code === 0) {
      return { success: true, code: 0, message: '既に同じか、より遅い時刻までの参加表明があるため更新しませんでした。' };
    }
    invalidateSnapshot_();

    const messagecontent = "以下のルールで、[" + formatDateTime(dateTime) + "]までの対戦参加表明が行われました。\n\n"
      + "環境 : " + rule[0] + "\n"
      + "バージョン : " + rule[1] + "\n"
      + "ルール : " + rule[9] + "\n\n"
      + "参加表明は、待機とは異なり、この時間で参加できる人がいるか、いたら参加したいという表明です。\n"
      + "参加できる方はこちらのDiscord通知に〇などのスタンプで反応してください\n"
      + "参加表明を取り消したい場合はこちらのDiscord通知に×などのスタンプで反応してください\n";
    const notified = postDiscord_(getWebhookUrl_(rule[0], rule[1]), messagecontent);

    let message = (code === 1) ? '参加表明を登録しました' : '参加表明の時刻を延長しました';
    message += notified ? '（Discord に通知しました）' : '（Discord への通知は送信できませんでした）';
    return { success: true, code: code, message: message, notified: notified };
  });
}

// 【トリガー用】期限切れの参加表明を消して Discord に通知する
function deleteOldTime() {
  const now = Date.now();
  const sheet = getSheet_(SHEET_HIDDENTIME);
  const hasExpired = readSheetValues_(sheet).some(function (r) {
    const time = parseDate_(r[1]);
    return time && time.getTime() < now;
  });
  if (!hasExpired) return false;  // 期限切れがなければロックを取らずに終わる（毎分のトリガーで他の人を待たせない）

  const expired = withLock_(function () {
    const data = readSheetValues_(sheet);
    const list = [];
    for (let k = 0; k < data.length; k++) {
      const time = parseDate_(data[k][1]);
      if (!time || time.getTime() >= now) continue;
      const rule = findRuleByHidden_(data[k][0]);
      if (!rule) continue;
      sheet.getRange(k + 1, 2).setValue("");
      list.push({ rule: rule, notify: now - time.getTime() <= EXPIRED_NOTIFY_WITHIN_MS });
    }
    return list;
  }, LOCK_TIMEOUT_MS, '期限切れの参加表明の削除');

  if (expired.length === 0) return false;
  invalidateSnapshot_();
  expired.forEach(function (item) {
    if (!item.notify) return;  // ずっと前に切れていたもの（トリガー停止中など）は通知しない
    const rule = item.rule;
    const messagecontent = "以下のルールの対戦参加表明がタイムアウト・終了しました。\n\n"
      + "環境 : " + rule[0] + "\n"
      + "バージョン : " + rule[1] + "\n"
      + "ルール : " + rule[9] + "\n";
    postDiscord_(getWebhookUrl_(rule[0], rule[1]), messagecontent);
  });
  return 1;
}

function formatDateTime(dateTimeString) {
  const date = new Date(dateTimeString);  // '2025-05-03T18:30' などをパース
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  const hours = ('0' + date.getHours()).slice(-2);
  const minutes = ('0' + date.getMinutes()).slice(-2);
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}
