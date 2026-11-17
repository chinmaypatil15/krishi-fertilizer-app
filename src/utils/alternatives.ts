import { FERTILIZERS } from '../data/crops';
import {
  AltFertilizerId,
  AlternativeOption,
  AnyFertilizerId,
  CalculatedFertilizerItem,
  CalculatedStage,
  FertilizerId,
  NPKValues,
} from '../types';
import { roundTo } from './calculations';

export interface AltFertilizerDef {
  id: AltFertilizerId;
  name: string;
  hiName: string;
  mrName?: string;
  bagWeightKg: number;
  defaultPricePerBag: number;
  npkPercent: NPKValues;
  isBottle?: boolean;
}

export const ALT_FERTILIZERS: Record<AltFertilizerId, AltFertilizerDef> = {
  ssp: {
    id: 'ssp',
    name: 'SSP (0-16-0 + 11% S)',
    hiName: 'एस.एस.पी. सिंगल सुपर फॉस्फेट (0-16-0)',
    mrName: 'एस.एस.पी. सिंगल सुपर फॉस्फेट (०-१६-०)',
    bagWeightKg: 50,
    defaultPricePerBag: 480,
    npkPercent: { n: 0, p: 16, k: 0 },
  },
  npk_12_32_16: {
    id: 'npk_12_32_16',
    name: 'NPK 12:32:16',
    hiName: 'एन.पी.के. 12:32:16',
    mrName: '१२:३२:१६ संयुक्त खत',
    bagWeightKg: 50,
    defaultPricePerBag: 1470,
    npkPercent: { n: 12, p: 32, k: 16 },
  },
  npk_10_26_26: {
    id: 'npk_10_26_26',
    name: 'NPK 10:26:26',
    hiName: 'एन.पी.के. 10:26:26',
    mrName: '१०:२६:२६ संयुक्त खत',
    bagWeightKg: 50,
    defaultPricePerBag: 1470,
    npkPercent: { n: 10, p: 26, k: 26 },
  },
  npk_20_20_0: {
    id: 'npk_20_20_0',
    name: 'NPK 20:20:0:13 (APS)',
    hiName: 'एन.पी.के. 20:20:0:13 (अमोनियम फॉस्फेट)',
    mrName: '२०:२०:०:१३ (अमोनियम फॉस्फेट सल्फेट)',
    bagWeightKg: 50,
    defaultPricePerBag: 1250,
    npkPercent: { n: 20, p: 20, k: 0 },
  },
  ammonium_sulphate: {
    id: 'ammonium_sulphate',
    name: 'Ammonium Sulphate (20.6% N + 24% S)',
    hiName: 'अमोनियम सल्फेट (20.6% N + 24% S)',
    mrName: 'अमोनियम सल्फेट (२०.६% नत्र + २४% गंधक)',
    bagWeightKg: 50,
    defaultPricePerBag: 950,
    npkPercent: { n: 20.6, p: 0, k: 0 },
  },
  sop: {
    id: 'sop',
    name: 'SOP / Potassium Sulphate (0-0-50)',
    hiName: 'पोटाशियम सल्फेट / एस.ओ.पी. (0-0-50)',
    mrName: 'पोटॅशियम सल्फेट / एस.ओ.पी. (०-०-५०)',
    bagWeightKg: 25,
    defaultPricePerBag: 1800,
    npkPercent: { n: 0, p: 0, k: 50 },
  },
  nano_urea: {
    id: 'nano_urea',
    name: 'Nano Urea Liquid (500 ml bottle)',
    hiName: 'नैनो यूरिया लिक्विड (500 मिली बोतल)',
    mrName: 'नॅनो युरिया लिक्विड (५०० मिली बाटली)',
    bagWeightKg: 1,
    defaultPricePerBag: 225,
    npkPercent: { n: 0, p: 0, k: 0 },
    isBottle: true,
  },
  npk_13_0_45: {
    id: 'npk_13_0_45',
    name: 'NPK 13:0:45 (Potassium Nitrate)',
    hiName: 'एन.पी.के. 13:0:45 (पोटेशियम नाइट्रेट)',
    mrName: '१३:०:४५ पोटॅशियम नायट्रेट',
    bagWeightKg: 1,
    defaultPricePerBag: 175,
    npkPercent: { n: 13, p: 0, k: 45 },
  },
  zn_edta: {
    id: 'zn_edta',
    name: 'Chelated Zinc (Zn-EDTA 12%)',
    hiName: 'चिलेटेड जिंक (Zn-EDTA 12%)',
    mrName: 'चिलेटेड झिंक (Zn-EDTA १२%)',
    bagWeightKg: 0.5,
    defaultPricePerBag: 420,
    npkPercent: { n: 0, p: 0, k: 0 },
  },
  gypsum: {
    id: 'gypsum',
    name: 'Gypsum (Calcium Sulphate 18% S)',
    hiName: 'जिप्सम (18% सल्फर)',
    mrName: 'जिप्सम (१८% गंधक)',
    bagWeightKg: 50,
    defaultPricePerBag: 250,
    npkPercent: { n: 0, p: 0, k: 0 },
  },
  magnesium_sulphate: {
    id: 'magnesium_sulphate',
    name: 'Magnesium Sulphate (9.6% Mg + 12% S)',
    hiName: 'मैग्नीशियम सल्फेट (9.6% Mg + 12% S)',
    mrName: 'मॅग्नेशियम सल्फेट (९.६% Mg + १२% गंधक)',
    bagWeightKg: 25,
    defaultPricePerBag: 650,
    npkPercent: { n: 0, p: 0, k: 0 },
  },
};

