/**
 * ==========================================================================
 * 台北場地 停車位申請 - Google Apps Script (GAS) 後端自動化程式碼
 * ==========================================================================
 * 
 * ⚠️ 重要部署設定提醒：
 * 在「新增部署 / 管理部署」時：
 * 1. 【執行身分 (Execute as)】：必須選擇「我 (Me - 您的帳號 Email)」
 * 2. 【誰有存取權 (Who has access)】：必須選擇「所有人 (Anyone)」
 * 3. 每次修改點擊「部署」時，【版本 (Version)】必須選擇「建立新版本 (New Version)」！
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // 若表單無標題列，自動建立
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        '提交時間', 
        '姓名', 
        'Email', 
        '電話', 
        '車牌號碼', 
        '申請車位類型', 
        'Email 寄送狀態'
      ]);
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#efe7dc');
    }

    // 安全解析前端傳來的 JSON 資料 (防止空資料或測試引發錯誤)
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
    
    var timestamp = new Date();
    var name = data.name || '';
    var email = data.email || '';
    var phone = data.phone || '';
    var plateNumber = data.plateNumber || '';
    var parkingType = data.parkingType || '';

    // 自動發送 HTML 確認信
    var mailStatus = '成功';
    if (email) {
      try {
        sendConfirmationEmail(name, email, phone, plateNumber, parkingType);
      } catch (mailErr) {
        Logger.log('郵件寄送失敗: ' + mailErr.toString());
        mailStatus = '失敗: ' + mailErr.toString();
      }
    } else {
      mailStatus = '未提供 Email';
    }

    // 寫入 Google Sheet 紀錄
    sheet.appendRow([
      timestamp, 
      name, 
      email, 
      phone, 
      plateNumber, 
      parkingType, 
      mailStatus
    ]);

    return ContentService.createTextOutput(JSON.stringify({ 
      result: 'success', 
      message: '資料已成功寫入並發送確認信' 
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('doPost 錯誤: ' + err.toString());
    return ContentService.createTextOutput(JSON.stringify({ 
      result: 'error', 
      message: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } finally {
    lock.releaseLock();
  }
}

/**
 * 手動測試授權函數（若出現權限問題，請選此函數點擊「執行 ▶️」）
 */
function testMailAuthorization() {
  var userEmail = Session.getActiveUser().getEmail();
  Logger.log('正在為帳號授權寄信權限: ' + userEmail);
  GmailApp.sendEmail(userEmail, "【測試】停車場申請系統發信授權成功", "恭喜您！Apps Script Gmail 發信權限已成功授權！");
}

/**
 * 發送 HTML 格式確認信給申請者
 */
function sendConfirmationEmail(name, email, phone, plateNumber, parkingType) {
  var subject = '【停車位抽籤】申請成功確認信 - ' + name;
  
  var htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5dcce; color: #2b2621;">
      <div style="background-color: #1f1c19; color: #f3efe6; padding: 28px 24px; text-align: center; border-bottom: 3px solid #e5a93c;">
        <h1 style="margin: 0 0 8px 0; font-size: 22px; color: #e5a93c;">停車位抽籤申請確認信</h1>
        <p style="margin: 0; font-size: 13px; opacity: 0.85;">TAIPEI CAMPUS PARKING PERMIT APPLICATION</p>
      </div>

      <div style="padding: 28px 24px;">
        <p style="font-size: 16px; font-weight: bold; margin-bottom: 16px; color: #1f1c19;">親愛的 ${name} 您好：</p>
        <p style="font-size: 14px;">我們已成功收到您的 2026 年 9月～12月 停車位抽籤申請！以下是您的申請資料明細：</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #fcf9f5; border-radius: 8px; overflow: hidden; border: 1px solid #efe7dc;">
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #efe7dc; font-weight: bold; color: #787063; width: 35%;">申請人姓名</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #efe7dc; font-weight: bold; color: #1f1c19;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #efe7dc; font-weight: bold; color: #787063;">Email 信箱</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #efe7dc; font-weight: bold; color: #1f1c19;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #efe7dc; font-weight: bold; color: #787063;">聯絡電話</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #efe7dc; font-weight: bold; color: #1f1c19;">${phone}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #efe7dc; font-weight: bold; color: #787063;">車牌號碼</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #efe7dc; font-weight: bold; color: #1f1c19;">${plateNumber}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-weight: bold; color: #787063;">申請車位類別</td>
            <td style="padding: 12px 16px; font-weight: bold; color: #e5a93c;">${parkingType}</td>
          </tr>
        </table>

        <div style="background-color: #fdf8ef; border: 1px dashed #e5a93c; padding: 16px; border-radius: 8px; margin: 24px 0;">
          <h3 style="margin: 0 0 8px 0; color: #b47818; font-size: 15px;">重要抽籤時程提醒</h3>
          <ul style="margin: 0; padding-left: 20px; color: #59441f; font-size: 14px; line-height: 1.6;">
            <li><strong>申請截止時間</strong>：即日起至 2026/8/19 (三) 23:59 截止。</li>
            <li><strong>現場抽籤時間</strong>：<strong>2026/8/21 (五) 11AM</strong>（All Staff Meeting 結束後，請務必親自到場參與抽籤）。</li>
            <li><strong>車位停放期限</strong>：2026年 9月 ～ 12月底。</li>
          </ul>
        </div>

        <p style="font-size: 13px; color: #787063;">若填寫資訊有誤或需要更正，請於 8/19 截止前聯繫行政團隊。感謝您的配合！</p>
      </div>

      <div style="text-align: center; padding: 16px; background-color: #fcf9f5; border-top: 1px solid #efe7dc; color: #9a9082; font-size: 12px;">
        Taipei Campus Administrative Team &copy; 2026 All rights reserved.
      </div>
    </div>
  `;

  GmailApp.sendEmail(email, subject, '', {
    htmlBody: htmlBody,
    name: 'Taipei Campus 行政團隊'
  });
}
