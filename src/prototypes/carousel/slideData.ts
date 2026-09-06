/** PROTOTYPE — throwaway. A finished Tasting, as ticket 08 must render it. */
import { STUB_EVENT, type StubPour } from "../taster/stubData";
import { AXES } from "../taster/rating/content";

export interface RenderedImpression {
  readonly pour: StubPour;
  /** Axis id -> the worded answer the Taster tapped (ticket 07 is binary). */
  readonly answers: Readonly<Record<string, string>>;
  readonly descriptors: readonly string[];
  readonly note: string;
}

const answer = (axisId: string, high: boolean) => {
  const axis = AXES.find((a) => a.id === axisId);
  return high ? (axis?.high ?? "") : (axis?.low ?? "");
};

export const TASTER_NAME = "Ana";

export const IMPRESSIONS: readonly RenderedImpression[] = [
  {
    pour: STUB_EVENT.lineup[0]!,
    answers: { gostei: answer("gostei", true), corpo: answer("corpo", false), doce: answer("doce", false), denovo: answer("denovo", true) },
    descriptors: ["cítrico", "floral"],
    note: "Começou a noite muito bem. Leve, borbulha fina, sumiu rápido da taça.",
  },
  {
    pour: STUB_EVENT.lineup[3]!,
    answers: { gostei: answer("gostei", true), corpo: answer("corpo", true), doce: answer("doce", false), denovo: answer("denovo", true) },
    descriptors: ["frutas escuras", "madeira", "especiarias"],
    note: "Esse foi o meu favorito da noite. Encorpado sem pesar.",
  },
  {
    pour: STUB_EVENT.lineup[4]!,
    answers: { gostei: answer("gostei", false), corpo: answer("corpo", true), doce: answer("doce", false), denovo: answer("denovo", false) },
    descriptors: ["terroso"],
    note: "Forte demais para mim, mas dá pra ver que é bem feito.",
  },
  {
    pour: STUB_EVENT.lineup[6]!,
    answers: { gostei: answer("gostei", true), corpo: answer("corpo", true), doce: answer("doce", true), denovo: answer("denovo", true) },
    descriptors: ["mel", "chocolate", "tostado"],
    note: "Sobremesa em forma de vinho. Voltaria só por causa dele.",
  },
];

export const EVENT = STUB_EVENT;
export const AXIS_LIST = AXES;
