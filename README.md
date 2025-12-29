# AI Sales Agent - Doctor Dashboard

Next.js tabanlı Doctor Dashboard. Leadleri görüntüleme, değerlendirme ve yönetme arayüzü.

## 🚀 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Environment dosyasını oluştur
cp .env.example .env.local
# .env.local dosyasını düzenle

# Development modunda çalıştır
npm run dev

# Production build
npm run build
npm start
```

## 📁 Proje Yapısı

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   └── header.tsx
│   ├── dashboard/
│   │   └── stats-cards.tsx
│   ├── leads/
│   │   ├── leads-list.tsx
│   │   └── lead-detail.tsx
│   └── providers.tsx
└── lib/
    ├── supabase.ts
    └── utils.ts
```

## 🎨 Özellikler

### Dashboard
- Lead istatistikleri
- Toplam lead sayısı
- Doktor değerlendirmesine hazır leads
- Sıcak leads (yüksek skor)
- Bekleyenler

### Lead Listesi
- Status ve skor bazlı filtreleme
- Lead kartları
- Desire score gösterimi
- Kanal ikonları

### Lead Detay
- Profil bilgileri
- Lead skoru ve band
- Mesaj geçmişi
- Fotoğraf galerisi
- Status güncelleme

## 🔧 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🎨 UI/UX

- Modern gradient tasarım
- Responsive layout
- Smooth animasyonlar
- Status bazlı renk kodlaması
- Desire band gösterimi

## 📝 License

Private - Natural Clinic

