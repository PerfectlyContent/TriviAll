export interface Subject {
    name: string;
    icon: string;
    color: string;
    subTopics: string[];
}

export const SUBJECTS: Subject[] = [
    {
        name: "History",
        icon: "📜",
        color: "#f59e0b",
        subTopics: ["Ancient Rome", "World War II", "Medieval Europe", "Ancient Egypt", "American History", "Cold War", "Renaissance"],
    },
    {
        name: "Science",
        icon: "🔬",
        color: "#0ea5e9",
        subTopics: ["Physics", "Biology", "Chemistry", "Space & Astronomy", "Marine Biology", "Quantum Mechanics"],
    },
    {
        name: "Movies",
        icon: "🎬",
        color: "#ef4444",
        subTopics: ["Classic Cinema", "Marvel & DC", "Horror Films", "Animated Films", "Oscar Winners", "Sci-Fi"],
    },
    {
        name: "Music",
        icon: "🎵",
        color: "#8b5cf6",
        subTopics: ["Rock & Metal", "Hip-Hop", "Classical Music", "Pop", "Jazz & Blues", "K-Pop"],
    },
    {
        name: "Gaming",
        icon: "🎮",
        color: "#ec4899",
        subTopics: ["Nintendo", "PlayStation", "PC Gaming", "Retro Games", "Esports", "Indie Games"],
    },
    {
        name: "Art",
        icon: "🎨",
        color: "#f43f5e",
        subTopics: ["Renaissance Art", "Modern Art", "Photography", "Sculpture", "Architecture"],
    },
    {
        name: "Tech",
        icon: "💻",
        color: "#06b6d4",
        subTopics: ["AI & Machine Learning", "Smartphones", "Programming", "Internet History", "Cybersecurity"],
    },
    {
        name: "Nature",
        icon: "🌿",
        color: "#10b981",
        subTopics: ["Rainforests", "Oceans", "Volcanoes & Geology", "Weather", "Endangered Species"],
    },
    {
        name: "Sports",
        icon: "⚽",
        color: "#f97316",
        subTopics: ["Football/Soccer", "Basketball", "Olympics", "Tennis", "Formula 1", "Cricket"],
    },
    {
        name: "Food",
        icon: "🍳",
        color: "#eab308",
        subTopics: ["Italian Cuisine", "Asian Food", "Baking", "Food Science", "World Street Food"],
    },
    {
        name: "Travel",
        icon: "✈️",
        color: "#3b82f6",
        subTopics: ["European Cities", "World Wonders", "National Parks", "Islands", "Ancient Ruins"],
    },
    {
        name: "Animals",
        icon: "🐾",
        color: "#84cc16",
        subTopics: ["Mammals", "Marine Life", "Birds", "Reptiles", "Insects", "Dinosaurs"],
    },
    {
        name: "General Knowledge",
        icon: "🧠",
        color: "#7c3aed",
        subTopics: [],
    },
];

export const DEFAULT_SUBJECT = "General Knowledge";

// Custom subject helpers
export const CUSTOM_SUBJECT_ICON = "✏️";
export const CUSTOM_SUBJECT_COLOR = "#7c3aed";

export function isPredefinedSubject(name: string): boolean {
    return SUBJECTS.some(s => s.name.toLowerCase() === name.toLowerCase());
}

export function getSubjectMeta(name: string): { icon: string; color: string } {
    const found = SUBJECTS.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (found) return { icon: found.icon, color: found.color };
    return { icon: CUSTOM_SUBJECT_ICON, color: CUSTOM_SUBJECT_COLOR };
}

// Blocked words / phrases for custom subject validation
const BLOCKED_PATTERNS = [
    // Profanity & slurs (common patterns)
    /\b(fuck|shit|ass|damn|bitch|bastard|crap|dick|cock|pussy|slut|whore|nigger|faggot|retard)\b/i,
    // Sexual content
    /\b(porn|hentai|xxx|sex\s*position|erotic|fetish|nude|naked)\b/i,
    // Violence / harmful
    /\b(how\s+to\s+kill|murder\s+method|torture|bomb\s+making|suicide\s+method|self[- ]?harm)\b/i,
    // Drugs (manufacturing)
    /\b(how\s+to\s+make\s+(meth|crack|cocaine|heroin|drugs))\b/i,
    // Hate / extremism
    /\b(white\s+supremac|nazi\s+ideology|ethnic\s+cleansing|genocide\s+how)\b/i,
];

export function validateCustomSubject(raw: string): { valid: boolean; sanitized: string; error?: string } {
    const trimmed = raw.trim();

    if (!trimmed || trimmed.length < 2) {
        return { valid: false, sanitized: "", error: "Too short — enter at least 2 characters" };
    }
    if (trimmed.length > 40) {
        return { valid: false, sanitized: "", error: "Too long — max 40 characters" };
    }

    // Strip potential prompt injection characters
    const sanitized = trimmed.replace(/[{}\[\]<>]/g, "").trim();
    if (!sanitized) {
        return { valid: false, sanitized: "", error: "Invalid characters" };
    }

    // Check blocked patterns
    for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.test(sanitized)) {
            return { valid: false, sanitized: "", error: "That topic isn't appropriate for the game" };
        }
    }

    return { valid: true, sanitized };
}
