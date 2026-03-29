/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * HASS PDF Generator — Google Sheets 템플릿 버전
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * · 템플릿 복사 → 셀 입력 → (예진표·관리조사서) PDF → Drive 저장
 * · hass-app `buildGasPayload` / `lib/gas-payload.ts` 와 맞춤
 * · 예진표: 등록번호 셀 미기입 (앱에서 필드 제거됨)
 * · 예진표 질문: consent_*, pre_q* → 시트용 q13~q27 자동 대응
 * · PDF: 가시 시트 각각 1장에 가깝게 맞춤(scale=4) + 여백 축소
 *
 * 배포: 스크립트 속성에 HASS_SECRET 권장. 없으면 아래 CONFIG.SECRET 사용.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

// ==========================================
// 설정
// ==========================================
var CONFIG = {
  TEMPLATE_SHEET_ID: '1Ul8YexbpTs44sLxfAUlHEDQUx-76gYbV4xyXcjOA6Ds',
  ROSTER_SHEET_ID: '1nVOPeU9vC9NgcB2fsBk_kkDucOvjCw-OiKna_XLVZNE',
  /** 프로덕션에서는 Script properties → HASS_SECRET 사용 권장 */
  SECRET: 'hass-pdf-secure-2026',
  PDF_FOLDER_ID: '1_CZZt6sE0p_Qg77_xg-HDqFzMGL0K7cL',
};

var SHEET_NAMES = {
  SCREENING: '예진표',
  SURVEY: '관리조사서',
  ROSTER: '인력 명단',
};

/**
 * 예진표 셀 매핑 (등록번호 제거 — H5 비움, 템플릿에서 행 숨김 가능)
 */
var SCREENING_CELL_MAPPING = {
  성명: 'C5',
  생년월일: 'C6',
  전화번호: 'I7',
  국적: 'H6',
  성별: 'L5',
  q13_yes: 'L13',
  q13_no: 'M13',
  q14_yes: 'L14',
  q14_no: 'M14',
  q15_yes: 'L15',
  q15_no: 'M15',
  q18_yes: 'L18',
  q18_no: 'M18',
  q19_yes: 'L19',
  q19_no: 'M19',
  q20_yes: 'L20',
  q20_no: 'M20',
  q21_yes: 'L21',
  q21_no: 'M21',
  q22_yes: 'L22',
  q22_no: 'M22',
  q23_yes: 'L23',
  q23_no: 'M23',
  q24_yes: 'L24',
  q24_no: 'M24',
  q25_yes: 'L25',
  q25_no: 'M25',
  q26_yes: 'L26',
  q26_no: 'M26',
  q27_yes: 'L27',
  q27_no: 'M27',
  보호자성명: 'E30',
  관계: 'L30',
};

var SURVEY_CELL_MAPPING = {
  성명: 'C13',
  신분증확인: 'G13',
  성별: 'J13',
  주소: 'C14',
  생년월일: 'I15',
  연락처: 'I16',
  국적: 'H18',
  주민번호: 'I19',
  외국인국적: 'H20',
  외국인번호: 'H21',
};

var ROSTER_TABLE_CONFIG = {
  START_ROW: 10,
  COLUMNS: {
    순번: 'A',
    성별: 'B',
    성명: 'C',
    주소: 'D',
    생년월일: 'E',
    등록번호: 'F',
    연락처: 'H',
    국적: 'I',
    접종: 'J',
  },
};

/**
 * HASS 앱 필드 → 시트용 q13~q27 (값은 yes/no 등 원본)
 * 순서: 동의 3 + 문진 10 = buildGasPayload / prescreen-meta 와 동일
 */
var HASS_TO_Q_KEYS = [
  ['consent_precheck_history', 'q13'],
  ['consent_sms_schedule', 'q14'],
  ['consent_sms_adverse', 'q15'],
  ['pre_q1_sick', 'q18'],
  ['pre_q2_allergy', 'q19'],
  ['pre_q3_prior_reaction', 'q20'],
  ['pre_q4_chronic', 'q21'],
  ['pre_q5_neuro', 'q22'],
  ['pre_q6_cancer_immune', 'q23'],
  ['pre_q7_steroid_etc', 'q24'],
  ['pre_q8_transfusion', 'q25'],
  ['pre_q9_recent_vax', 'q26'],
  ['pre_q10_pregnancy', 'q27'],
];

