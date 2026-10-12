let A = D.scen[0], P = A.present;                                       // the simulated account being shown: one per fee discount
/*PICKER*/
// ---------------------------------------------------------------- the report's own texts, in the five languages
// Figures are printed the same way in every language (the way the program computes them); only the words change.
// Persian is right to left: there the fund names are shown in Persian, and figures are kept left to right inside the text.
let LANG = rlStart();
const LRI = "⁦", PDI = "⁩";
const MSG = {
  en: {
    title: "Gold Fund Rotation", h1: "Excess over gold by rotating between gold funds", discount: "Broker fee discount",
    heroAria: "Portfolio divided by the value of holding the hub", monthly: "Month by month", highlight: "Highlight", fund: "Fund",
    mon: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    benchmark: (hub) => `The benchmark: ${hub}. `,
    about: (hub, bn, times, next, share) => `${hub} is a gold fund (ETF) on the Tehran Stock Exchange. Like the other gold funds it holds gold through gold bar and coin certificates, so a unit of it is a claim on gold. ` +
      `It is by far the most traded of them: about ${bn} bn toman a day in this period, ${times} times the next fund (${next}) and about ${share}% of all trading in gold funds. ` +
      `That makes it the natural way to simply hold gold, so every result here is the portfolio divided by what the same money would be worth if it had stayed in ${hub}.`,
    unit: (hub) => `a year above holding ${hub}`,
    foot: (hub, n) => [["Simulation,", " not real trades"], ["No competing traders", " are modelled"], ["Same rule at every fee:", " nothing is re-tuned for a lower fee"],
                       ["Main risk:", ` ${hub} moving against all funds at once`], ["Today's market", ` = ${n} sessions so far`]],
    fee: (pct, full, disc) => `fee for one switch (a sale plus a purchase): ${pct}% of the value` + (disc ? `, down from ${full}%` : " (no discount)"),
    eyebrow: (from, to, bn, hub, disc) => `Simulation on recorded order books · ${from} → ${to} · ${bn} bn toman · benchmark: holding ${hub}` + (disc ? ` · fee discount ${disc}%` : ""),
    bigsub: (ratio, hub, months) => `×${ratio} the value of ${hub} alone, in ${months} months, after all fees`,
    t1: "Total excess over gold", n1: (months) => `in ${months} months, after all fees`,
    t2: "Today's market", v2: (v) => `${v}% a year`, n2: (n) => `since Oct 2025 · ${n} sessions`,
    t3: "Months ahead of gold", v3: (a, b) => `${a} of ${b}`, n3: (best, bm, by, worst, wm, wy) => `best ${best}% (${bm} ${by}) · worst ${worst}% (${wm} ${wy})`,
    t4: "Winning days", n4: "days the portfolio beat gold (ties left out)",
    t5: "Profit factor", n5: "total of winning days ÷ total of losing days",
    t6: "Information ratio", n6: (t) => `excess ÷ its volatility, a year · t ${t}`,
    t7: "Max. lag behind gold", n7: (n) => `longest stretch behind: ${n} sessions`,
    t8: "Positions closed", n8: (win, avg) => `${win}% at a profit · average gain ${avg}% after fees`,
    tip8: (hub, other) => `A position is a fund held from its first purchase to its last sale back to ${hub}. The ${other} positions that were moved straight into another fund, or are still open, are not counted here.`,
    t9: "Turnover and fees", n9: (fees) => `the account traded · ${fees} points of fees paid`,
    t10: "Concentration", n10: (n) => `most ever in one fund · ${n} funds used`,
    year: "Year", yearTotal: "Year total", cell: (mon, y, v, hub) => `${mon} ${y}: ${v}% against holding ${hub}`,
    heatnote: (hub) => `portfolio against holding ${hub}, % in the month`, heatcap: (v) => `colour scale: the darkest cell is ${v}%`,
    tipA: (hub) => `portfolio ÷ ${hub}`, tipB: (hub) => `ahead of holding ${hub} since the start`, tipC: (hub) => `of the account out of ${hub} at the close`,
    all: (hub) => `All funds against ${hub}`, yaxis: "bps from usual level  (lower = cheaper)", usual: "usual level",
    median: "Median of all funds", other: "Each other fund", cheaper: "bps cheaper than usual", dearer: "bps dearer than usual", medianFund: "median fund",
  },
  fr: {
    title: "Rotation entre fonds or", h1: "Excédent sur l’or par rotation entre fonds or", discount: "Remise sur les frais de courtage",
    heroAria: "Portefeuille divisé par la valeur de la détention du fonds de référence", monthly: "Mois par mois", highlight: "Mettre en évidence", fund: "Fonds",
    mon: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
    benchmark: (hub) => `La référence : ${hub}. `,
    about: (hub, bn, times, next, share) => `${hub} est un fonds or (ETF) de la Bourse de Téhéran. Comme les autres fonds or, il détient de l’or sous forme de certificats de lingots et de pièces d’or ; une part du fonds est donc une créance sur de l’or. ` +
      `C’est de loin le plus négocié d’entre eux : environ ${bn} milliards de tomans par jour sur cette période, ${times} fois le fonds suivant (${next}) et environ ${share}% de l’ensemble des échanges sur les fonds or. ` +
      `C’est donc la manière naturelle de simplement détenir de l’or ; chaque résultat présenté ici est ainsi le portefeuille divisé par ce que vaudrait le même argent s’il était resté dans ${hub}.`,
    unit: (hub) => `par an au-dessus de la détention de ${hub}`,
    foot: (hub, n) => [["Simulation,", " pas de transactions réelles"], ["Aucun trader concurrent", " n’est modélisé"], ["Même règle à chaque niveau de frais :", " rien n’est réajusté pour des frais plus bas"],
                       ["Risque principal :", ` ${hub} évoluant contre tous les fonds à la fois`], ["Marché d’aujourd’hui", ` = ${n} séances à ce jour`]],
    fee: (pct, full, disc) => `frais pour une bascule (une vente plus un achat) : ${pct}% de la valeur` + (disc ? `, au lieu de ${full}%` : " (sans remise)"),
    eyebrow: (from, to, bn, hub, disc) => `Simulation sur carnets d’ordres enregistrés · ${from} → ${to} · ${bn} milliards de tomans · référence : détention de ${hub}` + (disc ? ` · remise sur les frais ${disc}%` : ""),
    bigsub: (ratio, hub, months) => `×${ratio} la valeur de ${hub} seul, en ${months} mois, après tous les frais`,
    t1: "Excédent total sur l’or", n1: (months) => `en ${months} mois, après tous les frais`,
    t2: "Marché d’aujourd’hui", v2: (v) => `${v}% / an`, n2: (n) => `depuis oct. 2025 · ${n} séances`,
    t3: "Mois devant l’or", v3: (a, b) => `${a} sur ${b}`, n3: (best, bm, by, worst, wm, wy) => `meilleur ${best}% (${bm} ${by}) · pire ${worst}% (${wm} ${wy})`,
    t4: "Jours gagnants", n4: "jours où le portefeuille a battu l’or (égalités exclues)",
    t5: "Profit Factor", n5: "total des jours gagnants ÷ total des jours perdants",
    t6: "Ratio d’information", n6: (t) => `excédent ÷ sa volatilité, sur un an · t ${t}`,
    t7: "Retard max. sur l’or", n7: (n) => `plus longue période en retard : ${n} séances`,
    t8: "Positions clôturées", n8: (win, avg) => `${win}% en gain · gain moyen ${avg}% après frais`,
    tip8: (hub, other) => `Une position est un fonds détenu de son premier achat à sa dernière vente pour revenir vers ${hub}. Les ${other} positions transférées directement vers un autre fonds, ou encore ouvertes, ne sont pas comptées ici.`,
    t9: "Volume traité et frais", n9: (fees) => `le montant du compte, négocié · ${fees} points de frais payés`,
    t10: "Concentration", n10: (n) => `maximum atteint dans un seul fonds · ${n} fonds utilisés`,
    year: "Année", yearTotal: "Total annuel", cell: (mon, y, v, hub) => `${mon} ${y} : ${v}% par rapport à la détention de ${hub}`,
    heatnote: (hub) => `portefeuille par rapport à la détention de ${hub}, % sur le mois`, heatcap: (v) => `échelle de couleur : la cellule la plus foncée vaut ${v}%`,
    tipA: (hub) => `portefeuille ÷ ${hub}`, tipB: (hub) => `d’avance sur la détention de ${hub} depuis le début`, tipC: (hub) => `du compte hors de ${hub} à la clôture`,
    all: (hub) => `Tous les fonds par rapport à ${hub}`, yaxis: "pb par rapport au niveau habituel  (plus bas = moins cher)", usual: "niveau habituel",
    median: "Médiane de tous les fonds", other: "Chacun des autres fonds", cheaper: "pb moins cher que d’habitude", dearer: "pb plus cher que d’habitude", medianFund: "fonds médian",
  },
  de: {
    title: "Goldfonds-Rotation", h1: "Mehrertrag gegenüber Gold durch Rotation zwischen Goldfonds", discount: "Rabatt auf die Brokergebühr",
    heroAria: "Portfolio geteilt durch den Wert des gehaltenen Referenzfonds", monthly: "Monat für Monat", highlight: "Hervorheben", fund: "Fonds",
    mon: ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sept.", "Okt.", "Nov.", "Dez."],
    benchmark: (hub) => `Die Benchmark: ${hub}. `,
    about: (hub, bn, times, next, share) => `${hub} ist ein Goldfonds (ETF) an der Teheraner Börse. Wie die anderen Goldfonds hält er Gold über Zertifikate auf Goldbarren und Goldmünzen; ein Anteil ist also ein Anspruch auf Gold. ` +
      `Er ist mit Abstand der meistgehandelte von ihnen: rund ${bn} Mrd. Toman pro Tag in diesem Zeitraum, das ${times}-Fache des nächsten Fonds (${next}) und rund ${share}% des gesamten Handels in Goldfonds. ` +
      `Damit ist er der natürliche Weg, einfach Gold zu halten; jedes Ergebnis hier ist deshalb das Portfolio geteilt durch das, was dasselbe Geld wert wäre, wenn es in ${hub} geblieben wäre.`,
    unit: (hub) => `pro Jahr über dem Halten von ${hub}`,
    foot: (hub, n) => [["Simulation,", " keine echten Trades"], ["Konkurrierende Trader", " sind nicht modelliert"], ["Dieselbe Regel bei jeder Gebühr:", " für eine niedrigere Gebühr wird nichts neu abgestimmt"],
                       ["Hauptrisiko:", ` ${hub} bewegt sich gegen alle Fonds zugleich`], ["Heutiger Markt", ` = bisher ${n} Handelstage`]],
    fee: (pct, full, disc) => `Gebühr für einen Wechsel (ein Verkauf plus ein Kauf): ${pct}% des Werts` + (disc ? `, statt ${full}%` : " (kein Rabatt)"),
    eyebrow: (from, to, bn, hub, disc) => `Simulation auf aufgezeichneten Orderbüchern · ${from} → ${to} · ${bn} Mrd. Toman · Benchmark: Halten von ${hub}` + (disc ? ` · Gebührenrabatt ${disc}%` : ""),
    bigsub: (ratio, hub, months) => `×${ratio} des Werts von ${hub} allein, in ${months} Monaten, nach allen Gebühren`,
    t1: "Gesamter Mehrertrag gegenüber Gold", n1: (months) => `in ${months} Monaten, nach allen Gebühren`,
    t2: "Heutiger Markt", v2: (v) => `${v}% p. a.`, n2: (n) => `seit Okt. 2025 · ${n} Handelstage`,
    t3: "Monate vor Gold", v3: (a, b) => `${a} von ${b}`, n3: (best, bm, by, worst, wm, wy) => `bester ${best}% (${bm} ${by}) · schlechtester ${worst}% (${wm} ${wy})`,
    t4: "Gewinntage", n4: "Tage, an denen das Portfolio Gold schlug (Gleichstände ausgenommen)",
    t5: "Profitfaktor", n5: "Summe der Gewinntage ÷ Summe der Verlusttage",
    t6: "Information Ratio", n6: (t) => `Mehrertrag ÷ seine Volatilität, pro Jahr · t ${t}`,
    t7: "Max. Rückstand auf Gold", n7: (n) => `längste Phase im Rückstand: ${n} Handelstage`,
    t8: "Geschlossene Positionen", n8: (win, avg) => `${win}% mit Gewinn · durchschnittlicher Gewinn ${avg}% nach Gebühren`,
    tip8: (hub, other) => `Eine Position ist ein Fonds, der von seinem ersten Kauf bis zu seinem letzten Verkauf zurück in ${hub} gehalten wird. Die ${other} Positionen, die direkt in einen anderen Fonds umgeschichtet wurden oder noch offen sind, werden hier nicht gezählt.`,
    t9: "Umschlag und Gebühren", n9: (fees) => `des Kontos gehandelt · ${fees} Punkte an Gebühren gezahlt`,
    t10: "Konzentration", n10: (n) => `Höchststand in einem einzelnen Fonds · ${n} Fonds genutzt`,
    year: "Jahr", yearTotal: "Jahressumme", cell: (mon, y, v, hub) => `${mon} ${y}: ${v}% gegenüber dem Halten von ${hub}`,
    heatnote: (hub) => `Portfolio gegenüber dem Halten von ${hub}, % im Monat`, heatcap: (v) => `Farbskala: Die dunkelste Zelle ist ${v}%`,
    tipA: (hub) => `Portfolio ÷ ${hub}`, tipB: (hub) => `vor dem Halten von ${hub} seit Beginn`, tipC: (hub) => `des Kontos außerhalb von ${hub} zum Handelsschluss`,
    all: (hub) => `Alle Fonds gegenüber ${hub}`, yaxis: "Bp vom üblichen Niveau  (niedriger = günstiger)", usual: "übliches Niveau",
    median: "Median aller Fonds", other: "Jeder andere Fonds", cheaper: "Bp günstiger als üblich", dearer: "Bp teurer als üblich", medianFund: "Median-Fonds",
  },
  tr: {
    title: "Altın Fonu Rotasyonu", h1: "Altın fonları arasında geçiş yaparak altına göre fazla getiri", discount: "Aracı kurum komisyonu indirimi",
    heroAria: "Portföyün, karşılaştırma fonunu elde tutmanın değerine bölümü", monthly: "Ay ay", highlight: "Vurgula", fund: "Fon",
    mon: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
    benchmark: (hub) => `Karşılaştırma ölçütü: ${hub}. `,
    about: (hub, bn, times, next, share) => `${hub}, Tahran Borsası’nda işlem gören bir altın fonudur (ETF). Diğer altın fonları gibi altını, külçe ve altın sikke sertifikaları yoluyla tutar; dolayısıyla bir fon payı, altın üzerindeki bir haktır. ` +
      `Aralarında açık ara en çok işlem gören fondur: bu dönemde günde yaklaşık ${bn} milyar tümen; bu, bir sonraki fonun (${next}) ${times} katı ve altın fonlarındaki tüm işlemlerin yaklaşık ${share}% kadarıdır. ` +
      `Bu da onu, yalnızca altın tutmanın doğal yolu yapar; bu nedenle buradaki her sonuç, portföyün, aynı para ${hub} fonunda kalsaydı sahip olacağı değere bölünmesidir.`,
    unit: (hub) => `yıllık, ${hub} tutmanın üzerinde`,
    foot: (hub, n) => [["Simülasyon,", " gerçek işlem değil"], ["Rakip trader’lar", " modellenmemiştir"], ["Her komisyonda aynı kural:", " daha düşük komisyon için hiçbir şey yeniden ayarlanmaz"],
                       ["Ana risk:", ` ${hub} fonunun tüm fonlara karşı aynı anda hareket etmesi`], ["Bugünkü piyasa", ` = şimdiye kadar ${n} seans`]],
    fee: (pct, full, disc) => `bir geçişin komisyonu (bir satış artı bir alış): değerin ${pct}% kadarı` + (disc ? `; indirimsiz hâli ${full}%` : " (indirim yok)"),
    eyebrow: (from, to, bn, hub, disc) => `Kaydedilmiş emir defterleri üzerinde simülasyon · ${from} → ${to} · ${bn} milyar tümen · karşılaştırma ölçütü: ${hub} tutmak` + (disc ? ` · komisyon indirimi ${disc}%` : ""),
    bigsub: (ratio, hub, months) => `tek başına ${hub} değerinin ×${ratio} katı, ${months} ayda, tüm komisyonlardan sonra`,
    t1: "Altına göre toplam fazla getiri", n1: (months) => `${months} ayda, tüm komisyonlardan sonra`,
    t2: "Bugünkü piyasa", v2: (v) => `yıllık ${v}%`, n2: (n) => `Eki 2025’ten beri · ${n} seans`,
    t3: "Altının önünde geçen aylar", v3: (a, b) => `${a} / ${b}`, n3: (best, bm, by, worst, wm, wy) => `en iyi ${best}% (${bm} ${by}) · en kötü ${worst}% (${wm} ${wy})`,
    t4: "Kazanan günler", n4: "portföyün altını geçtiği günler (eşitlikler hariç)",
    t5: "Kâr faktörü", n5: "kazanan günlerin toplamı ÷ kaybeden günlerin toplamı",
    t6: "Bilgi oranı", n6: (t) => `fazla getiri ÷ oynaklığı, yıllık · t ${t}`,
    t7: "Altının gerisinde maks. fark", n7: (n) => `geride kalınan en uzun dönem: ${n} seans`,
    t8: "Kapanan pozisyonlar", n8: (win, avg) => `${win}% kârda · komisyonlardan sonra ortalama kazanç ${avg}%`,
    tip8: (hub, other) => `Bir pozisyon, ilk alımından ${hub} fonuna geri dönülen son satışına kadar elde tutulan bir fondur. Doğrudan başka bir fona aktarılan ya da hâlâ açık olan ${other} pozisyon burada sayılmaz.`,
    t9: "Devir ve komisyonlar", n9: (fees) => `hesabın katı kadar işlem · ${fees} puan komisyon ödendi`,
    t10: "Yoğunlaşma", n10: (n) => `tek bir fonda görülen en yüksek pay · ${n} fon kullanıldı`,
    year: "Yıl", yearTotal: "Yıl toplamı", cell: (mon, y, v, hub) => `${mon} ${y}: ${hub} tutmaya göre ${v}%`,
    heatnote: (hub) => `${hub} tutmaya göre portföy, ay içinde %`, heatcap: (v) => `renk ölçeği: en koyu hücre ${v}%`,
    tipA: (hub) => `portföy ÷ ${hub}`, tipB: (hub) => `başlangıçtan beri ${hub} tutmanın önünde`, tipC: (hub) => `kapanışta hesabın ${hub} dışındaki payı`,
    all: (hub) => `Tüm fonlar, ${hub} fonuna göre`, yaxis: "olağan seviyeden baz puan  (düşük = daha ucuz)", usual: "olağan seviye",
    median: "Tüm fonların medyanı", other: "Diğer fonların her biri", cheaper: "baz puan, olağandan ucuz", dearer: "baz puan, olağandan pahalı", medianFund: "medyan fon",
  },
  fa: {
    title: "جابه‌جایی میان صندوق‌های طلا", h1: "مازاد بر طلا با جابه‌جایی میان صندوق‌های طلا", discount: "تخفیف کارمزد کارگزاری",
    heroAria: "سبد تقسیم بر ارزش نگه‌داشتن صندوق معیار", monthly: "ماه به ماه", highlight: "برجسته‌کردن", fund: "صندوق",
    mon: ["ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن", "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر"],
    benchmark: (hub) => `معیار: ${hub}. `,
    about: (hub, bn, times, next, share) => `${hub} یک صندوق طلا (ETF) در بورس تهران است. مثل دیگر صندوق‌های طلا، طلا را از راه گواهی شمش و سکه‌ی طلا نگه می‌دارد؛ پس هر واحد آن، ادعایی بر طلاست. ` +
      `با فاصله‌ی زیاد پرمعامله‌ترینِ آن‌هاست: در این دوره روزانه حدود ${bn} میلیارد تومان، یعنی ${times} برابر صندوق بعدی (${next}) و حدود ${share}% از کل معاملات صندوق‌های طلا. ` +
      `همین، آن را راه طبیعیِ نگه‌داشتن ساده‌ی طلا می‌کند؛ برای همین هر نتیجه در این گزارش، سبد تقسیم بر ارزشی است که همان پول اگر در ${hub} مانده بود، می‌داشت.`,
    unit: (hub) => `در سال، بالاتر از نگه‌داشتن ${hub}`,
    foot: (hub, n) => [["شبیه‌سازی،", " نه معامله‌ی واقعی"], ["معامله‌گران رقیب", " مدل نشده‌اند"], ["همان قاعده در هر سطح کارمزد:", " برای کارمزد کمتر هیچ چیز دوباره تنظیم نشده است"],
                       ["ریسک اصلی:", ` حرکت ${hub} بر خلاف همه‌ی صندوق‌ها در یک زمان`], ["بازار امروز", ` = تا این‌جا ${n} روز معاملاتی`]],
    fee: (pct, full, disc) => `کارمزد یک جابه‌جایی (یک فروش به‌علاوه‌ی یک خرید): ${pct}% از ارزش` + (disc ? `، به جای ${full}%` : " (بدون تخفیف)"),
    eyebrow: (from, to, bn, hub, disc) => `شبیه‌سازی روی دفترهای سفارش ضبط‌شده · ${from} → ${to} · ${bn} میلیارد تومان · معیار: نگه‌داشتن ${hub}` + (disc ? ` · تخفیف کارمزد ${disc}%` : ""),
    bigsub: (ratio, hub, months) => `×${ratio} برابر ارزش ${hub} به‌تنهایی، در ${months} ماه، پس از همه‌ی کارمزدها`,
    t1: "کل مازاد بر طلا", n1: (months) => `در ${months} ماه، پس از همه‌ی کارمزدها`,
    t2: "بازار امروز", v2: (v) => `${v}% سالانه`, n2: (n) => `از اکتبر 2025 · ${n} روز معاملاتی`,
    t3: "ماه‌های جلوتر از طلا", v3: (a, b) => `${a} از ${b}`, n3: (best, bm, by, worst, wm, wy) => `بهترین ${best}% (${bm} ${by}) · بدترین ${worst}% (${wm} ${wy})`,
    t4: "روزهای برنده", n4: "روزهایی که سبد از طلا جلو زد (روزهای مساوی کنار گذاشته شده‌اند)",
    t5: "ضریب سود (Profit Factor)", n5: "جمع روزهای برنده ÷ جمع روزهای بازنده",
    t6: "نسبت اطلاعات (Information Ratio)", n6: (t) => `مازاد ÷ نوسان آن، در سال · t ${t}`,
    t7: "بیشترین عقب‌ماندن از طلا", n7: (n) => `طولانی‌ترین دوره‌ی عقب‌ماندن: ${n} روز معاملاتی`,
    t8: "موقعیت‌های بسته‌شده", n8: (win, avg) => `${win}% با سود · میانگین سود ${avg}% پس از کارمزد`,
    tip8: (hub, other) => `یک موقعیت، صندوقی است که از نخستین خرید تا آخرین فروش و بازگشت به ${hub} نگه داشته شده است. ${other} موقعیتی که مستقیم به صندوق دیگری منتقل شده‌اند یا هنوز بازند، این‌جا شمرده نشده‌اند.`,
    t9: "گردش و کارمزدها", n9: (fees) => `برابر حساب معامله شده · ${fees} واحد کارمزد پرداخت شده`,
    t10: "تمرکز", n10: (n) => `بیشترین سهم یک صندوق در کل دوره · ${n} صندوق به کار رفته`,
    year: "سال", yearTotal: "جمع سال", cell: (mon, y, v, hub) => `${mon} ${y}: ${v}% نسبت به نگه‌داشتن ${hub}`,
    heatnote: (hub) => `سبد نسبت به نگه‌داشتن ${hub}، درصد در ماه`, heatcap: (v) => `مقیاس رنگ: پررنگ‌ترین خانه ${v}% است`,
    tipA: (hub) => `سبد ÷ ${hub}`, tipB: (hub) => `جلوتر از نگه‌داشتن ${hub} از آغاز`, tipC: (hub) => `از حساب، بیرون از ${hub} در پایان روز`,
    all: (hub) => `همه‌ی صندوق‌ها در برابر ${hub}`, yaxis: "فاصله از سطح معمول، به bps  (پایین‌تر = ارزان‌تر)", usual: "سطح معمول",
    median: "میانه‌ی همه‌ی صندوق‌ها", other: "هر یک از صندوق‌های دیگر", cheaper: "bps ارزان‌تر از معمول", dearer: "bps گران‌تر از معمول", medianFund: "صندوق میانه",
  },
};
const T = () => MSG[LANG] || MSG.en, RTL = () => LANG === "fa";
// right to left: a figure with its sign, percent or multiplier, and a date or a span of dates, stays left to right inside the sentence
const iso = (s) => !RTL() || typeof s !== "string" || s.indexOf(LRI) >= 0 ? s : s.replace(/\d{4}-\d\d(?:-\d\d)?(?:\s*→\s*\d{4}-\d\d(?:-\d\d)?)?|[+−–-]?×?\d[\d,]*(?:\.\d+)?(?:%|×)?/g, (m) => LRI + m + PDI);

