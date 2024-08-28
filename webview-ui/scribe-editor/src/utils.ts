import { Usj } from "@biblionexus-foundation/scripture-utilities";
// @ts-expect-error usfm-grammar does not have types
import USFMParser from "sj-usfm-grammar";

export const usfmToUsj = async (usfmInput: string): Promise<{ usj: Usj | null; error: string | null }> => {
    try {
        await USFMParser.init();
        const usfmParser = new USFMParser();
        const usjResult = usfmParser.usfmToUsj(usfmInput);
        console.log("usjResult", usjResult);
        return { usj: usjResult, error: null };
    } catch (err) {
        return { usj: null, error: err instanceof Error ? err.message : String(err) };
    }
};

export const usjToUsfm = async (usjInput: Usj): Promise<{ usfm: string | null; error: string | null }> => {
    try {
        await USFMParser.init();
        const usfmParser = new USFMParser();
        const usfmResult = usfmParser.usjToUsfm(usjInput);
        return { usfm: usfmResult, error: null };
    } catch (err) {
        return { usfm: null, error: err instanceof Error ? err.message : String(err) };
    }
};

// export const perfToUsj = async (perfInput): Promise<{ usj: Usj | null; error: string | null }> => {
//     // TODO: implement
//     console.log("perfInput", perfInput);
//     return { usj: null, error: "Not implemented" };
// };

// export const usjToPerf = async (usjInput: Usj): Promise<{ perf | null; error: string | null }> => {
//     // TODO: implement
//     console.log("usjInput", usjInput);
//     return { perf: null, error: "Not implemented" };
// };