var ALIASES = {
  성명: ['applicant_name', 'applicantName', 'name', 'fullName', 'applicant'],
  성별: ['gender', 'sex'],
  생년월일: ['birth_date', 'birthDate', 'dob', 'date_of_birth'],
  국적: ['nationality', 'nation'],
  전화번호: ['phone', 'mobile', 'contact', 'phone_number'],
  연락처: ['phone', 'mobile', 'contact', 'phone_number'],
  /** 인력명단 F열 등 — 주민·외국인·예진 등록번호 후보 */
  등록번호: ['personal_no', 'personalNo', 'id_number', 'registration_no', 'registrationNumber', 'resident_no', 'residentNo'],
  접종: ['vaccination_status', 'vaccinationStatus', 'vaccine_status', 'vaccineStatus'],
  보호자성명: ['guardian_name', 'guardianName', 'parent_name'],
  관계: ['relationship', 'relation'],
  q13: ['q13', 'screening.q13', 'consent_precheck_history'],
  q14: ['q14', 'screening.q14', 'consent_sms_schedule'],
  q15: ['q15', 'screening.q15', 'consent_sms_adverse'],
  q18: ['q18', 'screening.q18', 'pre_q1_sick'],
  q19: ['q19', 'screening.q19', 'pre_q2_allergy'],
  q20: ['q20', 'screening.q20', 'pre_q3_prior_reaction'],
  q21: ['q21', 'screening.q21', 'pre_q4_chronic'],
  q22: ['q22', 'screening.q22', 'pre_q5_neuro'],
  q23: ['q23', 'screening.q23', 'pre_q6_cancer_immune'],
  q24: ['q24', 'screening.q24', 'pre_q7_steroid_etc'],
  q25: ['q25', 'screening.q25', 'pre_q8_transfusion'],
  q26: ['q26', 'screening.q26', 'pre_q9_recent_vax'],
  q27: ['q27', 'screening.q27', 'pre_q10_pregnancy'],
  주소: ['address', 'full_address'],
  신분증확인: ['id_verified', 'idVerified', 'id_check'],
  주민번호: ['resident_no', 'residentNo', 'ssn', 'registrationNumber'],
  외국인국적: ['foreigner_nationality', 'foreignerNationality'],
  외국인번호: ['foreigner_no', 'foreignerNo', 'alien_registration_no'],
};

// ==========================================
// 시크릿
// ==========================================
function getExpectedSecret() {
  var p = PropertiesService.getScriptProperties().getProperty('HASS_SECRET');
  return (p && String(p).trim()) ? String(p).trim() : CONFIG.SECRET;
}

// ==========================================
// HASS 페이로드 → q13~q27 복사 (빈 q만 채움)
// ==========================================
function applyHassScreeningAliases(input) {
  var o = {};
  Object.keys(input).forEach(function (k) {
    o[k] = input[k];
  });
  for (var i = 0; i < HASS_TO_Q_KEYS.length; i++) {
    var appKey = HASS_TO_Q_KEYS[i][0];
    var qKey = HASS_TO_Q_KEYS[i][1];
    var emptyQ = o[qKey] == null || o[qKey] === '';
    var hasApp = o[appKey] != null && o[appKey] !== '';
    if (emptyQ && hasApp) o[qKey] = o[appKey];
  }
  return o;
}

