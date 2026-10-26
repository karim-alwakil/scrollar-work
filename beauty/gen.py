# Generates the beauty concept pages from one template. Run: python3 gen.py
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))

TEMPLATE = """<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="{fonts}" rel="stylesheet">
<link rel="stylesheet" href="../base.css">
<style>
:root{{color-scheme:{scheme};{tokens}}}
{extra}
</style>
</head>
<body>
<nav class="wrap"><a class="brand" id="brand" href="#">{title}</a><div class="navr"><button class="chip" id="langBtn" type="button">عربي</button><a class="cta" id="navBook" href="#book">Book</a></div></nav>
<div id="story"><div class="sticky"><div class="glow"></div><canvas id="stage" aria-label="3D scene"></canvas>
  <div class="layer wrap" id="lHero" data-step="0,0.13"></div>
  <div class="layer wrap" id="lC0" data-step="0.2,0.4"></div>
  <div class="layer wrap" id="lC1" data-step="0.43,0.63"></div>
  <div class="layer wrap" id="lC2" data-step="0.66,0.86"></div>
  <div class="layer wrap" id="lEnd" data-step="0.9,1"></div>
  <div class="track"><div id="progress"></div></div>
</div></div>
<section class="blk wrap" id="book"><div class="shead"><h2 id="bookH"></h2><p id="bookP"></p></div><div class="book"><div class="steps" id="steps"></div><aside class="summary" id="summary"></aside></div></section>
<section class="blk wrap"><div class="shead"><h2 id="ownerH"></h2><p id="ownerP"></p></div><div class="owner" id="owner"></div></section>
<footer class="wrap" id="foot"></footer>
<script>window.CONCEPT = {config};</script>
<script src="../engine.js"></script>
<script type="importmap">{{"imports":{{"three":"../../vendor/three.module.js","three/addons/":"../../vendor/addons/"}}}}</script>
<script type="module" src="{scene_src}"></script>
</body>
</html>
"""

def L(en, ar): return {"en": en, "ar": ar}

