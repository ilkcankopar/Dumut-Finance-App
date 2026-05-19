# Dumut Level & Streak Sistemi

## Level Sistemi

### XP Kazanma Yollari
| Aksiyon | XP |
|---------|-----|
| Gunluk giris | +10 XP |
| Islem ekleme | +5 XP |
| Hedef tamamlama | +50 XP |
| Butceye uyma (gunluk) | +15 XP |
| Dumut besleme | +3 XP |
| Dumut sevme | +1 XP |
| Haftalik butce hedefi | +100 XP |
| Arkadas ekleme | +20 XP |
| Rozet kazanma | +25 XP |

### Level Tablosu
| Level | Gerekli XP | Toplam XP | Odul (Coin) | Lig |
|-------|------------|-----------|-------------|-----|
| 1 | 0 | 0 | - | Bronz |
| 2 | 100 | 100 | 50 | Bronz |
| 3 | 150 | 250 | 75 | Bronz |
| 4 | 200 | 450 | 100 | Bronz |
| 5 | 250 | 700 | 125 | Bronz |
| 6 | 300 | 1000 | 150 | Gumus |
| 7 | 350 | 1350 | 175 | Gumus |
| 8 | 400 | 1750 | 200 | Gumus |
| 9 | 450 | 2200 | 225 | Gumus |
| 10 | 500 | 2700 | 250 | Gumus |
| 11-15 | +50/level | - | +25/level | Altin |
| 16-25 | +75/level | - | +30/level | Platin |
| 26-50 | +100/level | - | +40/level | Elmas |
| 51-100 | +150/level | - | +50/level | Sampiyon |

### Lig Sistemi
- **Bronz** (Level 1-5): Baslangic ligi
- **Gumus** (Level 6-10): Orta seviye
- **Altin** (Level 11-15): Ileri seviye
- **Platin** (Level 16-25): Uzman seviye
- **Elmas** (Level 26-50): Usta seviye
- **Sampiyon** (Level 51-100): Efsane seviye

## Streak (Seri) Sistemi

### Gunluk Seri
- Her gun uygulamaya giris = +1 streak
- Streak kacinilirsa sifirlanir
- Streak bonuslari:
  - 3 gun: +20 Coin
  - 7 gun: +50 Coin + "Haftalik Seri" rozeti
  - 14 gun: +100 Coin
  - 30 gun: +250 Coin + "Aylik Seri" rozeti
  - 100 gun: +1000 Coin + "Efsane Seri" rozeti

### Streak Koruma
- 1 adet "Streak Koruma" kalkan = 100 Coin (marketten)
- Bir gun kacirilirsa otomatik kullanilir

## Level Up Animasyonu
1. Ekranin ortasinda parlayan level numarasi
2. Confetti efekti
3. "LEVEL UP!" yazisi
4. Kazanilan coin gosterimi
5. Yeni acilan ozellikler (varsa)

## Anasayfa Gosterimi
```
+---------------------------+
|  [Streak: 7 gun]  [Lv.12] |
|  ████████░░ 450/600 XP    |
+---------------------------+
```

## Teknik Implementasyon

### AsyncStorage Keys
- `user_xp`: Toplam XP
- `user_level`: Mevcut level
- `user_streak`: Guncel streak sayisi
- `last_login_date`: Son giris tarihi
- `streak_shield`: Koruma kalkani sayisi

### Level Up Check
```typescript
const checkLevelUp = (currentXP: number, currentLevel: number) => {
  const xpForNextLevel = getXPForLevel(currentLevel + 1);
  if (currentXP >= xpForNextLevel) {
    return {
      newLevel: currentLevel + 1,
      coinReward: getLevelReward(currentLevel + 1),
      shouldAnimate: true
    };
  }
  return null;
};
```

### Streak Check (Her giris)
```typescript
const checkStreak = async () => {
  const lastLogin = await AsyncStorage.getItem('last_login_date');
  const today = new Date().toDateString();
  
  if (lastLogin === today) return; // Ayni gun
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (lastLogin === yesterday.toDateString()) {
    // Streak devam
    streak++;
    checkStreakRewards(streak);
  } else {
    // Streak kirildi - koruma var mi?
    if (streakShield > 0) {
      streakShield--;
      // Streak korundu
    } else {
      streak = 1; // Reset
    }
  }
  
  await AsyncStorage.setItem('last_login_date', today);
};
```