function normalizeValue(korKey, rawVal) {
  if (rawVal == null) return '';
  var v = String(rawVal).trim();
  if (!v) return '';

  if (korKey === '연락처' || korKey === '전화번호') {
    return formatPhone(v);
  }

  if (korKey === '성별') {
    var low = v.toLowerCase();
    if (['m', 'male', '남', '남자'].indexOf(low) !== -1) return '남';
    if (['f', 'female', '여', '여자'].indexOf(low) !== -1) return '여';
    return v;
  }

  if (korKey === '신분증확인') {
    var low2 = v.toLowerCase();
    var checked = ['1', 'y', 'yes', 'true', '확인', 'verified', 'checked'];
    for (var c = 0; c < checked.length; c++) {
      if (low2.indexOf(checked[c]) !== -1) return 'ㅁ확인';
    }
    return 'ㅁ미확인';
  }

  if (korKey === '국적') {
    var low3 = v.toLowerCase();
    if (low3.indexOf('한국') !== -1 || low3.indexOf('대한민국') !== -1 || low3.indexOf('korea') !== -1 || low3 === '내국인') {
      return '내국인';
    }
    return v;
  }

  if (korKey === '접종') {
    var low4 = v.toLowerCase();
    var vaccinated = ['1', 'y', 'yes', 'true', 'o', 'ok', '예', '기접종', 'vaccinated'];
    var notVaccinated = ['0', 'n', 'no', 'false', 'x', '아니오', '미접종', 'not-vaccinated', 'not_vaccinated'];
    for (var i1 = 0; i1 < vaccinated.length; i1++) {
      if (low4.indexOf(vaccinated[i1]) !== -1) return 'O';
    }
    for (var i2 = 0; i2 < notVaccinated.length; i2++) {
      if (low4.indexOf(notVaccinated[i2]) !== -1) return 'X';
    }
    return v;
  }

  if (korKey.indexOf('q') === 0 && korKey.indexOf('_') === -1) {
    var low5 = v.toLowerCase();
    var yes = ['1', 'y', 'yes', 'true', 'o', 'ok', '예'];
    var no = ['0', 'n', 'no', 'false', 'x', '아니오'];
    if (yes.indexOf(low5) !== -1) return '예';
    if (no.indexOf(low5) !== -1) return '아니오';
    return v;
  }

  if (korKey.indexOf('_yes') !== -1) {
    return v === '예' ? '예V' : '';
  }
  if (korKey.indexOf('_no') !== -1) {
    return v === '아니오' ? '아니오V' : '';
  }

  return v;
}

function buildKoreanInputMap(input, cellMapping) {
  var out = {};
  var src = Object.assign({}, input);
  if (input.screening && typeof input.screening === 'object') {
    Object.keys(input.screening).forEach(function (key) {
      src[key] = input.screening[key];
    });
  }
  src = applyHassScreeningAliases(src);

  Object.keys(cellMapping).forEach(function (korKey) {
    if (korKey.indexOf('_yes') !== -1 || korKey.indexOf('_no') !== -1) {
      var baseKey = korKey.replace('_yes', '').replace('_no', '');
      var cand = ALIASES[baseKey] || [];
      var originalValue = '';
      for (var i = 0; i < cand.length; i++) {
        var ck = cand[i];
        if (src[ck] != null && src[ck] !== '') {
          originalValue = src[ck];
          break;
        }
      }
      var normalized = normalizeValue(baseKey, originalValue);
      out[korKey] = normalizeValue(korKey, normalized);
      return;
    }

    if (src[korKey] != null && src[korKey] !== '') {
      out[korKey] = normalizeValue(korKey, src[korKey]);
      return;
    }

    var cand2 = ALIASES[korKey] || [];
    var found = '';
    for (var j = 0; j < cand2.length; j++) {
      var ck2 = cand2[j];
      if (src[ck2] != null && src[ck2] !== '') {
        found = src[ck2];
        break;
      }
    }
    out[korKey] = normalizeValue(korKey, found);
  });

  return out;
}

function parseRequest(e) {
  var raw = (e && e.postData && e.postData.contents) || '{}';
  var rawInput = JSON.parse(raw);

  var merged = applyHassScreeningAliases(rawInput);

  var screeningData = buildKoreanInputMap(merged, SCREENING_CELL_MAPPING);
  var surveyData = buildKoreanInputMap(merged, SURVEY_CELL_MAPPING);

  var signatureData = rawInput.signature_screening || rawInput.signatureData || '';

  return {
    screening: screeningData,
    survey: surveyData,
    secret: rawInput.secret,
    signature_screening_image: signatureData,
    signature_survey_image: rawInput.signature_survey || signatureData,
    rawInput: rawInput,
  };
}

