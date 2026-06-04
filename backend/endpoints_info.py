"""Knowledge base untuk 12 endpoint Tox21 — bahasa Indonesia.

Sumber:
- Huang et al. (2016) "Tox21Challenge to Build Predictive Models of Nuclear Receptor and Stress Response Pathways"
- EPA Endocrine Disruptor Screening Program (EDSP) documentation
- NTP (National Toxicology Program) toxicology reports
- FDA EDSP21 data collection work plan
"""

ENDPOINTS_INFO = [
    # ── NUCLEAR RECEPTORS ─────────────────────────────────────────────────────

    {
        "name": "NR-AR",
        "full_name": "Nuclear Receptor — Androgen Receptor",
        "category": "Nuclear Receptor",
        "category_slug": "nr",
        "biological_role": (
            "Reseptor androgen (AR) adalah protein transkripsi yang diaktifkan oleh hormon "
            "androgen seperti testosteron dan dihidrotestosteron (DHT). Ketika hormon berikatan, "
            "AR berpindah ke nukleus dan mengatur gen yang bertanggung jawab untuk perkembangan "
            "karakteristik seksual pria, massa otot, dan produksi sel darah merah."
        ),
        "health_impact": (
            "Gangguan pada AR dapat menyebabkan sindrom insensitivitas androgen, infertilitas "
            "pria, perkembangan seksual abnormal pada janin, dan perubahan perilaku. Bahan kimia "
            "yang bertindak sebagai agonis AR dapat menstimulasi pertumbuhan sel kanker prostat, "
            "sedangkan antagonis dapat mengganggu perkembangan reproduksi pria."
        ),
        "regulatory_context": (
            "EPA memasukkan uji AR sebagai bagian wajib dari Tier 1 EDSP (Endocrine Disruptor "
            "Screening Program). FDA juga mensyaratkan pengujian ini untuk bahan kimia yang "
            "digunakan dalam produk konsumen dan pestisida."
        ),
        "example_disruptors": ["Flutamide", "Vinclozolin", "DDT (p,p'-DDE)", "Bisphenol A", "Testosteron sintetik"],
        "assay_description": (
            "Tox21 menggunakan sel MDA-kb2 (sel kanker payudara yang distabilkan dengan reseptor "
            "AR manusia) dengan laporan luciferase — jika molekul mengaktifkan AR, sel akan "
            "menghasilkan cahaya yang dapat diukur."
        ),
    },

    {
        "name": "NR-AR-LBD",
        "full_name": "Nuclear Receptor — Androgen Receptor Ligand Binding Domain",
        "category": "Nuclear Receptor",
        "category_slug": "nr",
        "biological_role": (
            "Uji ini secara spesifik mengukur ikatan langsung molekul ke domain pengikatan ligan "
            "(LBD) dari reseptor androgen, bukan respons transkripsi penuh. LBD adalah 'kantong' "
            "tempat hormon androgen alami seperti DHT berikatan untuk mengaktifkan reseptor."
        ),
        "health_impact": (
            "Ikatan langsung ke LBD-AR adalah mekanisme molekuler pertama yang harus terjadi "
            "sebelum gangguan endokrin berlangsung. Molekul yang berikatan kuat ke LBD dapat "
            "menghambat ikatan DHT alami (antagonisme) atau memicu aktivasi abnormal reseptor "
            "(agonis palsu), keduanya berpotensi mengganggu fungsi reproduksi dan perkembangan janin pria."
        ),
        "regulatory_context": (
            "Uji LBD sering digunakan bersama uji transkripsi penuh (NR-AR) untuk membedakan "
            "apakah aktivitas gangguan terjadi di tingkat ikatan ligan atau mekanisme hilir. "
            "EPA menggunakan kombinasi keduanya dalam penilaian risiko EDSP."
        ),
        "example_disruptors": ["Flutamide", "Bicalutamide", "p,p'-DDE", "Hydroxyflutamide"],
        "assay_description": (
            "Tox21 menggunakan uji kompetisi berbasis sel dengan LBD-AR yang difusikan ke protein "
            "pelapor — ketika molekul uji menggeser ligan referensi, sinyal berubah secara terukur."
        ),
    },

    {
        "name": "NR-AhR",
        "full_name": "Nuclear Receptor — Aryl Hydrocarbon Receptor",
        "category": "Nuclear Receptor",
        "category_slug": "nr",
        "biological_role": (
            "Aryl Hydrocarbon Receptor (AhR) adalah sensor lingkungan dalam sel yang mendeteksi "
            "senyawa aromatik polisiklik dari lingkungan. AhR mengatur metabolisme xenobiotik "
            "melalui enzim CYP1A1 dan CYP1B1, respons imun, diferensiasi sel, dan perkembangan "
            "pembuluh darah. AhR bukan reseptor nuklir klasik tetapi berperilaku serupa."
        ),
        "health_impact": (
            "Aktivasi berlebihan AhR oleh kontaminan seperti dioksin menyebabkan klorakne, "
            "kerusakan hati, imunosupresi, dan gangguan perkembangan janin. TCDD (dioksin paling "
            "toksik) adalah agonis AhR terkuat yang dikenal. Selain toksisitas, aktivasi AhR "
            "kronis dikaitkan dengan kanker paru, kolorektal, dan gangguan autoimun."
        ),
        "regulatory_context": (
            "EPA dan WHO menggunakan Toxic Equivalency Factors (TEF) yang didasarkan pada "
            "aktivitas AhR relatif terhadap TCDD untuk menilai risiko campuran dioksin dan PCB. "
            "AhR adalah biomarker kunci dalam pemantauan kontaminasi lingkungan."
        ),
        "example_disruptors": ["TCDD (Dioksin)", "Benzo[a]pyrene", "PCB 126", "β-Naphthoflavone", "Indirubin"],
        "assay_description": (
            "Tox21 menggunakan sel HepG2 (hepatosit manusia) dengan elemen respons AhR (AHRE) "
            "yang terhubung ke gen luciferase — aktivasi AhR menghasilkan sinyal bioluminesen."
        ),
    },

    {
        "name": "NR-Aromatase",
        "full_name": "Nuclear Receptor — Aromatase (CYP19A1)",
        "category": "Nuclear Receptor",
        "category_slug": "nr",
        "biological_role": (
            "Aromatase (enzim CYP19A1) mengkatalisis konversi androgen (testosteron, androstenedion) "
            "menjadi estrogen (estradiol, estron). Enzim ini kritis untuk keseimbangan hormon seks "
            "pada pria dan wanita, mempengaruhi kesuburan, kepadatan tulang, fungsi kardiovaskular, "
            "dan perkembangan otak."
        ),
        "health_impact": (
            "Inhibisi aromatase menyebabkan penurunan estrogen — dimanfaatkan secara terapeutik "
            "dalam kanker payudara (obat seperti letrozole) tetapi berbahaya jika terjadi karena "
            "paparan kimia lingkungan tanpa disengaja. Gangguan aromatase pada anak laki-laki "
            "dapat menghambat pertumbuhan tulang; pada wanita menyebabkan osteoporosis dan "
            "masalah kardiovaskular."
        ),
        "regulatory_context": (
            "Aromatase adalah target kunci dalam program EDSP EPA karena banyak pestisida dan "
            "bahan kimia industri diketahui menginhibisi enzim ini. Pengujian ini diperlukan "
            "untuk semua bahan kimia yang melalui penilaian risiko endokrin."
        ),
        "example_disruptors": ["Atrazine", "Fenarimol", "Prochloraz", "Imazalil", "Letrozole"],
        "assay_description": (
            "Tox21 menggunakan sel H295R (karsinoma adrenokortikal) yang secara alami "
            "mengekspresikan aromatase — aktivitas enzim diukur melalui konversi testosteron "
            "menjadi estradiol menggunakan ELISA atau assay fluoresen."
        ),
    },

    {
        "name": "NR-ER",
        "full_name": "Nuclear Receptor — Estrogen Receptor alpha",
        "category": "Nuclear Receptor",
        "category_slug": "nr",
        "biological_role": (
            "Reseptor estrogen alfa (ERα) mengatur ekspresi gen yang berperan dalam perkembangan "
            "seksual wanita, siklus menstruasi, kehamilan, pembentukan tulang, fungsi jantung, "
            "dan kognisi. ERα diekspresikan di jaringan payudara, uterus, tulang, hati, dan otak."
        ),
        "health_impact": (
            "Bahan kimia yang meniru estrogen (xenoestrogen) dapat merangsang pertumbuhan "
            "sel kanker payudara dan endometriosis. Paparan early-life terhadap xenoestrogen "
            "dapat memicu pubertas dini, gangguan kesuburan, dan meningkatkan risiko kanker "
            "reproduktif di kemudian hari. Pada pria, aktivasi ERα berlebihan dapat menyebabkan "
            "ginekomastia dan penurunan sperma."
        ),
        "regulatory_context": (
            "Pengujian ERα adalah komponen wajib Tier 1 EDSP EPA. Senyawa yang positif pada "
            "uji ini memerlukan pengujian in vivo tambahan. Peraturan Uni Eropa juga mewajibkan "
            "pengujian aktivitas estrogenik untuk semua zat aktif pestisida baru."
        ),
        "example_disruptors": ["Diethylstilbestrol (DES)", "Genistein", "Bisphenol A", "17α-Ethinylestradiol", "Nonylphenol"],
        "assay_description": (
            "Tox21 menggunakan sel BG1Luc4E2 (sel kanker ovarium dengan ERα dan laporan "
            "luciferase) — agonis ERα meningkatkan ekspresi luciferase secara proporsional."
        ),
    },

    {
        "name": "NR-ER-LBD",
        "full_name": "Nuclear Receptor — Estrogen Receptor Ligand Binding Domain",
        "category": "Nuclear Receptor",
        "category_slug": "nr",
        "biological_role": (
            "Mirip dengan NR-AR-LBD, uji ini mengukur ikatan langsung ke domain pengikatan ligan "
            "reseptor estrogen alfa. LBD-ERα memiliki kantong ikatan yang relatif fleksibel dan "
            "dapat menampung berbagai molekul dengan struktur berbeda, menjadikannya target gangguan "
            "endokrin yang paling sering dijumpai di lingkungan."
        ),
        "health_impact": (
            "Afinitas ikatan langsung ke LBD-ERα berkorelasi kuat dengan potensi gangguan "
            "estrogenik suatu molekul. Senyawa dengan afinitas ikatan tinggi berisiko tinggi "
            "mempengaruhi jaringan yang bergantung estrogen — terutama pada masa perkembangan "
            "janin, bayi, dan remaja di mana sistem endokrin sangat sensitif."
        ),
        "regulatory_context": (
            "Uji LBD-ERα digunakan sebagai filter awal dalam EDSP — senyawa dengan aktivitas "
            "positif di sini otomatis memerlukan evaluasi lebih lanjut. FDA menggunakan data ini "
            "untuk menilai keamanan bahan tambahan pangan dan kemasan."
        ),
        "example_disruptors": ["Estradiol (kontrol positif)", "Tamoxifen", "Raloxifene", "Coumestrol", "Zearalenone"],
        "assay_description": (
            "Tox21 menggunakan uji kompetisi berbasis waktu-terselesaikan (TR-FRET) dengan "
            "LBD-ERα rekombinan — ikatan molekul uji menggeser peptida koaktivator berlabel "
            "fluoresen yang dapat diukur."
        ),
    },

    {
        "name": "NR-PPAR-gamma",
        "full_name": "Nuclear Receptor — Peroxisome Proliferator-Activated Receptor Gamma",
        "category": "Nuclear Receptor",
        "category_slug": "nr",
        "biological_role": (
            "PPARγ adalah faktor transkripsi yang mengendalikan diferensiasi sel lemak (adipogenesis), "
            "sensitivitas insulin, metabolisme glukosa dan lipid, serta regulasi inflamasi. "
            "PPARγ banyak diekspresikan di jaringan adiposa dan sistem imun, dan merupakan "
            "target obat diabetes kelas thiazolidinediones (TZD)."
        ),
        "health_impact": (
            "Aktivasi PPARγ yang tidak tepat oleh bahan kimia lingkungan dapat mendorong "
            "diferensiasi sel adiposa berlebihan, berkontribusi pada obesitas, resistensi insulin, "
            "dan diabetes tipe 2. Beberapa organotin (tributyltin dari cat kapal) adalah agonis "
            "PPARγ kuat dan dikaitkan dengan epidemi obesitas. Inhibisi PPARγ sebaliknya "
            "dapat mengganggu metabolisme lemak dan respons inflamasi."
        ),
        "regulatory_context": (
            "EPA dan NIEHS semakin memperhatikan PPARγ sebagai target 'obesogen' — bahan kimia "
            "yang mendorong penambahan berat badan di luar kalori. Pengujian ini menjadi bagian "
            "dari evaluasi bahan kimia yang mempengaruhi metabolisme."
        ),
        "example_disruptors": ["Tributyltin (TBT)", "Rosiglitazone", "Phthalate (DEHP)", "Bisphenol A", "Perfluorooctanoic acid (PFOA)"],
        "assay_description": (
            "Tox21 menggunakan sel yang mengekspresikan PPARγ-LBD yang difusikan ke protein "
            "pelapor GAL4 — agonis PPARγ mendorong ekspresi gen laporan secara terukur."
        ),
    },

    # ── STRESS RESPONSE ────────────────────────────────────────────────────────

    {
        "name": "SR-ARE",
        "full_name": "Stress Response — Antioxidant Response Element",
        "category": "Stress Response",
        "category_slug": "sr",
        "biological_role": (
            "ARE (Antioxidant Response Element) adalah sekuens DNA yang diaktifkan oleh faktor "
            "transkripsi Nrf2 sebagai respons terhadap stres oksidatif dan elektrositik. "
            "Aktivasi jalur Nrf2-ARE menginduksi enzim detoksifikasi fase II seperti "
            "glutathione S-transferase, NAD(P)H:quinone oxidoreductase (NQO1), dan heme oxygenase-1."
        ),
        "health_impact": (
            "Stres oksidatif kronis yang mengaktifkan ARE secara terus-menerus dikaitkan dengan "
            "penyakit degeneratif, kanker, dan penuaan dini. Bahan kimia yang mengaktifkan ARE "
            "dapat bersifat elektrofilik (reaktif dengan protein/DNA) — mekanisme yang sama "
            "digunakan oleh banyak karsinogen dan mutagen. Di sisi lain, aktivasi ARE sementara "
            "dapat merupakan mekanisme sitoprotektif."
        ),
        "regulatory_context": (
            "Uji SR-ARE digunakan EPA sebagai penanda toksisitas elektrofilik dan oksidatif. "
            "Bahan kimia yang mengaktifkan ARE berisiko tinggi menjadi reaktif secara kimiawi "
            "dan berpotensi merusak DNA atau protein seluler."
        ),
        "example_disruptors": ["tert-Butylhydroquinone (tBHQ)", "Sulforaphane", "Arsenik trioksida", "Curcumin", "Benzo[a]pyrene"],
        "assay_description": (
            "Tox21 menggunakan sel HepG2 dengan elemen ARE yang terhubung ke gen luciferase — "
            "bahan kimia yang menginduksi stres oksidatif akan mengaktifkan promoter dan "
            "meningkatkan bioluminesen."
        ),
    },

    {
        "name": "SR-ATAD5",
        "full_name": "Stress Response — ATPase Family AAA Domain-Containing Protein 5",
        "category": "Stress Response",
        "category_slug": "sr",
        "biological_role": (
            "ATAD5 (juga dikenal sebagai ELG1) adalah protein yang terlibat dalam menjaga "
            "stabilitas genom dan respons kerusakan DNA. ATAD5 membantu melepas PCNA "
            "(Proliferating Cell Nuclear Antigen) dari kromatin setelah replikasi DNA selesai, "
            "mencegah akumulasi PCNA yang dapat menyebabkan instabilitas genetik."
        ),
        "health_impact": (
            "Aktivasi ekspresi ATAD5 mengindikasikan bahwa sel sedang mengalami kerusakan DNA. "
            "Bahan kimia yang positif pada uji ini berpotensi merusak integritas DNA secara "
            "langsung (genotoksik) — mekanisme utama karsinogenesis. Mutasi ATAD5 pada manusia "
            "dikaitkan dengan peningkatan risiko kanker ovarium dan kanker kolorektal."
        ),
        "regulatory_context": (
            "SR-ATAD5 digunakan sebagai penanda genotoksisitas dalam program Tox21. Bahan kimia "
            "yang positif di sini memerlukan pengujian genotoksisitas lanjutan (Ames test, "
            "mikronukleus) sebelum dapat digunakan dalam produk konsumen."
        ),
        "example_disruptors": ["Mitomycin C", "Hidroksisemustard", "Actinomycin D", "Camptothecin", "Bleomycin"],
        "assay_description": (
            "Tox21 menggunakan sel HEK293 yang direkayasa dengan promoter ATAD5 terhubung ke "
            "luciferase — kerusakan DNA mengaktifkan promoter ini, menghasilkan sinyal yang "
            "dapat diukur secara kuantitatif."
        ),
    },

    {
        "name": "SR-HSE",
        "full_name": "Stress Response — Heat Shock Element",
        "category": "Stress Response",
        "category_slug": "sr",
        "biological_role": (
            "Heat Shock Element (HSE) adalah sekuens DNA yang diaktifkan oleh faktor transkripsi "
            "HSF1 sebagai respons terhadap stres proteotoksik — kondisi di mana protein seluler "
            "terdenaturasi atau salah lipatan. Aktivasi HSE menginduksi protein chaperone seperti "
            "HSP70, HSP90, dan HSP27 yang membantu memperbaiki atau mendegradasi protein rusak."
        ),
        "health_impact": (
            "Bahan kimia yang mengaktifkan jalur heat shock mengindikasikan bahwa mereka dapat "
            "menyebabkan stres protein seluler — mekanisme toksisitas yang relevan untuk "
            "senyawa yang mengganggu lipatan protein, menginhibisi proteasom, atau menginduksi "
            "stres endoplasmic reticulum. Stres protein kronis dikaitkan dengan penyakit "
            "neurodegeneratif (Parkinson, Alzheimer) dan resistensi kemoterapi."
        ),
        "regulatory_context": (
            "Aktivasi HSE digunakan sebagai indikator stres seluler umum dalam skrining "
            "toksisitas. EPA menggunakan data ini bersama dengan endpoint stres lainnya untuk "
            "membangun profil mekanisme toksisitas suatu bahan kimia."
        ),
        "example_disruptors": ["Cadmium klorida", "Arsenik", "Geldanamycin", "17-AAG", "Celastrol"],
        "assay_description": (
            "Tox21 menggunakan sel yang mengekspresikan elemen HSE (tiga kopi HSE konsensus) "
            "yang terhubung ke luciferase — stres protein mengaktifkan HSF1 yang kemudian "
            "mengikat HSE dan menginduksi ekspresi laporan."
        ),
    },

    {
        "name": "SR-MMP",
        "full_name": "Stress Response — Mitochondrial Membrane Potential",
        "category": "Stress Response",
        "category_slug": "sr",
        "biological_role": (
            "Potensial membran mitokondria (ΔΨm) adalah tegangan listrik negatif yang dipertahankan "
            "di membran dalam mitokondria oleh rantai transpor elektron. ΔΨm sangat penting untuk "
            "produksi ATP melalui sintase ATP, regulasi kalsium mitokondria, import protein, "
            "dan mempertahankan integritas mitokondria."
        ),
        "health_impact": (
            "Gangguan ΔΨm adalah tanda awal kerusakan mitokondria yang mengarah pada apoptosis "
            "(kematian sel terprogram) atau nekrosis. Bahan kimia yang mengganggu ΔΨm dapat "
            "menyebabkan kematian sel di jaringan yang sangat bergantung pada metabolisme "
            "mitokondria seperti jantung, otak, dan otot. Toksisitas mitokondria adalah "
            "mekanisme di balik efek samping beberapa obat (mis. valproate, NRTI)."
        ),
        "regulatory_context": (
            "FDA memasukkan evaluasi toksisitas mitokondria dalam panduan keamanan obat. "
            "EPA menggunakan data ΔΨm untuk mengidentifikasi bahan kimia yang berisiko "
            "terhadap kesehatan jantung dan otak."
        ),
        "example_disruptors": ["Rotenone", "FCCP", "Antimycin A", "Carbonyl cyanide chlorophenylhydrazone", "Staurosporine"],
        "assay_description": (
            "Tox21 menggunakan sel HepG2 dengan pewarna potensiometrik fluoresen (JC-1 atau "
            "MitoTracker) — penurunan ΔΨm menyebabkan perubahan rasio fluoresensi yang dapat "
            "diukur secara kuantitatif."
        ),
    },

    {
        "name": "SR-p53",
        "full_name": "Stress Response — p53 Tumor Suppressor Pathway",
        "category": "Stress Response",
        "category_slug": "sr",
        "biological_role": (
            "p53 adalah protein tumor suppressor yang dijuluki 'penjaga genom' — diaktifkan "
            "oleh berbagai stres seluler termasuk kerusakan DNA, hipoksia, stres onkogen, dan "
            "stres oksidatif. Ketika diaktifkan, p53 dapat menghentikan siklus sel untuk "
            "perbaikan DNA, menginduksi apoptosis jika kerusakan terlalu parah, atau mengatur "
            "metabolisme seluler untuk adaptasi stres."
        ),
        "health_impact": (
            "Bahan kimia yang mengaktifkan jalur p53 mengindikasikan bahwa mereka menyebabkan "
            "kerusakan DNA atau stres genotoksik. Aktivasi p53 berulang oleh paparan kimia "
            "kronis dapat menyebabkan mutasi p53 itu sendiri — kehilangan fungsi p53 terjadi "
            "pada lebih dari 50% kanker manusia dan sangat terkait dengan prognosis buruk. "
            "p53 juga merupakan target mutasi pada kanker terkait paparan karsinogen lingkungan."
        ),
        "regulatory_context": (
            "Aktivasi SR-p53 adalah salah satu indikator genotoksisitas terkuat dalam panel "
            "Tox21. Bahan kimia yang positif di endpoint ini memerlukan evaluasi karsinogenisitas "
            "komprehensif sebelum dapat digunakan di industri atau konsumen. EPA dan IARC "
            "menggunakan data ini sebagai bukti awal karsinogenisitas."
        ),
        "example_disruptors": ["Cisplatin", "Doxorubicin", "Nutlin-3", "Etoposide", "Benzo[a]pyrene diol epoxide"],
        "assay_description": (
            "Tox21 menggunakan sel MCF7 (kanker payudara) atau HCT116 (kanker kolon) yang "
            "mengekspresikan elemen respons p53 terhubung ke luciferase — kerusakan DNA "
            "menstabilkan p53 yang kemudian mengaktifkan ekspresi gen laporan."
        ),
    },
]

# Lookup dict untuk akses cepat berdasarkan nama endpoint
ENDPOINTS_BY_NAME = {ep["name"]: ep for ep in ENDPOINTS_INFO}

ENDPOINT_CATEGORIES = [
    {"slug": "nr", "name": "Nuclear Receptor", "count": 7},
    {"slug": "sr", "name": "Stress Response", "count": 5},
]
