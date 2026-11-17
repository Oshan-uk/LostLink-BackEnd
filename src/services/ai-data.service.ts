import Item from "../models/Item.js";

type ItemType = "lost" | "found";

interface ItemSearchFilters {
  search?: string;
  type?: ItemType;
  category?: string;
  province?: string;
  district?: string;
  city?: string;
  specificPlace?: string;
}

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Get active lost and found item statistics
export const getActiveItemStatistics = async () => {
  const [lostItems, foundItems] = await Promise.all([
    Item.countDocuments({
      type: "lost",
      status: "active",
    }),

    Item.countDocuments({
      type: "found",
      status: "active",
    }),
  ]);

  return {
    lostItems,
    foundItems,
    totalItems: lostItems + foundItems,
  };
};

const searchSynonyms: Record<string, string[]> = {
  phone: ["mobile", "cellphone", "smartphone"],
  mobile: ["phone", "cellphone", "smartphone"],
  cellphone: ["phone", "mobile", "smartphone"],
  wallet: ["purse"],
  purse: ["wallet"],
  backpack: ["bag", "schoolbag"],
  laptop: ["notebook"],
  glasses: ["spectacles", "eyeglasses"],
  spectacles: ["glasses", "eyeglasses"],
  keys: ["key"],
};

const getSearchTerms = (search: string): string[] => {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);

  const terms = new Set<string>();

  for (const word of words) {
    terms.add(word);

    for (const synonym of searchSynonyms[word] ?? []) {
      terms.add(synonym);
    }
  }

  return [...terms];
};

// Search actual items from MongoDB
export const searchLostLinkItems = async (
  filters: ItemSearchFilters,
  limit = 10,
) => {
  const query = Item.find({
    status: "active",
  }).getFilter();

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.category) {
    query.category = new RegExp(escapeRegex(filters.category), "i");
  }

  if (filters.province) {
    query.province = new RegExp(`^${escapeRegex(filters.province)}$`, "i");
  }

  if (filters.district) {
    query.district = new RegExp(`^${escapeRegex(filters.district)}$`, "i");
  }

  if (filters.city) {
    query.city = new RegExp(`^${escapeRegex(filters.city)}$`, "i");
  }

  if (filters.specificPlace) {
    query.specificPlace = new RegExp(escapeRegex(filters.specificPlace), "i");
  }

  if (filters.search) {
    const searchTerms = getSearchTerms(filters.search);

    query.$and = [
      ...(query.$and ?? []),

      ...searchTerms.map((term) => {
        const searchRegex = new RegExp(escapeRegex(term), "i");

        return {
          $or: [
            { name: searchRegex },
            { description: searchRegex },
            { category: searchRegex },
          ],
        };
      }),
    ];
  }

  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 10);

  const items = await Item.find(query)
    .select(
      "name category description type province district city specificPlace date imageUrl status createdAt",
    )
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean();

  return items;
};
