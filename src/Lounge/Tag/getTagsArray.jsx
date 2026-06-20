export const getTagsArray = tagInput => {
    if (!tagInput) return [];
    if (Array.isArray(tagInput)) return tagInput;
    if (typeof tagInput === "string") {
        return tagInput
            .split(",")
            .map(t => t.trim())
            .filter(t => t.length > 0);
    }
    return [];
};