import { BloodType } from '../types';

export const COMMON_LOCATIONS = [
  'قعطبة - المدينة',
  'قعطبة - السوق العام',
  'مريس - الجبارة',
  'مريس - الصدر',
  'مريس - القهرة',
  'الفاخر',
  'سناح',
  'شخب',
  'حمر',
  'قردح',
  'حمك',
  'الضالع',
  'دمت',
  'أخرى (تحديد يدوي)'
];

export const INITIAL_SEED_DONORS: Array<{
  fullName: string;
  bloodType: BloodType;
  phone: string;
  residence: string;
  notes: string;
  isAvailable: boolean;
}> = [
  {
    fullName: 'صالح محمد القعطبي',
    bloodType: 'O+',
    phone: '771234501',
    residence: 'قعطبة - المدينة',
    notes: 'مستعد للتبرع في أي وقت لحالات الطوارئ',
    isAvailable: true,
  },
  {
    fullName: 'عبدالله أحمد المريسي',
    bloodType: 'A+',
    phone: '772345602',
    residence: 'مريس - الجبارة',
    notes: 'متواجد بالقرب من مستشفى السلام',
    isAvailable: true,
  },
  {
    fullName: 'يحيى قاسم الفاخري',
    bloodType: 'B+',
    phone: '773456703',
    residence: 'الفاخر',
    notes: 'جاهز لأي حالة طارئة في قعطبة أو الفاخر',
    isAvailable: true,
  },
  {
    fullName: 'ماجد ناصر الحالمي',
    bloodType: 'O-',
    phone: '774567804',
    residence: 'سناح',
    notes: 'فصيلة O- معطي عام، تحت الطلب فوراً',
    isAvailable: true,
  },
  {
    fullName: 'محسن علي العولقي',
    bloodType: 'AB+',
    phone: '775678905',
    residence: 'قعطبة - الشارع العام',
    notes: 'مستعد للتبرع بالحالات المستعجلة',
    isAvailable: true,
  },
  {
    fullName: 'طارق عبدالكريم',
    bloodType: 'A-',
    phone: '776789006',
    residence: 'مريس - الصدر',
    notes: 'فصيلة نادرة جاهز للتبرع',
    isAvailable: true,
  },
  {
    fullName: 'هيثم مسعد الجباري',
    bloodType: 'B-',
    phone: '777890107',
    residence: 'مريس - الجبارة',
    notes: 'متوفر وسيارة جاهزة للوصول لأي مشفى',
    isAvailable: true,
  },
  {
    fullName: 'فؤاد منصور اليافعي',
    bloodType: 'AB-',
    phone: '778901208',
    residence: 'قعطبة - المدينة',
    notes: 'فصيلة AB سالب نادرة، جاهز لإنقاذ الأرواح',
    isAvailable: true,
  }
];

export const INITIAL_SEED_REQUESTS = [
  {
    patientName: 'مريض في العناية المركزة (حادث سير)',
    bloodType: 'O-' as BloodType,
    unitsNeeded: 3,
    hospital: 'مستشفى السلام التخصصي - قعطبة',
    contactName: 'أخو المريض (أبو محمد)',
    contactPhone: '770987654',
    urgencyLevel: 'critical' as const,
    status: 'open' as const,
    notes: 'حالة حرجة جداً بحاجة ماسة لثلاثة أكياس دم فصيلة O سالب اليوم',
  },
  {
    patientName: 'حالة ولادة قيصرية طارئة',
    bloodType: 'B+' as BloodType,
    unitsNeeded: 2,
    hospital: 'مستشفى قعطبة العام',
    contactName: 'د. خالد (المشرف المناوب)',
    contactPhone: '771122334',
    urgencyLevel: 'urgent' as const,
    status: 'open' as const,
    notes: 'بحاجة لكيسين دم B موجب قبل العملية خلال الساعات القادمة',
  }
];
