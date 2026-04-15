// =====================================================
// APPS SCRIPT — Check-in Học Viên
// Paste toàn bộ vào Extensions > Apps Script
// Deploy as Web App: Execute as Me, Anyone can access
// =====================================================

// Sheet "HocVien": STT | Họ Tên | Số Điện Thoại | Ngày 1 | Ngày 2
// Sheet "Checkin":  Thời gian | Tên | SĐT | Ngày

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'check') return checkStatus(e);
  if (action === 'stats') return getStats();
  return ContentService.createTextOutput('OK');
}

function doPost(e) {
  const action = e.parameter.action;
  if (action === 'checkin') return doCheckin(e);
  return ContentService.createTextOutput('OK');
}

// ---- CHECK-IN ----
function doCheckin(e) {
  const phone = e.parameter.phone || '';
  const day   = parseInt(e.parameter.day) || 1;
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('HocVien');
  const log   = ss.getSheetByName('Checkin');

  if (!sheet) return json({status:'error', msg:'Không tìm thấy sheet HocVien'});

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (samePhone(phone, String(data[i][2]))) {
      const colDay = day === 1 ? 3 : 4;
      if (data[i][colDay] === '✓') {
        return json({status:'already', name: data[i][1]});
      }
      sheet.getRange(i + 1, colDay + 1).setValue('✓');
      if (log) log.appendRow([new Date(), data[i][1], phone, 'Ngày ' + day]);
      return json({status:'ok', name: data[i][1]});
    }
  }
  return json({status:'not_found'});
}

// ---- CHECK TRẠNG THÁI (GET) ----
function checkStatus(e) {
  const phone = e.parameter.phone || '';
  const day   = parseInt(e.parameter.day) || 1;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('HocVien');
  if (!sheet) return json({status:'error'});

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (samePhone(phone, String(data[i][2]))) {
      const colDay = day === 1 ? 3 : 4;
      return json({status: data[i][colDay] === '✓' ? 'already' : 'ok', name: data[i][1]});
    }
  }
  return json({status:'not_found'});
}

// ---- THỐNG KÊ ----
function getStats() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('HocVien');
  if (!sheet) return json({day1:0, day2:0});
  const data = sheet.getDataRange().getValues();
  let d1 = 0, d2 = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][3] === '✓') d1++;
    if (data[i][4] === '✓') d2++;
  }
  return json({day1: d1, day2: d2});
}

// ---- HELPERS ----

// Bỏ tất cả ký tự không phải số, bỏ đầu 84 hoặc 0 → lấy 9 số cuối
function stripPhone(p) {
  p = p.replace(/\D/g, '');
  if (p.startsWith('84')) p = p.slice(2);
  if (p.startsWith('0'))  p = p.slice(1);
  return p;
}

// So sánh 2 SĐT bất kể có số 0 đầu hay không
function samePhone(a, b) {
  const sa = stripPhone(a);
  const sb = stripPhone(b);
  return sa.length >= 9 && sb.length >= 9 && sa === sb;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