CONCEPTS = {
 "fade-district": dict(
  title="Fade District", scheme="dark",
  desc="Fade District, a barbershop concept in Cairo by Scrollar: 3D story and booking in four taps.",
  fonts="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800&family=Archivo:wght@400;500;700&family=Lalezar&family=Readex+Pro:wght@400;600&display=swap",
  tokens="--bg:#0e0f11;--panel:#16181b;--ink:#f1eee8;--mut:#8d9097;--accent:#e23b2e;--accent-ink:#ffffff;--sel:rgba(226,59,46,.16);--line:rgba(241,238,232,.12);"
         "--display:'Big Shoulders Display',Impact,sans-serif;--display-w:800;--display-ls:.005em;--body:'Archivo',Arial,sans-serif;--ar-display:'Lalezar','Readex Pro',sans-serif;--ar-body:'Readex Pro',Tahoma,sans-serif;"
         "--radius:6px;--radius-sm:6px;--radius-lg:10px;--glow:radial-gradient(55% 60% at 70% 45%,rgba(226,59,46,.18),transparent 70%);",
  scene_src="scene.js",
  extra="html[lang=en] h1,html[lang=en] h2,html[lang=en] .brand{text-transform:uppercase}"
        "#story{height:760vh}.glow{display:none}"
        "@media(min-width:761px){.hero,.chapter{background:rgba(11,12,14,.8);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);padding:30px 32px;border-radius:10px;box-shadow:0 30px 80px rgba(0,0,0,.45)}.chapter{max-width:430px}}",
  config=dict(
   id="fade-district", name=L("Fade District", "فيد ديستريكت"), city=L("Barbershop / Nasr City, Cairo", "باربر شوب / مدينة نصر، القاهرة"),
   staffWord=L("barber", "الحلاق"), currency=L("EGP", "ج.م"), wa="", defaultLang="en", arLocale="ar-EG",
   hours=dict(open="12:00", close="23:30", step=30, closed=[]),
   services=[dict(id="cut", name=L("Classic haircut", "قصة شعر كلاسيك"), min=30, price=250),
             dict(id="fade", name=L("Skin fade", "سكين فيد"), min=45, price=300),
             dict(id="combo", name=L("Cut and beard", "شعر ودقن"), min=60, price=400),
             dict(id="beard", name=L("Beard sculpt", "تحديد دقن"), min=20, price=150),
             dict(id="shave", name=L("Hot towel shave", "حلاقة بالفوطة السخنة"), min=30, price=200),
             dict(id="kids", name=L("Kids cut", "قصة أطفال"), min=30, price=180, note=L("Under 12", "أقل من 12 سنة"))],
   staff=[dict(id="karim", name=L("Karim", "كريم"), role=L("Fades", "فيد")), dict(id="youssef", name=L("Youssef", "يوسف"), role=L("Beards", "دقن")), dict(id="omar", name=L("Omar", "عمر"), role=L("Classic", "كلاسيك"))],
   clients=[L("Ahmed", "أحمد"), L("Mostafa", "مصطفى"), L("Hassan", "حسن"), L("Ziad", "زياد"), L("Seif", "سيف"), L("Adham", "أدهم"), L("Mahmoud", "محمود"), L("Ali", "علي")],
   story=dict(
    hero=dict(eyebrow=L("Barbershop / Nasr City", "باربر شوب / مدينة نصر"), h1=L("Sharp cuts. <em>Zero waiting.</em>", "قصّة مظبوطة. <em>من غير انتظار.</em>"),
              p=L("Pick your barber, your cut and your time. Walk in when your chair is ready.", "اختار الحلاق والقصة والميعاد، وتعالى لما الكرسي يكون جاهز.")),
    facts=[dict(v=L("3 barbers", "3 حلاقين"), k=L("Fades, beards, classics", "فيد ودقن وكلاسيك")), dict(v=L("12pm to 11:30pm", "12 الضهر لـ 11:30 بالليل"), k=L("Every day", "كل يوم")), dict(v=L("From 150 EGP", "من 150 ج.م"), k=L("Beard sculpt", "تحديد دقن"))],
    chapters=[dict(k=L("The chair", "الكرسي"), h=L("Your slot, held for you.", "ميعادك محجوز ليك."), p=L("See live free slots for every barber. No calls, no crowd at the door.", "شوف المواعيد الفاضية لكل حلاق على طول. من غير مكالمات ولا زحمة على الباب.")),
              dict(k=L("The barber", "الحلاق"), h=L("Pick who cuts.", "اختار مين يقصلك."), p=L("Karim for fades, Youssef for beards, Omar for the classics. Your choice, every time.", "كريم للفيد، يوسف للدقن، عمر للكلاسيك. انت اللي بتختار كل مرة.")),
              dict(k=L("The finish", "اللمسة الأخيرة"), h=L("Hot towel, straight razor.", "فوطة سخنة وموس."), p=L("Add a hot towel shave in one tap and get a reminder an hour before.", "ضيف حلاقة بالفوطة السخنة بضغطة، وهيوصلك تذكير قبلها بساعة."))],
    end=L("See you <em>in the chair.</em>", "نشوفك <em>على الكرسي.</em>")),
   scene=dict(objects=[["pole", 0.9], ["shears", 0.8], ["razor", 0.95]], metal=0xc9ccd2, handle=0x101113, exposure=1.15, ambient=0.4, rimColor=0xff6655, shadowOpacity=0.55))),

 "maison-noor": dict(
  title="Maison Noor", scheme="light",
  desc="Maison Noor, a women's salon concept in New Cairo by Scrollar: 3D story, stylist schedules and booking.",
  fonts="https://fonts.googleapis.com/css2?family=Italiana&family=Jost:wght@400;500;600&family=El+Messiri:wght@500;600&family=Alexandria:wght@400;500&display=swap",
  tokens="--bg:#f7eef0;--panel:#fffafb;--ink:#2a1622;--mut:#86697a;--accent:#a8436b;--accent-ink:#ffffff;--sel:rgba(168,67,107,.12);--line:rgba(42,22,34,.12);"
         "--display:'Italiana',Didot,serif;--display-w:400;--display-ls:.01em;--body:'Jost',Futura,sans-serif;--ar-display:'El Messiri',serif;--ar-body:'Alexandria',Tahoma,sans-serif;"
         "--radius:999px;--radius-sm:16px;--radius-lg:28px;--glow:radial-gradient(55% 60% at 68% 45%,rgba(168,67,107,.14),transparent 70%);",
  scene_src="scene.js",
  extra=(".hero h1{font-size:clamp(52px,7.6vw,118px)}#story{height:640vh}.glow{display:none}#stage{image-rendering:auto}"
         "@media(min-width:761px){.hero,.chapter{background:rgba(255,250,251,.62);-webkit-backdrop-filter:blur(18px) saturate(1.2);backdrop-filter:blur(18px) saturate(1.2);padding:32px 34px;border-radius:28px;box-shadow:0 30px 80px rgba(80,20,40,.18)}.chapter{max-width:440px;border-inline-start:0}.hero{max-width:560px}}"
         "@media(max-width:760px){.hero,.chapter{background:linear-gradient(rgba(247,238,240,0),rgba(247,238,240,.92) 22%)}}"),
  config=dict(
   id="maison-noor", name=L("Maison Noor", "ميزون نور"), city=L("Women's salon / New Cairo", "صالون حريمي / القاهرة الجديدة"),
   staffWord=L("stylist", "الستايلست"), currency=L("EGP", "ج.م"), wa="", defaultLang="en", arLocale="ar-EG",
   hours=dict(open="11:00", close="21:00", step=30, closed=[1]),
   services=[dict(id="blow", name=L("Blow-dry", "سشوار"), min=45, price=450),
             dict(id="cut", name=L("Cut and style", "قص وتصفيف"), min=60, price=700),
             dict(id="roots", name=L("Root color", "صبغة جذور"), min=90, price=1500),
             dict(id="gloss", name=L("Gloss treatment", "حمام كريم لامع"), min=60, price=900),
             dict(id="mani", name=L("Manicure", "مانيكير"), min=45, price=350),
             dict(id="gel", name=L("Gel nails", "أظافر جل"), min=60, price=600)],
   staff=[dict(id="nour", name=L("Nour", "نور"), role=L("Hair", "شعر")), dict(id="salma", name=L("Salma", "سلمى"), role=L("Color", "صبغة")), dict(id="mariam", name=L("Mariam", "مريم"), role=L("Nails", "أظافر"))],
   clients=[L("Hana", "هنا"), L("Yasmin", "ياسمين"), L("Farida", "فريدة"), L("Malak", "ملك"), L("Nada", "ندى"), L("Laila", "ليلى"), L("Jana", "جنى")],
   story=dict(
    hero=dict(eyebrow=L("Women only / New Cairo", "للسيدات فقط / القاهرة الجديدة"), h1=L("Your hour, <em>beautifully booked.</em>", "ساعتك، <em>محجوزة بشياكة.</em>"),
              p=L("Hair, color and nails by women, for women. Choose your stylist and your time in a few taps.", "شعر وصبغة وأظافر، من سيدات لسيدات. اختاري الستايلست والميعاد في كام ضغطة.")),
    facts=[dict(v=L("Women only", "سيدات فقط"), k=L("Private, all-female team", "فريق كله سيدات")), dict(v=L("11am to 9pm", "11 الصبح لـ 9 بالليل"), k=L("Closed Mondays", "الاتنين إجازة")), dict(v=L("From 350 EGP", "من 350 ج.م"), k=L("Manicure", "مانيكير"))],
    chapters=[dict(k=L("The mirror", "المراية"), h=L("See your stylist's day.", "شوفي يوم الستايلست بتاعتك."), p=L("Live free times for Nour, Salma and Mariam, so you book the hour that suits you.", "مواعيد نور وسلمى ومريم الفاضية قدامك، فتحجزي الساعة اللي تناسبك.")),
              dict(k=L("The hair", "الشعر"), h=L("Color without the guesswork.", "صبغة من غير تخمين."), p=L("Every service shows its time and price up front. No surprises at the counter.", "كل خدمة مكتوب وقتها وسعرها من الأول. مفيش مفاجآت عند الحساب.")),
              dict(k=L("The finish", "اللمسة الأخيرة"), h=L("Nails to match.", "أظافر على نفس الستايل."), p=L("Add a manicure to any booking and get a reminder the evening before.", "ضيفي مانيكير لأي حجز، وهيوصلك تذكير بالليل قبلها."))],
    end=L("Your hour <em>is waiting.</em>", "ساعتك <em>مستنياكي.</em>")),
   scene=dict(objects=[["mirror", 1.0], ["strands", 0.95], ["polish", 1.05]], metal=0xe6b9a6, handle=0x2a1622, liquid=0xa8436b, exposure=0.95, ambient=0.25, shadow=0x2a1622, shadowOpacity=0.14, rimColor=0xffc2d6))),

 "al-majlis": dict(
  title="Al Majlis Grooming", scheme="dark",
  desc="Al Majlis Grooming, a premium grooming lounge concept in Riyadh by Scrollar: 3D story and booking with deposits.",
  fonts="https://fonts.googleapis.com/css2?family=Marcellus&family=Manrope:wght@400;500;700&family=Reem+Kufi:wght@500;600&family=Tajawal:wght@400;500;700&family=Aref+Ruqaa:wght@700&display=swap",
  tokens="--bg:#0b0907;--panel:#17120d;--ink:#efe6d2;--mut:#a89c88;--accent:#c9a44c;--accent-ink:#0d1f1a;--sel:rgba(201,164,76,.16);--line:rgba(239,230,210,.13);"
         "--display:'Marcellus',Georgia,serif;--display-w:400;--display-ls:.01em;--body:'Manrope',Arial,sans-serif;--ar-display:'Reem Kufi',sans-serif;--ar-body:'Tajawal',Tahoma,sans-serif;"
         "--radius:10px;--radius-sm:10px;--radius-lg:18px;--glow:radial-gradient(55% 60% at 32% 45%,rgba(201,164,76,.16),transparent 70%);",
  scene_src="scene.js",
  extra=("#story{height:700vh}.glow{background:radial-gradient(26% 20% at var(--gx,50%) 104%,rgba(214,150,70,.28),transparent 70%)}html[dir=rtl] .glow{--gx:50%}"
         "@media(min-width:761px){.hero,.chapter{background:rgba(10,8,6,.78);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);padding:30px 32px;border-radius:14px;box-shadow:0 30px 80px rgba(0,0,0,.5)}.chapter{max-width:430px}.hero{max-width:540px}}"),
  config=dict(
   id="al-majlis", name=L("Al Majlis Grooming", "المجلس للعناية الرجالية"), city=L("Grooming lounge / Riyadh", "صالون رجالي / الرياض"),
   staffWord=L("barber", "الحلاق"), currency=L("SAR", "ر.س"), wa="", defaultLang="ar", arLocale="ar-SA", deposit=50,
   hours=dict(open="14:00", close="24:00", step=30, closed=[]),
   services=[dict(id="cut", name=L("Haircut", "قص الشعر"), min=40, price=80),
             dict(id="beard", name=L("Beard sculpt", "تحديد اللحية"), min=30, price=60),
             dict(id="royal", name=L("Royal grooming", "العناية الملكية"), min=90, price=220, note=L("Cut, beard, hot towel", "شعر ولحية وفوطة حارة")),
             dict(id="oud", name=L("Oud steam facial", "تنظيف بخار العود"), min=45, price=150),
             dict(id="kids", name=L("Boys' cut", "قص شعر الأولاد"), min=30, price=50)],
   staff=[dict(id="faisal", name=L("Faisal", "فيصل"), role=L("Master", "معلّم")), dict(id="turki", name=L("Turki", "تركي"), role=L("Beards", "لحى")), dict(id="hamza", name=L("Hamza", "حمزة"), role=L("Fades", "فيد"))],
   clients=[L("Abdullah", "عبدالله"), L("Khalid", "خالد"), L("Saud", "سعود"), L("Nawaf", "نواف"), L("Fahad", "فهد"), L("Majed", "ماجد"), L("Sultan", "سلطان")],
   ui=dict(ar=dict(book="احجز الحين", step1="اختر الخدمة", step2="اختر {staff}", step3="اختر اليوم", step4="اختر الوقت", any="أي حلاق متاح",
                   pick="اختر الخدمة واليوم والوقت", confirm="أكّد عبر واتساب", deposit="عربون لتثبيت الموعد", name="اسمك الكريم",
                   ready="انفتح واتساب بتفاصيل حجزك. أرسل الرسالة عشان تأكد. وصار الحجز ظاهر في جدول المالك تحت.",
                   bookH="احجز في أربع خطوات", bookP="بدون اتصالات ولا انتظار. اختر اللي يناسبك وأكّد عبر واتساب.",
                   ownerH="وش يشوف صاحب المحل", ownerP="كل الحجوزات تنزل في جدول واحد لكل {staff}، والتذكيرات تنرسل تلقائياً.",
                   demo="نسخة تجريبية: الحجز يروح لسكرولار عبر واتساب، مو لمحل حقيقي.", today="اليوم", busy="نسبة الإشغال",
                   foot="تصميم مبدئي من سكرولار. {name} نشاط تخيّلي يوضّح وش تبني سكرولار.", back="ارجع لسكرولار")),
   story=dict(
    hero=dict(eyebrow=L("Grooming lounge / Riyadh", "صالون رجالي / الرياض"), h1=L("Grooming, <em>the majlis way.</em>", "عناية رجالية <em>على أصولها.</em>"),
              p=L("Oud, hot towels and master barbers. Reserve your seat with a small deposit and arrive to a ready chair.", "عود وفوطة حارة وحلاقين محترفين. احجز مقعدك بعربون بسيط وتوصل والكرسي جاهز.")),
    facts=[dict(v=L("3 masters", "3 حلاقين"), k=L("Beards, fades, classic", "لحى وفيد وكلاسيك")), dict(v=L("2pm to midnight", "2 الظهر لـ 12 بالليل"), k=L("Every day", "كل يوم")), dict(v=L("50 SAR deposit", "عربون 50 ر.س"), k=L("Holds your slot", "يثبّت موعدك"))],
    chapters=[dict(k=L("The welcome", "الاستقبال"), h=L("Oud on arrival.", "العود أول ما توصل."), p=L("Your seat is ready when you walk in. No queue in the lounge.", "مقعدك جاهز أول ما تدخل. ما في انتظار في الصالة.")),
              dict(k=L("The craft", "الحرفة"), h=L("Gold shears, a master's hand.", "مقص ذهبي بيد معلّم."), p=L("Book Faisal, Turki or Hamza by name, at the time that suits you.", "احجز مع فيصل أو تركي أو حمزة بالاسم، في الوقت اللي يناسبك.")),
              dict(k=L("The beard", "اللحية"), h=L("Shaped to your face.", "لحية مرسومة على وجهك."), p=L("A 50 SAR deposit holds the slot and is taken off your bill.", "عربون 50 ر.س يثبّت الموعد وينخصم من الفاتورة."))],
    end=L("Your seat <em>awaits.</em>", "مقعدك <em>بانتظارك.</em>")),
   scene=dict(objects=[["mabkhara", 1.0], ["razor", 0.95], ["comb", 0.9]], metal=0xd8b25e, handle=0x2b1a10, wood=0x5a3520, exposure=1.1, ambient=0.4, rimColor=0xffd28a, shadowOpacity=0.5))),
}

