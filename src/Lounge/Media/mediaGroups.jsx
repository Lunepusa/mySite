import { getTagsArray } from "./getTagsArray";

export const mediaGroups = (media) => {
    const groupsObj = {};

    media.forEach(item => {
        const date = item.date || "Unknown";
        if (!groupsObj[date]) {
            groupsObj[date] = { items: [], commonTags: [] };
        }
        groupsObj[date].items.push(item);
    });

    Object.keys(groupsObj).forEach(date => {
        const items = groupsObj[date].items;
        if (items.length === 0) return;

        let common = new Set(getTagsArray(items[0].tags));
        for (let i = 1; i < items.length; i++) {
            const itemTags = new Set(getTagsArray(items[i].tags));
            common = new Set([...common].filter(tag => itemTags.has(tag)));
        }
        groupsObj[date].commonTags = [...common];
    });

    return groupsObj;
};