function doPost(e) {
  try {
    var input = parseRequest(e);
    if (input.secret !== getExpectedSecret()) {
      return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
    }

    var copyId = copyTemplate(input);
    if (!copyId) {
      return jsonResponse({ ok: false, error: '템플릿 복사 실패' }, 500);
    }

    var fillResult = fillAllSheets(copyId, input);
    var pdfFile = convertSheetToPDF(copyId, input);
    if (!pdfFile) {
      return jsonResponse({ ok: false, error: 'PDF 생성 실패' }, 500);
    }

    deleteTempSheet(copyId);

    return jsonResponse({
      ok: true,
      pdfId: pdfFile.getId(),
      pdfUrl: 'https://drive.google.com/uc?export=download&id=' + pdfFile.getId(),
      fileName: pdfFile.getName(),
      filledCells: {
        screening: fillResult.screeningSuccess,
        survey: fillResult.surveySuccess,
        roster: fillResult.rosterSuccess || 0,
        total: fillResult.totalSuccess,
      },
      emptyCells: {
        screening: fillResult.screeningEmpty,
        survey: fillResult.surveyEmpty,
      },
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error.message || error) }, 500);
  }
}

function copyTemplate(data) {
  try {
    var baseFile = DriveApp.getFileById(CONFIG.TEMPLATE_SHEET_ID);
    var timestamp = Utilities.formatDate(new Date(), 'GMT+9', 'yyyyMMdd_HHmmss');
    var applicantName = (data.screening && data.screening['성명']) || (data.survey && data.survey['성명']) || 'Unknown';
    var fileName = '[TEMP] ' + applicantName + '_' + timestamp;
    var copy = baseFile.makeCopy(fileName);
    Utilities.sleep(2000);
    return copy.getId();
  } catch (error) {
    Logger.log('copyTemplate: ' + error.message);
    return null;
  }
}

function fillSheetData(sheet, data, cellMapping, sheetName) {
  var success = 0;
  var empty = [];
  Object.keys(cellMapping).forEach(function (field) {
    var cellAddress = cellMapping[field];
    var value = data[field] || '';
    try {
      if (value) {
        sheet.getRange(cellAddress).setValue(value);
        success++;
      } else {
        empty.push(field);
      }
    } catch (err) {
      empty.push(field);
    }
  });
  return { success: success, empty: empty };
}

function insertSignatureImage(sheet, signatureBase64, cellAddress) {
  try {
    if (!signatureBase64) return false;
    var base64Data = String(signatureBase64).replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), 'image/png', 'signature.png');
    var columnMatch = cellAddress.match(/^([A-Z]+)/);
    var rowMatch = cellAddress.match(/(\d+)$/);
    if (!columnMatch || !rowMatch) return false;
    var column = columnToNumber(columnMatch[1]);
    var row = parseInt(rowMatch[1], 10);
    var image = sheet.insertImage(blob, column, row, 5, 5);
    image.setWidth(100);
    image.setHeight(50);
    return true;
  } catch (error) {
    Logger.log('insertSignatureImage: ' + error.message);
    return false;
  }
}

function columnToNumber(column) {
  var result = 0;
  for (var i = 0; i < column.length; i++) {
    result = result * 26 + (column.charCodeAt(i) - 64);
  }
  return result;
}

function fillRosterData(sheet, data) {
  try {
    var startRow = ROSTER_TABLE_CONFIG.START_ROW;
    var lastRow = startRow - 1;
    var aColumn = sheet.getRange('A:A').getValues();
    for (var i = startRow - 1; i < aColumn.length; i++) {
      if (aColumn[i][0] && aColumn[i][0] !== '') {
        lastRow = i + 1;
      } else if (i > startRow - 1 && lastRow > startRow - 1) {
        break;
      }
    }
    var newRow = lastRow + 1;
    var newNumber = newRow - startRow + 1;
    var columns = ROSTER_TABLE_CONFIG.COLUMNS;
    var success = 0;

    try {
      sheet.getRange(columns['순번'] + newRow).setValue(newNumber);
      success++;
    } catch (e1) {}

    var rosterKeys = ['성별', '성명', '주소', '생년월일', '등록번호', '연락처', '국적', '접종'];
    for (var f = 0; f < rosterKeys.length; f++) {
      var rk = rosterKeys[f];
      var val = data[rk] || '';
      if (!val) continue;
      try {
        sheet.getRange(columns[rk] + newRow).setValue(val);
        success++;
      } catch (e2) {}
    }

    return { success: success, row: newRow };
  } catch (error) {
    return { success: 0, row: -1 };
  }
}