const byName = Object.fromEntries(Object.entries(D.names).map(([fa, en]) => [en, fa]));     // a fund's Persian name from its English one
const nm = f => RTL() ? (D.names[f] ? f : byName[f] || f).replace(/_/g, " ") : (D.names[f] || f), names = Object.keys(D.dev), N = D.days.length;
let HUB = nm(D.hub);
const root = document.body, $ = id => document.getElementById(id);
const css = v => getComputedStyle(root).getPropertyValue(v).trim();
const sgn = (v, k = 0) => v == null || isNaN(v) ? "–" : (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(k);
const el = (tag, text, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = iso(text); if (cls) e.className = cls; return e; };
const colors = () => ({ s1: css("--series-1"), s2: css("--series-2"), ctx: css("--context"), area: css("--area"), grid: css("--grid"),
                        t1: css("--text-primary"), t2: css("--text-secondary"), t3: css("--text-muted"), surf: css("--surface-1"), border: css("--border") });
const FONT = "system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif";
const CFG = { displaylogo: false, responsive: true, modeBarButtonsToRemove: ["lasso2d", "select2d", "autoScale2d", "zoomIn2d", "zoomOut2d"] };
const X = D.days.map((_, k) => k);
const monthTicks = (most = 11) => { const tv = [], tt = []; D.days.forEach((d, k) => { if (k > 0 && d.slice(0, 7) !== D.days[k - 1].slice(0, 7)) { tv.push(k); tt.push(d.slice(0, 7)); } });
  const s = Math.ceil(tv.length / most); return { tickvals: tv.filter((_, i) => i % s === 0), ticktext: tt.filter((_, i) => i % s === 0) }; };

// ---- header and footer (the same for every fee scenario), and the page's fixed labels: written again when the language changes
function shell() {
  const t = T(), h = D.hub_stats;
  document.title = t.title;
  $("h1").textContent = t.h1; $("lab_disc").textContent = t.discount; $("h2_month").textContent = t.monthly; $("lab_high").textContent = t.highlight + " ";
  $("hero").setAttribute("aria-label", t.heroAria); $("fund").setAttribute("aria-label", t.fund);
  $("about").replaceChildren(el("b", t.benchmark(HUB)), document.createTextNode(iso(t.about(HUB, h.value_bn_toman.toLocaleString("en-US"), h.times_next, nm(h.next), h.share))));
  $("unit").textContent = iso(t.unit(HUB));
  $("foot").replaceChildren();
  for (const [b, x] of t.foot(HUB, D.scen[0].present.post_sessions)) { const s = el("span"); s.append(el("b", b), document.createTextNode(iso(x))); $("foot").appendChild(s); }
}
const cls = v => v > 0 ? "pos" : v < 0 ? "neg" : "";
const heatCell = (v, amax) => v == null || v === 0 ? "" : `rgba(var(${v > 0 ? "--posrgb" : "--negrgb"}),${(0.14 + 0.62 * Math.min(1, Math.abs(v) / (amax || 1))).toFixed(2)})`;
function tile(k, v, n, c) { const t = el("div", null, "tile"); t.append(el("div", k, "k"), el("div", v, "v " + (c || "")), el("div", n, "n")); $("tiles").appendChild(t); return t; }

// ---- the fee discount: a row of chips
for (const sc of D.scen) { const c = el("button", sc.discount + "%", "chip"); c.type = "button"; c.setAttribute("data-d", sc.discount); c.onclick = () => { A = sc; P = A.present; render(); hero(); }; $("chips").appendChild(c); }

function render() {
  const t = T(), MON = t.mon;
  for (const c of $("chips").children) c.classList.toggle("on", +c.getAttribute("data-d") === A.discount);
  const full = D.scen[0].present;
  $("feenote").textContent = iso(t.fee(P.fee_switch_pct.toFixed(3), full.fee_switch_pct.toFixed(3), A.discount));
  $("eyebrow").textContent = iso(t.eyebrow(A.run.first.slice(0, 7), A.run.last.slice(0, 7), P.capital_bn_toman, HUB, A.discount));
  $("big").textContent = iso(sgn(P.whole, 1) + "%");
  $("bigsub").textContent = iso(t.bigsub(A.run.ratio.toFixed(2), HUB, P.months));

  $("tiles").replaceChildren();
  const best = P.monthly.reduce((a, b) => b.v > a.v ? b : a), worst = P.monthly.reduce((a, b) => b.v < a.v ? b : a), pos = P.positions;
  tile(t.t1, sgn(P.total, 1) + "%", t.n1(P.months), cls(P.total));
  tile(t.t2, t.v2(sgn(P.post, 1)), t.n2(P.post_sessions), cls(P.post));
  tile(t.t3, t.v3(P.months_ahead, P.monthly.length), t.n3(sgn(best.v, 1), MON[best.m - 1], best.y, sgn(worst.v, 1), MON[worst.m - 1], worst.y));
  tile(t.t4, P.days_ahead + "%", t.n4);
  tile(t.t5, P.profit_factor == null ? "–" : P.profit_factor.toFixed(2), t.n5, P.profit_factor > 1 ? "pos" : "neg");
  tile(t.t6, P.info_ratio.toFixed(1), t.n6(P.t.toFixed(1)), cls(P.info_ratio));
  tile(t.t7, sgn(P.worst_lag, 1) + "%", t.n7(P.longest_behind), "neg");
  tile(t.t8, pos.closed, t.n8(pos.win, sgn(pos.avg_pct, 2))).title = iso(t.tip8(HUB, pos.other));
  tile(t.t9, P.turnover + "×", t.n9(P.fees));
  tile(t.t10, P.largest + "%", t.n10(P.funds_traded));

  const H = $("heat"), amax = Math.max(...P.monthly.map(x => Math.abs(x.v)), 0.01), head = el("tr");
  H.replaceChildren();
  head.appendChild(el("th", t.year)); for (const m of MON) head.appendChild(el("th", m)); head.appendChild(el("th", t.yearTotal)); H.appendChild(head);
  for (const yr of P.yearly) {
    const tr = el("tr"); tr.appendChild(el("td", String(yr.y), "h0"));
    for (let m = 1; m <= 12; m++) {
      const x = P.monthly.find(q => q.y === yr.y && q.m === m), td = document.createElement("td");
      td.textContent = x ? sgn(x.v, 1) : ""; td.className = x ? "" : "none";
      if (x) { td.style.background = heatCell(x.v, amax); td.title = iso(t.cell(MON[m - 1], yr.y, sgn(x.v, 2), HUB)); }
      tr.appendChild(td);
    }
    const tot = document.createElement("td"); tot.textContent = sgn(yr.v, 1) + "%"; tot.className = "tot " + cls(yr.v); tr.appendChild(tot); H.appendChild(tr);
  }
  $("heatnote").textContent = iso(t.heatnote(HUB));
  $("heatcap").textContent = iso(t.heatcap(amax.toFixed(1)));
}

// ---- one tooltip for both charts
function place(ev, T2) {
  T2.style.display = "block";
  const m = ev.event, w = T2.offsetWidth, h = T2.offsetHeight;
  T2.style.left = Math.max(8, m.clientX + 16 + w > innerWidth ? m.clientX - w - 16 : m.clientX + 16) + "px";
  T2.style.top = Math.max(8, Math.min(innerHeight - h - 8, m.clientY - h / 2)) + "px";
}
function tipRow(T2, color, dash, value, text) {
  const r = el("div", null, "row"), k = el("i", null, "k"), b = document.createElement("b"); k.style.borderTopColor = color; if (dash) k.style.borderTopStyle = "dashed";
  b.textContent = value; r.append(k, b, el("span", text)); T2.appendChild(r);
}
function wire(id, onHover) {
  const ch = $(id); if (ch._wired) return; ch._wired = true;
  ch.on("plotly_hover", onHover); ch.on("plotly_unhover", () => { $("tip").style.display = "none"; });
}

// ---- hero: the portfolio against holding the hub
function hero() {
  const c = colors(), Y = A.ratio, n = N - 1;
  const axis = { gridcolor: c.grid, zeroline: false, linecolor: c.border, tickfont: { color: c.t2, size: 13 }, fixedrange: true };
  const shapes = [{ type: "line", xref: "paper", x0: 0, x1: 1, yref: "y", y0: 1, y1: 1, line: { color: c.t3, width: 1 } }], ann = [
    { x: n, y: Y[n], xanchor: "left", xshift: 8, text: "<b>×" + Y[n].toFixed(2) + "</b>", showarrow: false, font: { color: c.t1, size: 17 } },
    { xref: "paper", x: 1, xanchor: "left", xshift: 8, y: 1, yanchor: "middle", text: HUB + " = 1.00", showarrow: false, font: { color: c.t2, size: 13 } }];
  Plotly.react("hero", [{ x: X, y: X.map(() => 1), mode: "lines", line: { width: 0 }, hoverinfo: "skip" },
                        { x: X, y: Y, mode: "lines", line: { color: c.s1, width: 3.5, shape: "spline", smoothing: 0.3 }, fill: "tonexty", fillcolor: c.area, hoverinfo: "none" },
                        { x: [n], y: [Y[n]], mode: "markers", marker: { color: c.s1, size: 11, line: { color: c.surf, width: 2 } }, hoverinfo: "skip" }],
    { paper_bgcolor: c.surf, plot_bgcolor: c.surf, font: { color: c.t1, family: FONT, size: 13 }, margin: { l: 48, r: 92, t: 8, b: 34 }, showlegend: false, hovermode: "x", hoverdistance: -1,
      xaxis: { ...axis, tickmode: "array", ...monthTicks(7), tickangle: 0, range: [-1, n + 1], showspikes: true, spikemode: "across", spikesnap: "cursor", spikethickness: 1, spikecolor: c.t3, spikedash: "solid" },
      yaxis: { ...axis, tickformat: ".2f", range: [Math.min(0.97, Math.min(...Y) - 0.02), Math.max(...Y) + 0.04] }, shapes, annotations: ann }, { ...CFG, displayModeBar: false });
  wire("hero", ev => {
    const k = Math.max(0, Math.min(n, Math.round(ev.points[0].x))), T2 = $("tip"), Y = A.ratio, t = T();
    T2.replaceChildren(el("div", D.days[k], "when"));
    tipRow(T2, "var(--series-1)", false, "×" + Y[k].toFixed(3), t.tipA(HUB));
    tipRow(T2, "var(--series-1)", false, sgn((Y[k] - 1) * 100, 1) + "%", t.tipB(HUB));
    tipRow(T2, "var(--text-muted)", false, (A.out[k] == null ? "–" : A.out[k]) + "%", t.tipC(HUB));
    place(ev, T2);
  });
}

// ---- all funds together: each against the hub, from its own usual level, one point per session (lower = cheaper)
const sel = $("fund"), flip = a => a.map(v => v == null ? null : -v), devDay = {};
for (const f of names) devDay[f] = flip(D.dev[f]);
const medDay = flip(D.median);
function fundList() {       // the funds in the order of their names in the language shown; the one chosen stays chosen
  const keep = sel.value;
  sel.replaceChildren();
  for (const f of names.slice().sort((a, b) => nm(a).localeCompare(nm(b), RTL() ? "fa" : "en"))) { const o = document.createElement("option"); o.textContent = nm(f); o.value = f; sel.appendChild(o); }
  // on first use the fund that comes first by its English name, so that the page opens the same in every language
  sel.value = keep || names.slice().sort((a, b) => (D.names[a] || a).localeCompare(D.names[b] || b))[0];
}
function legendInto(id, items) {
  const L = $(id); L.replaceChildren();
  for (const [cls2, v, text] of items) { const s = el("span"), k = el("i", null, cls2); k.style.borderTopColor = `var(${v})`; s.append(k, document.createTextNode(text)); L.appendChild(s); }
}
function allFunds() {
  const c = colors(), f = sel.value, n = N - 1, tr = [], vals = [], t = T();
  $("t3").textContent = t.all(HUB);
  for (const g of names) { if (g !== f) tr.push({ x: X, y: devDay[g], mode: "lines", line: { color: c.ctx, width: 1 }, opacity: 0.7, hoverinfo: "skip" }); for (const v of devDay[g]) if (v != null) vals.push(v); }
  tr.push({ x: X, y: medDay, mode: "lines", line: { color: c.s2, width: 2.5 }, hoverinfo: "none" });
  tr.push({ x: X, y: devDay[f], mode: "lines", line: { color: c.s1, width: 2.5 }, hoverinfo: "none" });
  vals.sort((a, b) => a - b);
  const lo = vals[Math.floor(0.005 * (vals.length - 1))], hi = vals[Math.ceil(0.995 * (vals.length - 1))];
  const axis = { gridcolor: c.grid, zeroline: false, linecolor: c.border, tickfont: { color: c.t2, size: 13 }, fixedrange: true };
  Plotly.react("all", tr, { paper_bgcolor: c.surf, plot_bgcolor: c.surf, font: { color: c.t1, family: FONT, size: 14 }, margin: { l: 70, r: 104, t: 8, b: 36 }, showlegend: false,
    hovermode: "x", hoverdistance: -1, dragmode: "zoom",
    xaxis: { ...axis, fixedrange: false, tickmode: "array", ...monthTicks(), range: [-1, n + 1], minallowed: -1, maxallowed: n + 1, showspikes: true, spikemode: "across", spikesnap: "cursor", spikethickness: 1, spikecolor: c.t3, spikedash: "solid" },
    yaxis: { ...axis, range: [lo - 20, hi + 20], title: { text: t.yaxis, font: { color: c.t2, size: 13.5 } } },
    shapes: [{ type: "line", xref: "paper", x0: 0, x1: 1, y0: 0, y1: 0, line: { color: c.t2, width: 1 } }],
    annotations: [{ xref: "paper", x: 1, xanchor: "left", xshift: 6, y: 0, yanchor: "middle", text: t.usual, showarrow: false, font: { color: c.t2, size: 13 } }] }, CFG);
  legendInto("legend2", [["key", "--series-1", nm(f)], ["key", "--series-2", t.median], ["key", "--context", t.other]]);
  wire("all", ev => {
    const k = Math.max(0, Math.min(n, Math.round(ev.points[0].x))), T2 = $("tip"), g = sel.value, t = T();
    const say = v => v == null ? "–" : Math.abs(Math.round(v)) + "", how = v => v == null ? "" : v <= 0 ? t.cheaper : t.dearer;
    T2.replaceChildren(el("div", D.days[k], "when"));
    tipRow(T2, "var(--series-1)", false, say(devDay[g][k]), nm(g) + ": " + how(devDay[g][k]));
    tipRow(T2, "var(--series-2)", false, say(medDay[k]), t.medianFund + ": " + how(medDay[k]));
    place(ev, T2);
  });
}

// ---- the language: every text is written again in the one chosen
const rlShow = rlMenu(setLang);
function setLang(l) {
  LANG = MSG[l] ? l : "en";
  try { localStorage.setItem("tm_report_lang", LANG); } catch (e) { }
  document.documentElement.lang = LANG; document.documentElement.dir = RTL() ? "rtl" : "ltr";
  rlShow(LANG);
  HUB = nm(D.hub);
  $("tip").style.display = "none";
  shell(); fundList(); render(); hero(); allFunds();
}

sel.onchange = allFunds;
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { hero(); allFunds(); });
setLang(LANG);
const settle = () => { for (const id of ["hero", "all"]) Plotly.Plots.resize($(id)); };      // sizes are final only after the first layout
requestAnimationFrame(settle); addEventListener("load", settle); setTimeout(settle, 400);