import copy
_b = copy.deepcopy(CONCEPTS["fade-district"])
_b["scene_src"] = "scene.js"
_b["desc"] = "Fade District B, a barbershop concept by Scrollar: the scroll gives the haircut."
_b["extra"] = ("html[lang=en] h1,html[lang=en] h2,html[lang=en] .brand{text-transform:uppercase}#story{height:640vh}.glow{display:none}"
  "#stage{-webkit-mask-image:radial-gradient(62% 72% at 50% 50%,#000 55%,transparent 100%);mask-image:radial-gradient(62% 72% at 50% 50%,#000 55%,transparent 100%)}"
  "@media(min-width:761px){.hero,.chapter{background:rgba(11,12,14,.8);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);padding:30px 32px;border-radius:10px;box-shadow:0 30px 80px rgba(0,0,0,.45)}.chapter{max-width:430px}.hero{max-width:520px}"
  "#stage{-webkit-mask-image:radial-gradient(40% 62% at 74% 50%,#000 50%,transparent 100%);mask-image:radial-gradient(40% 62% at 70% 50%,#000 50%,transparent 100%)}"
  "html[dir=rtl] #stage{-webkit-mask-image:radial-gradient(40% 62% at 26% 50%,#000 50%,transparent 100%);mask-image:radial-gradient(40% 62% at 26% 50%,#000 50%,transparent 100%)}}"
  "@media(max-width:760px){#stage{-webkit-mask-image:radial-gradient(75% 40% at 50% 34%,#000 50%,transparent 100%);mask-image:radial-gradient(75% 40% at 50% 34%,#000 50%,transparent 100%)}}")