function setupSheetForPrint(sheet) {
  try {
    var pageBreaks = sheet.getRowPageBreaks();
    for (var i = 0; i < pageBreaks.length; i++) {
      sheet.removePageBreak(pageBreaks[i]);
    }
    var colBreaks = sheet.getColumnPageBreaks();
    for (var j = 0; j < colBreaks.length; j++) {
      sheet.removePageBreak(colBreaks[j]);
    }

    var dataRange = sheet.getDataRange();
    var lastRow = dataRange.getLastRow();
    var lastCol = dataRange.getLastColumn();
    var maxRows = sheet.getMaxRows();
    var maxCols = sheet.getMaxColumns();

    if (maxRows > lastRow + 5) {
      var hideFromRow = lastRow + 6;
      var hideRowCount = maxRows - hideFromRow + 1;
      if (hideRowCount > 0) {
        sheet.hideRows(hideFromRow, hideRowCount);
      }
    }
    if (maxCols > lastCol + 2) {
      var hideFromCol = lastCol + 3;
      var hideColCount = maxCols - hideFromCol + 1;
      if (hideColCount > 0) {
        sheet.hideColumns(hideFromCol, hideColCount);
      }
    }
  } catch (error) {
    Logger.log('setupSheetForPrint: ' + error.message);
  }
}

function fillAllSheets(sheetId, data) {
  try {
    var spreadsheet = SpreadsheetApp.openById(sheetId);

    var screeningSheet = spreadsheet.getSheetByName(SHEET_NAMES.SCREENING) || spreadsheet.getSheets()[0];
    var screeningResult = fillSheetData(screeningSheet, data.screening, SCREENING_CELL_MAPPING, '예진표');

    if (data.signature_screening_image) {
      insertSignatureImage(screeningSheet, data.signature_screening_image, 'H30');
    }

    var surveySheet = spreadsheet.getSheetByName(SHEET_NAMES.SURVEY) || spreadsheet.getSheets()[1] || spreadsheet.getSheets()[0];
    var surveyResult = fillSheetData(surveySheet, data.survey, SURVEY_CELL_MAPPING, '관리조사서');

    if (data.signature_survey_image) {
      insertSignatureImage(surveySheet, data.signature_survey_image, 'J43');
    } else if (data.signature_screening_image) {
      insertSignatureImage(surveySheet, data.signature_screening_image, 'J43');
    }

    var rosterResult = { success: 0 };
    try {
      var rosterSpreadsheet = SpreadsheetApp.openById(CONFIG.ROSTER_SHEET_ID);
      var rosterSheet = rosterSpreadsheet.getSheets()[0];
      var rawInput = data.rawInput || {};
      var rosterData = {
        성별: normalizeValue('성별', rawInput.gender || rawInput.sex || ''),
        성명: rawInput.applicant_name || rawInput.name || rawInput.fullName || '',
        주소: rawInput.address || rawInput.full_address || '',
        생년월일: rawInput.birth_date || rawInput.birthDate || rawInput.dob || '',
        등록번호:
          rawInput.resident_no ||
          rawInput.residentNo ||
          rawInput.personal_no ||
          rawInput.personalNo ||
          rawInput.registrationNumber ||
          '',
        연락처: normalizeValue('연락처', rawInput.phone || rawInput.mobile || rawInput.contact || ''),
        국적: normalizeValue('국적', rawInput.nationality || rawInput.nation || '대한민국'),
        접종: normalizeValue('접종', rawInput.vaccination_status || rawInput.vaccinationStatus || rawInput.vaccine_status || ''),
      };
      rosterResult = fillRosterData(rosterSheet, rosterData);
    } catch (err) {
      Logger.log('roster: ' + err.message);
    }

    SpreadsheetApp.flush();
    Utilities.sleep(1500);

    return {
      screeningSuccess: screeningResult.success,
      screeningEmpty: screeningResult.empty,
      surveySuccess: surveyResult.success,
      surveyEmpty: surveyResult.empty,
      rosterSuccess: rosterResult.success,
      totalSuccess: screeningResult.success + surveyResult.success + rosterResult.success,
    };
  } catch (error) {
    return {
      screeningSuccess: 0,
      screeningEmpty: Object.keys(SCREENING_CELL_MAPPING),
      surveySuccess: 0,
      surveyEmpty: Object.keys(SURVEY_CELL_MAPPING),
      rosterSuccess: 0,
      totalSuccess: 0,
    };
  }
}

