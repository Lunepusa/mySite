export const sortDates = (groups) => {
    return Object.keys(groups).sort((a, b) => b.localeCompare(a));
};
