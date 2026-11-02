import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APPS_SCRIPT_DEFAULT_URL =
  process.env.APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbx3HihrveSRxxjWGEl60y4vNcCFcb8IPQH3YlkfvwqaGapESvj11BTvXNwke-O7L56v/exec';

const SPREADSHEET_ID = '169L0-gWsPmSez8rXivSX5kt5p278Ry6ZJDU66AC42SY';
const SHEET_NAME = 'قائمة الأشخاص';

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. فحص الاتصال بواجهة Apps Script
  app.get('/api/sheets/status', async (req: Request, res: Response) => {
    try {
      const targetUrl = (req.query.scriptUrl as string) || APPS_SCRIPT_DEFAULT_URL;
      const response = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow',
      });

      const text = await response.text();
      const isHtmlLogin = text.includes('accounts.google.com') || text.includes('ServiceLogin') || text.includes('Page not found');

      res.json({
        spreadsheetId: SPREADSHEET_ID,
        sheetName: SHEET_NAME,
        appsScriptUrl: targetUrl,
        httpStatus: response.status,
        requiresAuthReconfiguration: response.status === 401 || isHtmlLogin,
        message:
          response.status === 200 && !isHtmlLogin
            ? 'الاتصال بواجهة Google Apps Script سليم وجاهز'
            : 'واجهة Apps Script الحالية تعيد صفحة تسجيل دخول (401 / Not Accessible) وتحتاج لضبط الصلاحية لـ Anyone',
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: `تعذر الاتصال بواجهة Apps Script: ${err.message}`,
      });
    }
  });

  // 1.1 جلب وقراءة الأسماء من جدول Google Sheets لمزامنتها في التطبيق
  app.get('/api/sheets/donors', async (req: Request, res: Response) => {
    try {
      // محاولة 1: جلب البيانات عبر رابط CSV المباشر من جدول غوغل
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
      
      const csvResponse = await fetch(gvizUrl, {
        method: 'GET',
        redirect: 'follow',
      });

      const csvText = await csvResponse.text();
      const isHtml = csvText.includes('<!DOCTYPE html>') || csvText.includes('accounts.google.com') || csvText.includes('show-login-page');

      if (!isHtml && csvResponse.ok && csvText.trim().length > 0) {
        // تحليل بيانات CSV
        const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length > 0) {
          const parsedDonors: any[] = [];
          
          // دالة مساعدة لتفكيك أسطر CSV مع الفواصل والاقتباسات
          const parseCsvLine = (line: string): string[] => {
            const values: string[] = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"' || char === '\"') {
                if (inQuotes && line[i + 1] === '"') {
                  current += '"';
                  i++;
                } else {
                  inQuotes = !inQuotes;
                }
              } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            values.push(current.trim());
            return values;
          };

          const header = parseCsvLine(lines[0]).map(h => h.toLowerCase());
          
          // تحديد أعمدة البيانات
          let nameIdx = header.findIndex(h => h.includes('اسم') || h.includes('name') || h.includes('full'));
          let bloodIdx = header.findIndex(h => h.includes('فصيلة') || h.includes('دم') || h.includes('blood') || h.includes('type'));
          let phoneIdx = header.findIndex(h => h.includes('هاتف') || h.includes('رقم') || h.includes('phone') || h.includes('جوال') || h.includes('mobile') || h.includes('تلفون'));
          let addressIdx = header.findIndex(h => h.includes('سكن') || h.includes('عنوان') || h.includes('منطقة') || h.includes('قرية') || h.includes('address') || h.includes('residence') || h.includes('location'));
          let notesIdx = header.findIndex(h => h.includes('ملاحظ') || h.includes('notes') || h.includes('detail') || h.includes('اضاف'));

          // إذا لم نجد العناوين، نعتمد الترتيب الافتراضي (اسم، فصيلة، هاتف، سكن)
          if (nameIdx === -1) nameIdx = 0;
          if (bloodIdx === -1) bloodIdx = 1;
          if (phoneIdx === -1) phoneIdx = 2;
          if (addressIdx === -1) addressIdx = 3;
          if (notesIdx === -1) notesIdx = 4;

          // معالجة الأسطر (بدءاً من السطر 1 أو 0 حسب وجود عنوان)
          const startIndex = (lines[0].includes('اسم') || lines[0].includes('name')) ? 1 : 0;

          for (let i = startIndex; i < lines.length; i++) {
            const cols = parseCsvLine(lines[i]);
            const rawName = cols[nameIdx] || '';
            const rawBlood = cols[bloodIdx] || 'O+';
            const rawPhone = (cols[phoneIdx] || '').replace(/\D/g, '');
            const rawAddress = cols[addressIdx] || 'قعطبة';
            const rawNotes = cols[notesIdx] || '';

            if (rawName && rawName.length >= 2) {
              parsedDonors.push({
                fullName: rawName.replace(/^["']|["']$/g, '').trim(),
                bloodType: rawBlood.replace(/[^ABO\+\-]/gi, '').toUpperCase() || 'O+',
                phone: rawPhone || '770000000',
                residence: rawAddress.replace(/^["']|["']$/g, '').trim() || 'قعطبة',
                notes: rawNotes.replace(/^["']|["']$/g, '').trim(),
                source: 'google_sheets',
              });
            }
          }

          return res.json({
            success: true,
            source: 'csv_direct',
            count: parsedDonors.length,
            donors: parsedDonors,
          });
        }
      }

      // محاولة 2: فحص Google Apps Script إذا كان يدعم getDonors
      try {
        const scriptRes = await fetch(`${APPS_SCRIPT_DEFAULT_URL}?action=getDonors`, {
          method: 'GET',
          redirect: 'follow',
        });
        const scriptText = await scriptRes.text();
        if (scriptRes.ok && !scriptText.includes('<!DOCTYPE html>')) {
          const json = JSON.parse(scriptText);
          if (Array.isArray(json) || Array.isArray(json.donors)) {
            const list = Array.isArray(json) ? json : json.donors;
            return res.json({
              success: true,
              source: 'apps_script',
              count: list.length,
              donors: list,
            });
          }
        }
      } catch (e) {
        // الاستمرار للإشعار التوجيهي
      }

      // إذا تعذر الوصول المباشر بسبب صلاحيات المشاركة (Restricted)
      return res.status(403).json({
        success: false,
        requiresSharePermission: true,
        spreadsheetId: SPREADSHEET_ID,
        sheetName: SHEET_NAME,
        error: 'جدول بيانات غوغل محمي بإذن وصول خاص (Restricted) ويتطلب تسجيل الدخول.',
        guide: {
          step1: 'افتح جدول البيانات عبر الرابط: https://docs.google.com/spreadsheets/d/169L0-gWsPmSez8rXivSX5kt5p278Ry6ZJDU66AC42SY/edit',
          step2: 'اضغط على زر «مشاركة» (Share) في أعلى اليسار.',
          step3: 'في قسم «الوصول العام» (General access)، غيّر الخيار من «مقيّد» (Restricted) إلى «أي شخص لديه الرابط» (Anyone with the link) بصلاحية قارئ (Viewer).',
          step4: 'أو انسخ صفوف الأسماء من الجدول والصقها في خانة المزامنة الفورية السريعة بالتطبيق أدناه.',
        },
      });

    } catch (err: any) {
      console.error('Error fetching donors from Google Sheets:', err);
      res.status(500).json({
        success: false,
        error: `خطأ أثناء الاتصال بجدول البيانات: ${err.message}`,
      });
    }
  });

  // 1.2 استقبال صفوف الأسماء ولصقها مباشرة لمزامنة فورية وسريعة
  app.post('/api/sheets/import-raw', async (req: Request, res: Response) => {
    try {
      const { textData } = req.body;
      if (!textData || typeof textData !== 'string') {
        return res.status(400).json({ success: false, error: 'النص المطلوب فارغ' });
      }

      const lines = textData.split(/\r?\n/).filter(l => l.trim().length > 0);
      const parsedDonors: any[] = [];

      for (const line of lines) {
        // تقسيم عبر tab أو comma أو فواصل
        const parts = line.includes('\t') ? line.split('\t') : line.split(/[,،]/);
        if (parts.length >= 2) {
          const rawName = parts[0]?.trim() || '';
          const rawBlood = parts[1]?.trim().toUpperCase() || 'O+';
          const rawPhone = (parts[2]?.trim() || '').replace(/\D/g, '');
          const rawAddress = parts[3]?.trim() || 'قعطبة';
          const rawNotes = parts[4]?.trim() || '';

          // تجاهل سطر العناوين
          if (rawName.includes('الاسم') || rawName.includes('name')) continue;

          if (rawName.length >= 2) {
            parsedDonors.push({
              fullName: rawName,
              bloodType: rawBlood.match(/^(O|A|B|AB)[\+\-]$/i) ? rawBlood : 'O+',
              phone: rawPhone || '770000000',
              residence: rawAddress,
              notes: rawNotes,
              source: 'manual_import',
            });
          }
        }
      }

      return res.json({
        success: true,
        count: parsedDonors.length,
        donors: parsedDonors,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // 2. تسجيل متبرع أو البحث في Google Sheets
  app.post('/api/sheets/proxy', async (req: Request, res: Response) => {
    console.log('[Proxy] Request body:', JSON.stringify(req.body));
    const { action, name, bloodType, phone, address, notes, donorId, scriptUrl } = req.body;

    if (!action) {
      return res.status(400).json({ success: false, error: 'نوع العملية (action) مطلوب.' });
    }

    try {
      let payload: any = {
        action,
        spreadsheetId: SPREADSHEET_ID,
        sheetName: SHEET_NAME,
      };

      if (action === 'registerDonor') {
        if (!name || !phone || !bloodType) {
          return res.status(400).json({
            success: false,
            error: 'بيانات غير مكتملة: الاسم، فصيلة الدم، ورقم الهاتف مطلوبة التسجيل.',
          });
        }
        payload = {
          ...payload,
          name: String(name).trim(),
          bloodType: String(bloodType).trim(),
          phone: String(phone).trim(),
          address: String(address || '').trim(),
          notes: String(notes || '').trim(),
          donorId: String(donorId || '').trim(),
          createdAt: new Date().toISOString(),
        };
      } else if (action === 'batchRegister') {
        const donorsArray = Array.isArray(req.body.donors) ? req.body.donors : [];
        payload = {
          ...payload,
          donors: donorsArray.map((d: any) => ({
            name: String(d.name || d.fullName || '').trim(),
            bloodType: String(d.bloodType || '').trim(),
            phone: String(d.phone || '').trim(),
            address: String(d.address || d.residence || '').trim(),
            notes: String(d.notes || '').trim(),
            donorId: String(d.donorId || d.id || '').trim(),
            createdAt: d.createdAt || new Date().toISOString(),
          }))
        };
      } else if (action === 'searchDonors') {
        payload = {
          ...payload,
          bloodType: String(bloodType || '').trim(),
        };
      }

      const targetUrl = scriptUrl || APPS_SCRIPT_DEFAULT_URL;
      console.log(`Forwarding ${action} to Google Apps Script:`, targetUrl);

      const scriptResponse = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });

      const responseStatus = scriptResponse.status;
      const responseText = await scriptResponse.text();

      // فحص إذا كان الرد صفحة تسجيل دخول أو غير مسموح
      if (
        responseStatus === 401 ||
        responseText.includes('Page not found') ||
        responseText.includes('ServiceLogin') ||
        responseText.includes('accounts.google.com')
      ) {
        return res.status(401).json({
          success: false,
          error:
            'واجهة Google Apps Script أعادت رمز حماية (401). يرجى التأكد من ضبط إعداد النشر في Apps Script على (Anyone).',
        });
      }

      try {
        const jsonResult = JSON.parse(responseText);
        return res.json({
          success: jsonResult.status === 'success' || jsonResult.result === 'success' || Array.isArray(jsonResult),
          ...jsonResult,
        });
      } catch {
        if (scriptResponse.ok) {
          return res.json({
            success: true,
            message: 'تمت العملية بنجاح.',
            raw: responseText,
          });
        }
        return res.status(500).json({
          success: false,
          error: `استجابة غير متوقعة (كود ${responseStatus}).`,
          details: responseText.substring(0, 150),
        });
      }
    } catch (error: any) {
      console.error('Error proxying to Google Apps Script:', error);
      return res.status(502).json({
        success: false,
        error: `خطأ في الاتصال بواجهة Apps Script: ${error.message}`,
      });
    }
  });

  // Keep old register-donor endpoint for compatibility but redirect to proxy
  app.post('/api/sheets/register-donor', (req, res) => {
    req.body.action = 'registerDonor';
    const proxyUrl = `${req.protocol}://${req.get('host')}/api/sheets/proxy`;
    fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    }).then(r => r.json()).then(data => res.json(data)).catch(e => res.status(500).json({ error: e.message }));
  });

  // Serve .well-known files (Scope Extensions & Digital Asset Links)
  app.use('/.well-known', express.static(path.resolve(__dirname, 'public/.well-known'), {
    dotfiles: 'allow',
    setHeaders: (res) => {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }));

  app.get('/.well-known/web-app-origin-association', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(path.resolve(__dirname, 'public/.well-known/web-app-origin-association'));
  });

  app.get('/.well-known/assetlinks.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(path.resolve(__dirname, 'public/.well-known/assetlinks.json'));
  });

  // Mount Vite middleware in development mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