_b["config"]["id"] = "fade-district-b"
_b["config"]["story"]["chapters"] = [
  dict(k=L("The fade", "الفيد"), h=L("Clean from the first pass.", "نضيف من أول باصة."), p=L("Skin, low, mid or high. Pick the fade you want and the barber who nails it.", "سكين أو لو أو ميد أو هاي. اختار الفيد اللي عايزه والحلاق اللي بيظبطه.")),
  dict(k=L("The line-up", "التحديد"), h=L("Sharp lines, every time.", "خطوط حادة كل مرة."), p=L("Hard parts and line-ups done with a steady hand, not guesswork. Book Karim for the sharpest edges.", "الفرق والتحديد بإيد ثابتة مش بالتخمين. احجز مع كريم لأحد خطوط.")),
  dict(k=L("The finish", "اللمسة الأخيرة"), h=L("Hot towel, straight razor.", "فوطة سخنة وموس."), p=L("Add a hot towel shave in one tap and get a reminder an hour before.", "ضيف حلاقة بالفوطة السخنة بضغطة، وهيوصلك تذكير قبلها بساعة."))]
CONCEPTS["fade-district-b"] = _b

_c = copy.deepcopy(CONCEPTS["fade-district"])
_c["scene_src"] = "scene.js"
_c["desc"] = "Fade District C, a barbershop concept by Scrollar: one glass barber pole carries the story on its stripes."
_c["extra"] = ("html[lang=en] h1,html[lang=en] h2,html[lang=en] .brand{text-transform:uppercase}#story{height:600vh}.glow{display:none}"
  "@media(min-width:761px){.hero,.chapter{background:rgba(11,12,14,.8);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);padding:30px 32px;border-radius:10px;box-shadow:0 30px 80px rgba(0,0,0,.45)}.chapter{max-width:430px}.hero{max-width:540px}}")
_c["config"]["id"] = "fade-district-c"
CONCEPTS["fade-district-c"] = _c

for slug, c in CONCEPTS.items():
    os.makedirs(os.path.join(HERE, slug), exist_ok=True)
    html = TEMPLATE.format(title=c["title"], desc=c["desc"], fonts=c["fonts"], scheme=c["scheme"], tokens=c["tokens"], extra=c["extra"],
                           config=json.dumps(c["config"], ensure_ascii=False), scene_src=c.get("scene_src", "../scene.js"))
    open(os.path.join(HERE, slug, "index.html"), "w").write(html)
    print("wrote", slug)