/**
 * PDF: scale=4 → 시트당 1페이지에 맞춤(내용 많으면 글자 작아짐).
 *     너무 작으면 scale=2(너비 맞춤)로 바꿔 보세요.
 */
function convertSheetToPDF(sheetId, data) {
  try {
    var now = new Date();
    var dateOnly = Utilities.formatDate(now, 'GMT+9', 'yyyyMMdd');
    var applicantName = (data.screening && data.screening['성명']) || (data.survey && data.survey['성명']) || 'Unknown';
    var pdfName = applicantName + '_조류인플루엔자_예진표_' + dateOnly + '.pdf';

    var spreadsheet = SpreadsheetApp.openById(sheetId);

    try {
      var rosterSheet = spreadsheet.getSheetByName(SHEET_NAMES.ROSTER);
      if (rosterSheet) rosterSheet.hideSheet();
    } catch (e0) {}

    var allSheets = spreadsheet.getSheets();
    for (var s = 0; s < allSheets.length; s++) {
      if (!allSheets[s].isSheetHidden()) {
        setupSheetForPrint(allSheets[s]);
      }
    }

    SpreadsheetApp.flush();
    Utilities.sleep(500);

    /** inches — 여백 축소로 한 장에 더 많이 */
    var url =
      'https://docs.google.com/spreadsheets/d/' +
      sheetId +
      '/export?format=pdf' +
      '&size=A4' +
      '&portrait=true' +
      '&scale=4' +
      '&top_margin=0.25&bottom_margin=0.25&left_margin=0.25&right_margin=0.25' +
      '&sheetnames=false' +
      '&printtitle=false' +
      '&pagenumbers=false' +
      '&gridlines=false' +
      '&fzr=false';

    var token = ScriptApp.getOAuthToken();
    var response = UrlFetchApp.fetch(url, {
      headers: { Authorization: 'Bearer ' + token },
    });

    var pdfBlob = response.getBlob().setName(pdfName);
    var folder = DriveApp.getFolderById(CONFIG.PDF_FOLDER_ID);
    var pdfFile = folder.createFile(pdfBlob);
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return pdfFile;
  } catch (error) {
    Logger.log('convertSheetToPDF: ' + error.message);
    return null;
  }
}

function deleteTempSheet(sheetId) {
  try {
    DriveApp.getFileById(sheetId).setTrashed(true);
  } catch (err) {}
}

function formatPhone(phone) {
  if (!phone) return '';
  var digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2,3})(\d{3,4})(\d{4})/, '$1-$2-$3');
  }
  return phone;
}

function jsonResponse(data, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function doGet() {
  return jsonResponse({
    status: 'HASS PDF Generator (Sheets)',
    version: '4.0',
    templateId: CONFIG.TEMPLATE_SHEET_ID,
    rosterSheetId: CONFIG.ROSTER_SHEET_ID,
    notes: [
      '예진표 등록번호(H5) 매핑 제거',
      'consent_*/pre_q* → q13~q27 자동 매핑',
      'PDF scale=4 + 작은 여백 (2페이지 목표, 필요 시 scale=2로 변경)',
      '시크릿: Script properties HASS_SECRET 권장',
    ],
    screeningFields: Object.keys(SCREENING_CELL_MAPPING).length,
    surveyFields: Object.keys(SURVEY_CELL_MAPPING).length,
    ready: true,
    timestamp: new Date().toISOString(),
  });
}
