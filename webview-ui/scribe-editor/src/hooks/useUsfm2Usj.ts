import { Usj } from "@biblionexus-foundation/scripture-utilities";
import { useState, useCallback } from "react";
// @ts-expect-error - no types available
import USFMParser from "usfm-grammar";

export const useUsfm2Usj = () => {
    const [usfm, setUsfm] = useState<string>("");
    const [usj, setUsj] = useState<Usj | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const parseUSFM = useCallback(async (usfmInput: string) => {
        setIsLoading(true);
        setError(null);
        try {
            await USFMParser.init();
            const usfmParser = new USFMParser();
            const usjResult = usfmParser.usfmToUsj(usfmInput);
            setUsj(usjResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const convertUsfmToUsj = useCallback((usfmInput: string) => {
        setUsfm(usfmInput);
        parseUSFM(usfmInput);
    }, [parseUSFM]);

    return { usfm, setUsfm, usj, setUsj, convertUsfmToUsj, isLoading, error };
};