function makeItem(
  id: AnyFertilizerId,
  kgAmount: number,
  fertilizerPrices: Record<FertilizerId, number>
): CalculatedFertilizerItem {
  const roundedKg = roundTo(kgAmount, 1);
  if (id in FERTILIZERS) {
    const def = FERTILIZERS[id as FertilizerId];
    const price = fertilizerPrices[id as FertilizerId] ?? def.defaultPricePerBag;
    return {
      fertilizerId: id,
      name: def.name,
      hiName: def.hiName,
      mrName: def.mrName,
      kgAmount: roundedKg,
      bagWeightKg: def.bagWeightKg,
      bags: roundTo(roundedKg / def.bagWeightKg, 2),
      estimatedCost: Math.round((roundedKg / def.bagWeightKg) * price),
      npk: {
        n: roundTo((roundedKg * def.npkPercent.n) / 100, 1),
        p: roundTo((roundedKg * def.npkPercent.p) / 100, 1),
        k: roundTo((roundedKg * def.npkPercent.k) / 100, 1),
      },
    };
  }
  const alt = ALT_FERTILIZERS[id as AltFertilizerId];
  return {
    fertilizerId: id,
    name: alt.name,
    hiName: alt.hiName,
    mrName: alt.mrName,
    kgAmount: roundedKg,
    bagWeightKg: alt.bagWeightKg,
    bags: roundTo(roundedKg / alt.bagWeightKg, 2),
    estimatedCost: Math.round((roundedKg / alt.bagWeightKg) * alt.defaultPricePerBag),
    npk: {
      n: roundTo((roundedKg * alt.npkPercent.n) / 100, 1),
      p: roundTo((roundedKg * alt.npkPercent.p) / 100, 1),
      k: roundTo((roundedKg * alt.npkPercent.k) / 100, 1),
    },
    isBottle: alt.isBottle,
  };
}

