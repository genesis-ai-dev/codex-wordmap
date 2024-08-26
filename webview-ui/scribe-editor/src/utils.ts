import { Usj } from "@biblionexus-foundation/scripture-utilities";
// @ts-expect-error usfm-grammar does not have types
import USFMParser from "sj-usfm-grammar";

export const usfmToUsj = async (usfmInput: string): Promise<{ usj: Usj | null; error: string | null }> => {
    try {
        const usfmParser = new USFMParser();
        await USFMParser.init();
        const usjResult = usfmParser.usfmToUsj(usfmInput);
        return { usj: usjResult, error: null };
    } catch (err) {
        return { usj: null, error: err instanceof Error ? err.message : String(err) };
    }
};

export const usjToUsfm = async (usjInput: Usj): Promise<{ usfm: string | null; error: string | null }> => {
    try {
        const usfmParser = new USFMParser();
        await USFMParser.init();
        const usfmResult = usfmParser.usjToUsfm(usjInput);
        return { usfm: usfmResult, error: null };
    } catch (err) {
        return { usfm: null, error: err instanceof Error ? err.message : String(err) };
    }
};
