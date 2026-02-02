export const isFuzzyMatch = (input: string, target: string, acceptableAnswers: string[] = []): boolean => {
    const normalize = (str: string) =>
        str.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s+/g, " ");

    const normalizedInput = normalize(input);
    const normalizedTarget = normalize(target);

    if (normalizedInput === normalizedTarget) return true;

    // Check acceptable variations
    if (acceptableAnswers.some(ans => normalize(ans) === normalizedInput)) return true;

    // Numeric proximity for estimation questions (within 10%)
    const inputNum = parseFloat(normalizedInput.replace(/[^0-9.\-]/g, ""));
    const targetNum = parseFloat(normalizedTarget.replace(/[^0-9.\-]/g, ""));
    if (!isNaN(inputNum) && !isNaN(targetNum) && targetNum !== 0) {
        const percentDiff = Math.abs(inputNum - targetNum) / Math.abs(targetNum);
        if (percentDiff <= 0.1) return true; // Within 10%
    }
    // Exact numeric match (handles "0" case)
    if (!isNaN(inputNum) && !isNaN(targetNum) && inputNum === targetNum) return true;

    // Partial overlap if target is short
    if (normalizedTarget.length > 3 && normalizedInput.includes(normalizedTarget)) return true;
    if (normalizedInput.length > 3 && normalizedTarget.includes(normalizedInput)) return true;

    return false;
};
