/**
 * خدمة الربط بجدول بيانات Google (Google Sheets)
 * معرّف الجدول: 169L0-gWsPmSez8rXivSX5kt5p278Ry6ZJDU66AC42SY
 * اسم ورقة العمل: قائمة الأشخاص
 */

export const GOOGLE_SHEETS_CONFIG = {
  spreadsheetId: '169L0-gWsPmSez8rXivSX5kt5p278Ry6ZJDU66AC42SY',
  sheetName: 'قائمة الأشخاص',
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbx3HihrveSRxxjWGEl60y4vNcCFcb8IPQH3YlkfvwqaGapESvj11BTvXNwke-O7L56v/exec',
};

export interface RegisterDonorPayload {
  name: string;
  bloodType: string;
  phone: string;
  address: string;
  notes?: string;
  donorId?: string;
}

export interface SheetsSyncResult {
  success: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: any;
}

/**
 * إرسال بيانات المتبرع إلى جدول Google Sheets عبر خادم التطبيق وواجهة Apps Script
 * لا تعرض نجاحاً إلا عند تأكيد خادم Google حفظ البيانات فعلياً
 */
export async function syncDonorToGoogleSheets(
  payload: RegisterDonorPayload
): Promise<SheetsSyncResult> {
  try {
    const response = await fetch('/api/sheets/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'registerDonor',
        name: payload.name.trim(),
        bloodType: payload.bloodType.trim(),
        phone: payload.phone.trim(),
        address: payload.address.trim(),
        notes: (payload.notes || '').trim(),
        donorId: payload.donorId || '',
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return {
        success: true,
        message: data.message || 'تم تأكيد حفظ المتبرع في جدول Google Sheets بنجاح.',
        statusCode: response.status,
        data: data,
      };
    } else {
      return {
        success: false,
        error: data.error || `خطأ من الخادم (${response.status})`,
        statusCode: response.status,
      };
    }
  } catch (clientErr: any) {
    return {
      success: false,
      error: `تعذر الاتصال بالخادم: ${clientErr.message}`,
      statusCode: 0,
    };
  }
}

/**
 * البحث عن المتبرعين في جدول Google Sheets
 */
export async function searchDonorsFromSheets(
  bloodType: string
): Promise<SheetsSyncResult> {
  try {
    const response = await fetch('/api/sheets/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'searchDonors',
        bloodType,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return {
        success: true,
        data: data.donors || data,
        statusCode: response.status,
      };
    } else {
      return {
        success: false,
        error: data.error || `خطأ أثناء البحث (${response.status})`,
        statusCode: response.status,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: `خطأ في الاتصال: ${err.message}`,
      statusCode: 0,
    };
  }
}

/**
 * جلب قائمة المتبرعين من جدول Google Sheets لمزامنتها في التطبيق
 */
export async function fetchDonorsFromGoogleSheets(): Promise<{
  success: boolean;
  donors?: any[];
  count?: number;
  error?: string;
  requiresSharePermission?: boolean;
  guide?: any;
}> {
  try {
    const res = await fetch('/api/sheets/donors');
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: `فشل الاتصال بخادم المزامنة: ${err.message}`,
    };
  }
}

/**
 * إرسال نص صفوف منسوخة من جدول البيانات أو ملف CSV للمزامنة المباشرة
 */
export async function importRawDonors(textData: string): Promise<{
  success: boolean;
  donors?: any[];
  count?: number;
  error?: string;
}> {
  try {
    const res = await fetch('/api/sheets/import-raw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ textData }),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: `فشل استيراد البيانات: ${err.message}`,
    };
  }
}
/**
 * إرسال قائمة كاملة من المتبرعين إلى جدول Google Sheets للمزامنة الشاملة
 * يستخدم هذا الخيار لمزامنة كافة بيانات التطبيق مع الجدول دفعة واحدة
 */
export async function pushAllDonorsToSheets(
  donors: any[]
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const response = await fetch('/api/sheets/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'batchRegister',
        donors: donors.map(d => ({
          name: d.fullName || d.name,
          bloodType: d.bloodType,
          phone: d.phone,
          address: d.residence || d.address || 'قعطبة',
          notes: d.notes || '',
          donorId: d.id || d.donorId || ''
        }))
      }),
    });

    const data = await response.json();
    return {
      success: response.ok && data.success,
      count: data.count || 0,
      error: data.error
    };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      error: `فشل المزامنة الشاملة: ${err.message}`
    };
  }
}