function summarizeOption(
  id: string,
  title: string,
  hiTitle: string,
  mrTitle: string,
  subtitle: string,
  hiSubtitle: string,
  mrSubtitle: string,
  items: CalculatedFertilizerItem[],
  note: string,
  hiNote: string,
  mrNote: string
): AlternativeOption {
  const nonZero = items.filter((i) => i.kgAmount >= 0.2);
  const totalCost = nonZero.reduce((sum, i) => sum + i.estimatedCost, 0);
  const totalNpk = nonZero.reduce<NPKValues>(
    (acc, i) => ({
      n: roundTo(acc.n + i.npk.n, 1),
      p: roundTo(acc.p + i.npk.p, 1),
      k: roundTo(acc.k + i.npk.k, 1),
    }),
    { n: 0, p: 0, k: 0 }
  );
  return {
    id,
    title,
    hiTitle,
    mrTitle,
    subtitle,
    hiSubtitle,
    mrSubtitle,
    items: nonZero,
    totalCost,
    totalNpk,
    note,
    hiNote,
    mrNote,
  };
}

function appendMicronutrientReplacements(
  items: CalculatedFertilizerItem[],
  stage: CalculatedStage,
  unavailable: Set<FertilizerId>,
  fertilizerPrices: Record<FertilizerId, number>,
  alreadyHasSulphurSource: boolean
): void {
  const znOrig = stage.items.find((i) => i.fertilizerId === 'zinc_sulphate');
  if (znOrig) {
    if (unavailable.has('zinc_sulphate')) {
      items.push(makeItem('zn_edta', Math.max(0.5, znOrig.kgAmount * 0.2), fertilizerPrices));
    } else {
      items.push(znOrig);
    }
  }

  const sOrig = stage.items.find((i) => i.fertilizerId === 'sulphur');
  if (sOrig) {
    if (unavailable.has('sulphur')) {
      if (!alreadyHasSulphurSource) {
        items.push(makeItem('gypsum', sOrig.kgAmount * 5, fertilizerPrices));
      }
    } else {
      items.push(sOrig);
    }
  }
}

