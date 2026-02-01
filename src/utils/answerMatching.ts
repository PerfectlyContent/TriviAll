export const isFuzzyMatch = (input: string, target: string, acceptableAnswers: string[] = []): boolean => {
    const normalize = (str: string) =>
        str.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s+/g, " ");

    const normalizedInput = normalize(input);
    const normalizedTarget = normalize(target);

    if (normalizedInput === normalizedTarget) return true;

    // Check acceptable variations
    if (acceptableAnswers.some(ans => normalize(ans) === normalizedInput)) return true;

    // Basic Levenshtein distance or simple word overlap could go here
    // For now, partial overlap if target is short
    if (normalizedTarget.length > 3 && normalizedInput.includes(normalizedTarget)) return true;

    return false;
};