export function generateStageAlternatives(
  stage: CalculatedStage,
  unavailableIds: FertilizerId[],
  fertilizerPrices: Record<FertilizerId, number>
): AlternativeOption[] {
  const unavailable = new Set<FertilizerId>(unavailableIds);
  if (unavailable.size === 0) return [];

  const options: AlternativeOption[] = [];

  const targetN = stage.totalNpk.n;
  const targetP = stage.totalNpk.p;
  const targetK = stage.totalNpk.k;

  const hasUrea = stage.items.some((i) => i.fertilizerId === 'urea');
  const hasDap = stage.items.some((i) => i.fertilizerId === 'dap');
  const hasMop = stage.items.some((i) => i.fertilizerId === 'mop');
  const hasFoliar05234 = stage.items.some((i) => i.fertilizerId === 'npk_0_52_34');
  const hasFoliar191919 = stage.items.some((i) => i.fertilizerId === 'npk_19_19_19');
  const hasFoliar0050 = stage.items.some((i) => i.fertilizerId === 'npk_0_0_50');

  const isPureFoliarStage =
    (hasFoliar05234 || hasFoliar191919 || hasFoliar0050) && !hasDap && !hasMop;

  // Helper to fulfill remaining N using Urea (if available) or Ammonium Sulphate
  const addNitrogenSource = (
    neededN: number,
    out: CalculatedFertilizerItem[]
  ): boolean => {
    if (neededN <= 0.5) return false;
    if (!unavailable.has('urea')) {
      out.push(makeItem('urea', neededN / 0.46, fertilizerPrices));
      return false;
    }
    out.push(makeItem('ammonium_sulphate', neededN / 0.206, fertilizerPrices));
    return true; // supplies sulphur
  };

  // Helper to fulfill remaining K using MOP (if available) or SOP
  const addPotashSource = (
    neededK: number,
    out: CalculatedFertilizerItem[]
  ): void => {
    if (neededK <= 0.5) return;
    if (!unavailable.has('mop')) {
      out.push(makeItem('mop', neededK / 0.6, fertilizerPrices));
    } else {
      out.push(makeItem('sop', neededK / 0.5, fertilizerPrices));
    }
  };

  // ---------------------------------------------------------------------------
  // OPTION 1: Straight / Single-Nutrient Swap (SSP + Urea/AS + SOP)
  // ---------------------------------------------------------------------------
  if (!isPureFoliarStage) {
    const items: CalculatedFertilizerItem[] = [];
    let suppliedN = 0;
    let suppliedP = 0;
    let suppliedK = 0;
    let suppliesSulphur = false;

    // Keep DAP if available and needed
    const origDap = stage.items.find((i) => i.fertilizerId === 'dap');
    if (origDap && !unavailable.has('dap')) {
      items.push(origDap);
      suppliedN += origDap.npk.n;
      suppliedP += origDap.npk.p;
    } else if (targetP - suppliedP > 0.5) {
      const sspKg = (targetP - suppliedP) / 0.16;
      const sspItem = makeItem('ssp', sspKg, fertilizerPrices);
      items.push(sspItem);
      suppliedP += sspItem.npk.p;
      suppliesSulphur = true;
    }

    // Keep MOP if available, else SOP
    if (targetK - suppliedK > 0.5) {
      addPotashSource(targetK - suppliedK, items);
    }

    // Fulfill remaining N
    if (targetN - suppliedN > 0.5) {
      if (addNitrogenSource(targetN - suppliedN, items)) {
        suppliesSulphur = true;
      }
    }

    // Foliar items if mixed stage (e.g. Cotton boll stage)
    const orig19 = stage.items.find((i) => i.fertilizerId === 'npk_19_19_19');
    if (orig19) {
      if (!unavailable.has('npk_19_19_19')) {
        items.push(orig19);
      } else {
        items.push(makeItem('npk_13_0_45', orig19.kgAmount, fertilizerPrices));
      }
    }

    appendMicronutrientReplacements(
      items,
      stage,
      unavailable,
      fertilizerPrices,
      suppliesSulphur
    );

    options.push(
      summarizeOption(
        'straight_swap',
        'Single-Nutrient Swap (SSP / AS / SOP)',
        'सिंगल खाद विकल्प (SSP / अमोनियम सल्फेट / SOP)',
        'एकल खत पर्याय (SSP / अमोनियम सल्फेट / SOP)',
        'Matches full N-P-K using widely available straight fertilizers',
        'उपलब्ध एकल खादों से पूरा N-P-K संतुलन बनाए रखता है',
        'उपलब्ध सरळ खतांतून पूर्ण N-P-K गरज भरून काढते',
        items,
        suppliesSulphur
          ? 'SSP and Ammonium Sulphate also provide bonus Sulphur. Apply immediately after mixing; never mix Zinc Sulphate directly with SSP/DAP.'
          : 'Matches the exact N-P-K requirement for this growth stage.',
        suppliesSulphur
          ? 'SSP और अमोनियम सल्फेट से अतिरिक्त सल्फर भी मिलता है। मिलाकर तुरंत खेत में डालें; जिंक को SSP/DAP के साथ न मिलाएँ।'
          : 'इस अवस्था की पूरी N-P-K आवश्यकता को पूरा करता है।',
        suppliesSulphur
          ? 'SSP आणि अमोनियम सल्फेटमधून अतिरिक्त गंधक (सल्फर) सुद्धा मिळते. मिसळून लगेच वापर करा; झिंक थेट SSP/DAP मध्ये मिसळू नये.'
          : 'या अवस्थेची अचूक N-P-K गरज पूर्ण करते.'
      )
    );
  }

  // ---------------------------------------------------------------------------
  // OPTION 2: Complex NPK Blends (10:26:26, 12:32:16, 20:20:0) when P > 0
  // ---------------------------------------------------------------------------
  if (!isPureFoliarStage && targetP > 0.5 && (unavailable.has('dap') || unavailable.has('mop'))) {
    const buildComplexBlend = (
      complexId: 'npk_10_26_26' | 'npk_12_32_16' | 'npk_20_20_0'
    ): AlternativeOption => {
      const items: CalculatedFertilizerItem[] = [];
      const def = ALT_FERTILIZERS[complexId];
      let suppliesSulphur = complexId === 'npk_20_20_0';

      const pPct = def.npkPercent.p / 100;
      const complexKg = roundTo(targetP / pPct, 1);
      const complexItem = makeItem(complexId, complexKg, fertilizerPrices);
      items.push(complexItem);

      const remN = Math.max(0, targetN - complexItem.npk.n);
      const remK = Math.max(0, targetK - complexItem.npk.k);

      addPotashSource(remK, items);
      if (addNitrogenSource(remN, items)) {
        suppliesSulphur = true;
      }

      const orig19 = stage.items.find((i) => i.fertilizerId === 'npk_19_19_19');
      if (orig19) {
        if (!unavailable.has('npk_19_19_19')) {
          items.push(orig19);
        } else {
          items.push(makeItem('npk_13_0_45', orig19.kgAmount, fertilizerPrices));
        }
      }

      appendMicronutrientReplacements(
        items,
        stage,
        unavailable,
        fertilizerPrices,
        suppliesSulphur
      );

      if (complexId === 'npk_10_26_26') {
        return summarizeOption(
          'complex_npk_10_26_26',
          'NPK 10:26:26 (Best Alternative for DAP 18:46:0)',
          'एन.पी.के. 10:26:26 (डी.ए.पी. 18-46-0 का सर्वोत्तम विकल्प)',
          '१०:२६:२६ खत (DAP १८:४६:० चा सर्वोत्तम पर्याय)',
          'All-in-one P & K in every granule — ideal for chickpea & pulses',
          'एक ही दाने में संतुलित P और K — चने व दलहन के लिए सर्वोत्तम',
          'प्रत्येक दाण्यात संतुलित स्फुरद व पोटॅश — हरभरा व कडधान्यांसाठी अत्यंत फायदेशीर',
          items,
          'NPK 10:26:26 is the top recommended substitute for DAP (18:46:0) in chickpea. It delivers 26% Phosphorus and 26% Potash together, eliminating the need for separate MOP bags while keeping Nitrogen at a safe 10% level for active root nodulation.',
          'डी.ए.पी. (18:46:0) न मिलने पर चने के लिए एन.पी.के. 10:26:26 सबसे उत्तम विकल्प है। यह हर दाने में 26% फॉस्फोरस और 26% पोटाश प्रदान करता है, जिससे अलग से पोटाश खरीदने की जरूरत नहीं पड़ती और 10% संतुलित नाइट्रोजन से जड़ गांठों का विकास तेजी से होता है।',
          'हरभरा पिकासाठी डी.ए.पी. (१८:४६:०) उपलब्ध नसल्यास १०:२६:२६ (NPK 10:26:26) हा सर्वोत्तम पर्याय आहे. प्रत्येक दाण्यातून २६% स्फुरद व २६% पोटॅश मिळतो, ज्यामुळे वेगळा पोटॅश (MOP) घेण्याची गरज उरत नाही आणि १०% नत्रामुळे मुळांवरील रायझोबियम गाठी जोमाने वाढतात.'
        );
      } else if (complexId === 'npk_12_32_16') {
        return summarizeOption(
          'complex_npk_12_32_16',
          'Complex NPK 12:32:16 Blend',
          'मिक्स एन.पी.के. 12:32:16 विकल्प',
          'संयुक्त खत १२:३२:१६ पर्याय',
          'High phosphorus complex (32% P) with starter K & N',
          'अधिक फॉस्फोरस (32% P) युक्त दानेदार संयुक्त खाद',
          'जास्त स्फुरद (३२% P) असणारे दाणेदार संयुक्त खत',
          items,
          'NPK 12:32:16 supplies 32% Phosphorus and 16% Potash, reducing extra Potash bags required.',
          '12:32:16 से 32% फॉस्फोरस और 16% पोटाश मिलता है, जिससे अलग से पोटाश की मात्रा कम लगती है।',
          '१२:३२:१६ मधून ३२% स्फुरद व १६% पोटॅश मिळतो, ज्यामुळे अतिरिक्त पोटॅशची गरज कमी होते.'
        );
      } else {
        return summarizeOption(
          'complex_npk_20_20_0',
          'NPK 20:20:0:13 (APS + Sulphur)',
          'एन.पी.के. 20:20:0:13 (अमोनियम फॉस्फेट सल्फेट)',
          '२०:२०:०:१३ (अमोनियम फॉस्फेट सल्फेट)',
          'Ammonium Phosphate Sulphate with 13% bonus Sulphur',
          'अमोनियम फॉस्फेट सल्फेट के साथ 13% अतिरिक्त सल्फर',
          '१३% गंधक (सल्फर) असलेले अमोनियम फॉस्फेट सल्फेट',
          items,
          'NPK 20:20:0:13 supplies balanced Nitrogen, Phosphorus and 13% soluble Sulphur.',
          '20:20:0:13 से नाइट्रोजन, फॉस्फोरस और 13% घुलनशील सल्फर मिलता है।',
          '२०:२०:०:१३ मधून नत्र, स्फुरद आणि १३% विद्राव्य गंधक मिळते.'
        );
      }
    };

    // Always offer 10:26:26 as the premier DAP alternative
    options.push(buildComplexBlend('npk_10_26_26'));

    // If potash is needed, also offer 12:32:16; otherwise 20:20:0:13
    if (targetK > 0) {
      options.push(buildComplexBlend('npk_12_32_16'));
    } else {
      options.push(buildComplexBlend('npk_20_20_0'));
    }
  }

  // ---------------------------------------------------------------------------
  // OPTION 3: Nano Urea Liquid Foliar Option (when Urea is unavailable)
  // ---------------------------------------------------------------------------
  if (hasUrea && unavailable.has('urea')) {
    const origUrea = stage.items.find((i) => i.fertilizerId === 'urea')!;
    const items: CalculatedFertilizerItem[] = [];
    let suppliesSulphur = false;

    // Bottle count: ~1 bottle (500 ml) per 45 kg Urea bag, rounded to 0.5 bottle
    const bottles = Math.max(0.5, roundTo((origUrea.kgAmount / 45) * 2, 0) / 2);
    items.push(makeItem('nano_urea', bottles, fertilizerPrices));

    // Handle P if DAP is also missing
    const origDap = stage.items.find((i) => i.fertilizerId === 'dap');
    if (origDap) {
      if (!unavailable.has('dap')) {
        items.push(origDap);
      } else {
        const sspItem = makeItem('ssp', origDap.npk.p / 0.16, fertilizerPrices);
        items.push(sspItem);
        suppliesSulphur = true;
      }
    }

    // Handle K
    const origMop = stage.items.find((i) => i.fertilizerId === 'mop');
    if (origMop) {
      if (!unavailable.has('mop')) {
        items.push(origMop);
      } else {
        items.push(makeItem('sop', origMop.npk.k / 0.5, fertilizerPrices));
      }
    }

    appendMicronutrientReplacements(
      items,
      stage,
      unavailable,
      fertilizerPrices,
      suppliesSulphur
    );

    options.push(
      summarizeOption(
        'nano_urea_swap',
        'Nano Urea Liquid Foliar Spray',
        'नैनो यूरिया लिक्विड छिड़काव विकल्प',
        'नॅनो युरिया लिक्विड फवारणी पर्याय',
        'Lightweight bottle option when granular Urea bags are out of stock',
        'दानेदार यूरिया न मिलने पर बोतल से पत्तियों पर छिड़काव',
        'दाणेदार युरिया उपलब्ध नसताना पानांवरून फवारणीचा पर्याय',
        items,
        'Mix 2–4 ml Nano Urea per liter of water and spray evenly on leaves in morning or evening (25–30 days after sowing onwards).',
        '2–4 मिली नैनो यूरिया प्रति लीटर पानी में मिलाकर सुबह या शाम पत्तियों पर छिड़काव करें।',
        'प्रति लिटर पाण्यात २–४ मिली नॅनो युरिया मिसळून सकाळी किंवा संध्याकाळी पानांवर समप्रमाणात फवारावे.'
      )
    );
  }

  // ---------------------------------------------------------------------------
  // OPTION 4: Foliar Stage Swap (0:52:34, 19:19:19, 0:0:50 missing, OR top-dress Potash)
  // ---------------------------------------------------------------------------
  if (
    (hasFoliar05234 && unavailable.has('npk_0_52_34')) ||
    (hasFoliar191919 && unavailable.has('npk_19_19_19')) ||
    (hasFoliar0050 && unavailable.has('npk_0_0_50')) ||
    (!isPureFoliarStage && targetP === 0 && targetK > 0 && unavailable.has('mop'))
  ) {
    const items: CalculatedFertilizerItem[] = [];

    if (hasFoliar05234 && unavailable.has('npk_0_52_34')) {
      const orig = stage.items.find((i) => i.fertilizerId === 'npk_0_52_34')!;
      // Replace 0:52:34 with NPK 0:0:50 + filtered DAP foliar
      items.push(makeItem('npk_0_0_50', roundTo(orig.kgAmount * 0.7, 1), fertilizerPrices));
      items.push(makeItem('dap', roundTo(orig.kgAmount * 1.1, 1), fertilizerPrices));
    } else if (hasFoliar191919 && unavailable.has('npk_19_19_19')) {
      const orig = stage.items.find((i) => i.fertilizerId === 'npk_19_19_19')!;
      items.push(makeItem('npk_13_0_45', roundTo(orig.kgAmount * 0.6, 1), fertilizerPrices));
      items.push(makeItem('urea', roundTo(orig.kgAmount * 0.3, 1), fertilizerPrices));
    } else if (hasFoliar0050 && unavailable.has('npk_0_0_50')) {
      const orig = stage.items.find((i) => i.fertilizerId === 'npk_0_0_50')!;
      items.push(makeItem('npk_13_0_45', roundTo(orig.kgAmount * 1.1, 1), fertilizerPrices));
    } else {
      // Top-dress stage where MOP is missing and P=0: offer Potassium Nitrate 13:0:45 + adjusted Urea
      const kItem = makeItem('npk_13_0_45', targetK / 0.45, fertilizerPrices);
      items.push(kItem);
      const remN = Math.max(0, targetN - kItem.npk.n);
      addNitrogenSource(remN, items);
    }

    options.push(
      summarizeOption(
        'foliar_potash_swap',
        'Water-Soluble / Potassium Nitrate Alternative',
        'घुलनशील खाद / पोटेशियम नाइट्रेट विकल्प',
        'विद्राव्य खत / पोटॅशियम नायट्रेट पर्याय',
        'Fast-acting foliar or fertigation replacement for flowering & fruit stages',
        'फूल और दाने/फल भरने की अवस्था के लिए तेज असरदार विकल्प',
        'फुलोरा व दाणे/फळे भरण्याच्या अवस्थेसाठी जलद परिणामकारक पर्याय',
        items,
        'If using DAP for foliar spray, soak DAP in water overnight, strain the clear solution, and spray in evening hours.',
        'यदि छिड़काव के लिए डी.ए.पी. उपयोग करें तो रातभर पानी में भिगोकर ऊपर का साफ पानी छानकर शाम को छिड़कें।',
        'फवारणीसाठी डी.ए.पी. वापरल्यास रात्रभर पाण्यात भिजवून वरचे स्वच्छ पाणी गाळून संध्याकाळी फवारावे.'
      )
    );
  }

  return options;
}
