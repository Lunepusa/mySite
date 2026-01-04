// ./Tags.jsx

import React, { useState, useEffect } from "react";

// Canonical tags (preferred terms)
export const CANONICAL_TAGS = [
  // Body Parts
  "full_body",
  "pussy",
  "booty",
  "asshole",
  "tits",
  "cleavage",
  "tongue",
  "feet",
  "hips",
  "belly",
  "painted_nails",
  "lipstick",
  "bush",
  "trimmed",
  "shaved",
  "face",
  "eyes",
  "arms",
  "legs",
  "hands",
  "back",
  "thighs",
  "neck",
  "shoulders",

  // Clothing
  "lingerie",
  "maid",
  "hucow",
  "babydoll",
  "2_piece_set",
  "nylons",
  "thigh_highs",
  "fishnets",
  "heels",
  "gloves",
  "robe",
  "office",
  "sundress",
  "mini_skirt",
  "body_jewelry",
  "nude",
  "corset",
  "garter",
  "bodysuit",
  "swimsuit",
  "latex",
  "leather",
  "uniform",
  "cosplay_outfit",

  // Toys
  "toys",
  "dildo",
  "vibrator",
  "realistic_dildo",
  "squirting_dildo",
  "lovense",
  "nipple_clamps",
  "suction_toy",
  "bullet_vibrator",
  "egg_vibrator",
  "butt_ plug",
  "anal_beads",
  "cock_ring",
  "fleshlight",
  "strap-on",
  "sybian",
  "hitachi wand",
  "prostate massager",

  // Positions
  "riding",
  "doggy_style",
  "missionary",
  "mating_press",
  "standing",
  "kneeling",
  "seated_lean",
  "double_penetration_ass_and_pussy",
  "double_penetration_2_in_one",
  "spitroast",
  "69",
  "from_below",
  "close_up",

  // Actions
  "vaginal_penetration",
  "anal_penetration",
  "masturbation",
  "tit_job",
  "shimmy",
  "twerk",
  "dance",
  "blowjob",
  "orgasm",
  "ramble",
  "pole_dance",
  "bondage",
  "rope",
  "cuffs",
  "chains",
  "gag",
  "blindfold",
  "piss",
  "piss_drinking",
  "dirty_talk",
  "spanking",
  "fingering",
  "handjob",
  "footjob",
  "rimming",
  "creampie",
  "cumshot",
  "squirting",
  "edging",
  "tease",
  "striptease",
  "humiliation",
  "degradation",
  "cuckold",
  "bdsm",
  "femdom",
  "maledom",
  "switch",

  // Taboo
  "taboo",
  "scat",
  "fart",
  "cnc",
  "dubcon",
  "race_play",
  "bnwo",
  "age_play",
  "blackmail_fetish",
  "blood",
  "breathplay",
  "hypno",
  "somno",
  "monster_dildo",
  "knotted_dildo",
  "tentacle",
  "werewolf",

  // Participants
  "lunepusa_f",
  "katya_luv_tf",
  "lilytheelf_tf",
  "solo",
  "threesome",
  "duo",
  "group",
  "orgy",
  "gangbang",
  "lesbian",
  "gay",
  "straight",
  "bisexual",
  "trans",
  "cis",

  // Roleplay
  "roleplay",
  "mommy",
  "nurse",
  "nun",
  "slave",
  "pet",
  "master",
  "cosplay",
  "teacher",
  "student",
  "police",
  "prisoner",
  "vampire",
  "succubus",

  //other
  "delete",
  "picture",
  "video",
];

// Synonym mapping: synonym → canonical tag
const SYNONYM_MAP = {
  // Body Parts
  "whole body": "full_body",
  "entire body": "full_body",
  vagina: "pussy",
  cunt: "pussy",
  vulva: "pussy",
  labia: "pussy",
  clit: "pussy",
  ass: "booty",
  butt: "booty",
  rear: "booty",
  bottom: "booty",
  cheeks: "booty",
  anus: "asshole",
  anal: "asshole",
  butthole: "asshole",
  breasts: "tits",
  boobs: "tits",
  chest: "tits",
  titties: "tits",
  bosom: "cleavage",
  "cleavage line": "cleavage",
  mouth: "tongue",
  oral: "tongue",
  "tongue out": "tongue",
  soles: "feet",
  toes: "feet",
  foot: "feet",
  pelvis: "hips",
  waist: "hips",
  thighs: "hips",
  stomach: "belly",
  abdomen: "belly",
  navel: "belly",
  manicure: "painted_nails",
  "nail polish": "painted_nails",
  fingernails: "painted_nails",
  pedicure: "painted_nails",
  "lip makeup": "lipstick",
  lips: "lipstick",
  "red lip": "lipstick",
  "unshaved pussy": "bush",

  // Clothing
  undergarments: "lingerie",
  intimates: "lingerie",
  "maid outfit": "maid",
  "french maid": "maid",
  "servant uniform": "maid",
  "cow print": "hucow",
  "cow bikini": "hucow",
  "cow costume": "hucow",
  nightgown: "babydoll",
  "sheer dress": "babydoll",
  "baby doll dress": "babydoll",
  bikini: "2_piece_set",
  "two piece": "2_piece_set",
  "bra and panties": "2_piece_set",
  pantyhose: "nylons",
  stockings: "nylons",
  hosiery: "nylons",
  "thigh high stockings": "thigh_highs",
  "knee highs": "thigh_highs",
  overknee: "thigh_highs",
  "fishnet stockings": "fishnets",
  "net stockings": "fishnets",
  mesh: "fishnets",
  "high heels": "heels",
  stiletto: "heels",
  pumps: "heels",
  "long gloves": "gloves",
  "opera gloves": "gloves",
  "fingerless gloves": "gloves",
  bathrobe: "robe",
  "silk robe": "robe",
  "business suit": "office",
  "office lady": "office",
  "secretary outfit": "office",
  "summer dress": "sundress",
  "floral dress": "sundress",
  "light dress": "sundress",
  "short skirt": "mini_skirt",
  "micro skirt": "mini_skirt",
  "pleated skirt": "mini_skirt",
  piercing: "body_jewelry",
  "nipple piercing": "body_jewelry",
  "belly ring": "body_jewelry",
  "body chains": "body_jewelry",

  // Toys
  "sex toy": "toys",
  "adult toy": "toys",
  phallus: "dildo",
  dong: "dildo",
  "fake penis": "dildo",
  vibe: "vibrator",
  "buzz toy": "vibrator",
  massager: "vibrator",
  "realistic penis": "realistic_dildo",
  "ejaculating dildo": "squirting_dildo",
  "cum dildo": "squirting_dildo",
  "squirting toy": "squirting_dildo",
  lush: "lovense",
  "remote vibe": "lovense",
  "nipple clamp": "nipple_clamps",
  "tit clamp": "nipple_clamps",
  "suction vibrator": "suction_toy",
  "clit sucker": "suction_toy",
  "nipple sucker": "suction_toy",
  "bullet vibe": "bullet_vibrator",
  "small vibrator": "bullet_vibrator",
  "pocket rocket": "bullet_vibrator",
  "egg vibe": "egg_vibrator",
  "insertable vibe": "egg_vibrator",
  "g-spot egg": "egg_vibrator",

  // Positions
  cowgirl: "riding",
  "reverse cowgirl": "riding",
  "on top": "riding",
  doggy: "doggy_style",
  "from behind": "doggy_style",
  "bent over": "doggy_style",
  "missionary position": "missionary",
  "face to face": "missionary",
  "pressed missionary": "mating_press",
  "standing sex": "standing",
  upright: "standing",
  "on knees": "kneeling",
  "leaning against wall": "seated_lean",
  "wall sit": "seated_lean",
  upskirt: "from_below",
  dp: "double_penetration_ass_and_pussy",
  "double penetration": "double_penetration_ass_and_pussy",
  "vaginal and anal": "double_penetration_ass_and_pussy",
  "double vaginal": "double_penetration_2_in_one",
  "double anal": "double_penetration_2_in_one",
  "two in one": "double_penetration_2_in_one",
  "spitroast position": "spitroast",
  "threeway spitroast": "spitroast",

  // Actions
  "vaginal sex": "vaginal_penetration",
  "pussy penetration": "vaginal_penetration",
  "insertion vaginal": "vaginal_penetration",
  "anal sex": "anal_penetration",
  "ass penetration": "anal_penetration",
  backdoor: "anal_penetration",
  "solo masturbation": "masturbation",
  "self pleasure": "masturbation",
  "jerking off": "masturbation",
  titfuck: "tit_job",
  boobjob: "tit_job",
  "tit bounce": "shimmy",
  "boob shake": "shimmy",
  twerking: "twerk",
  "booty shake": "twerk",
  "ass dance": "twerk",
  dancing: "dance",
  "strip dance": "dance",
  "pole dance": "dance",
  "oral sex": "blowjob",
  bj: "blowjob",
  fellatio: "blowjob",
  cumming: "orgasm",
  climax: "orgasm",
  orgasming: "orgasm",
  talking: "ramble",
  rambling: "ramble",
  "stripper pole": "pole_dance",
  "bondage play": "bondage",
  "tied up": "bondage",
  restrained: "bondage",
  shibari: "rope",
  "rope bondage": "rope",
  handcuffs: "cuffs",
  "wrist cuffs": "cuffs",
  "ankle cuffs": "cuffs",
  blindfolded: "blindfold",
  "eyes covered": "blindfold",
  pissing: "piss",
  watersports: "piss",
  "golden shower": "piss",
  "piss drink": "piss_drinking",
  "urine drink": "piss_drinking",
  "piss swallow": "piss_drinking",
  spank: "spanking",
  paddling: "spanking",
  impact: "spanking",

  // Taboo
  "taboo play": "taboo",
  forbidden: "taboo",
  taboo1: "incest",
  "incest roleplay": "incest",
  taboo2: "scat",
  "scat play": "scat",
  feces: "scat",
  poop: "scat",
  taboo3: "fart",
  farting: "fart",
  "gas play": "fart",
  eproctophilia: "fart",
  taboo4: "cnc",
  "consensual non-consent": "cnc",
  "rape play": "cnc",
  forced: "cnc",
  taboo5: "dubcon",
  "dubious consent": "dubcon",
  "dubcon play": "dubcon",
  reluctant: "dubcon",
  Taboo6: "race_play",
  raceplay: "race_play",
  "racial roleplay": "race_play",
  "black new world order": "race_play",
  "bnwo play": "race_play",
  "racial supremacy": "race_play",
  Taboo7: "hypno",
  hypnosis: "hypno",
  "mind control": "hypno",
  trance: "hypno",
  taboo8: "somno",
  somnophilia: "somno",
  "sleep play": "somno",
  unconscious: "somno",
  Taboo9: "monster_dildo",
  "fantasy dildo": "monster_dildo",
  "dragon dildo": "monster_dildo",
  "alien dildo": "monster_dildo",
  "knot dildo": "knotted_dildo",
  taboo10: "knotted_dildo",
  "werewolf dildo": "knotted_dildo",
  knotted_dildo: "monster_dildo",
  "tentacle toy": "tentacle",
  "hentai toy": "tentacle",
  tentacle: "monster_dildo",
  "octopus dildo": "tentacle",

  // Participants
  lunepusa: "lunepusa_f",
  "katya luv": "katya_luv_tf",
  katya: "katya_luv_tf",
  "lily the elf": "lilytheelf_tf",
  lily: "lilytheelf_tf",
  single: "solo",
  solo1: "lunepusa_f",
  solo2: "katya_luv_tf",
  solo3: "lilytheelf_tf",
  alone: "solo",
  "3way": "threesome",
  couple: "duo",
  "2person": "duo",

  // Roleplay
  rp: "roleplay",
  "role playing": "roleplay",
  "fantasy play": "roleplay",
  "mommy dom": "mommy",
  "mother roleplay": "mommy",
  maternal: "mommy",
  "nurse outfit": "nurse",
  "medical roleplay": "nurse",
  "nun costume": "nun",
  "religious roleplay": "nun",
  "slave play": "slave",
  submissive: "slave",
  servant: "slave",
  petplay: "pet",
  kitty: "pet",
  puppy: "pet",
  "master dom": "master",
  dominant: "master",
  owner: "master",
  "costume play": "cosplay",
  "character cosplay": "cosplay",

  //other
 nopost: "delete",
 remove: "delete",
 photo: "picture",
 clip: "video",
};

// Lowercase map for fast lookup
const LOWERCASE_MAP = {};
Object.keys(SYNONYM_MAP).forEach((syn) => {
  LOWERCASE_MAP[syn.toLowerCase()] = SYNONYM_MAP[syn];
});
CANONICAL_TAGS.forEach((tag) => {
  LOWERCASE_MAP[tag.toLowerCase()] = tag;
});

/**
 * Search tags by synonym or partial match
 */
export const searchTags = (query) => {
  if (!query) return [];
  const lower = query.toLowerCase().trim();

  const results = new Set();

  // Exact synonym
  if (LOWERCASE_MAP[lower]) {
    results.add(LOWERCASE_MAP[lower]);
  }

  // Partial on canonical
  CANONICAL_TAGS.forEach((tag) => {
    if (tag.toLowerCase().includes(lower)) {
      results.add(tag);
    }
  });

  // Partial on synonyms
  Object.keys(SYNONYM_MAP).forEach((syn) => {
    if (syn.toLowerCase().includes(lower)) {
      results.add(SYNONYM_MAP[syn]);
    }
  });

  return Array.from(results).sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();

    if (LOWERCASE_MAP[lower] === a) return -1;
    if (LOWERCASE_MAP[lower] === b) return 1;

    if (aLower.startsWith(lower) && !bLower.startsWith(lower)) return -1;
    if (!aLower.startsWith(lower) && bLower.startsWith(lower)) return 1;

    return aLower.localeCompare(bLower);
  });
};

/**
 * Normalize tags (synonyms → canonical, dedupe)
 */
export const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  const set = new Set();
  tags.forEach((t) => {
    const lower = t.toLowerCase().trim();
    const canonical = LOWERCASE_MAP[lower];
    if (canonical) set.add(canonical);
  });
  return Array.from(set);
};

/**
 * Get all canonical tags
 */
export const getAllTags = () => CANONICAL_TAGS;

// TagSelect component — editable with Save button
export const TagSelect = ({ initialTags = "", onSave, placeholder = "Type to add tags..." }) => {
  const [localTags, setLocalTags] = useState(initialTags.split(",").map(t => t.trim()).filter(t => t));
  const [inputValue, setInputValue] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  useEffect(() => {
    if (inputValue.trim()) {
      const results = searchTags(inputValue);
      setFilteredSuggestions(results.filter(tag => !localTags.includes(tag)));
    } else {
      setFilteredSuggestions([]);
    }
  }, [inputValue, localTags]);

  const addTag = (tag) => {
    tag = tag.trim();
    if (tag && !localTags.includes(tag)) {
      setLocalTags([...localTags, tag]);
    }
    setInputValue("");
  };

  const removeTag = (tagToRemove) => {
    setLocalTags(localTags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue.trim());
    } else if (e.key === "Enter" && filteredSuggestions.length > 0) {
      e.preventDefault();
      addTag(filteredSuggestions[0]);
    }
  };

  const handleSave = () => {
    onSave(localTags.join(","));
  };

  return (
    <div style={{ margin: "10px 0" }}>
      {/* Current tags */}
      <div style={{ minHeight: "32px", marginBottom: "8px" }}>
        {localTags.map((tag) => (
          <span
            key={tag}
            style={{
              display: "inline-block",
              background: "#333",
              color: "#fff",
              padding: "4px 10px",
              margin: "2px 4px 2px 0",
              borderRadius: "16px",
            }}
          >
            {tag}
            <span
              style={{
                marginLeft: "8px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
              onClick={() => removeTag(tag)}
            >
              ×
            </span>
          </span>
        ))}
      </div>

      {/* Input */}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "8px",
          background: "#222",
          border: "1px solid #444",
          color: "#fff",
          borderRadius: "4px",
        }}
      />

      {/* Suggestions */}
      {filteredSuggestions.length > 0 && (
        <div
          style={{
            maxHeight: "150px",
            overflowY: "auto",
            background: "#222",
            border: "1px solid #444",
            borderTop: "none",
            borderRadius: "0 0 4px 4px",
          }}
        >
          {filteredSuggestions.map((tag) => (
            <div
              key={tag}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                background: "#333",
              }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addTag(tag)}
            >
              {tag}
            </div>
          ))}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        style={{
          marginTop: "10px",
          padding: "8px 16px",
          background: "#0066cc",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Save Changes
      </button>
    </div>
  );
};

export const getTagsArray = (tagInput) => {
  if (!tagInput) return [];
  if (Array.isArray(tagInput)) return tagInput;
  if (typeof tagInput === "string") {
    return tagInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }
  return [];
};

// Reusable read-only tag list with clickable links to /gallery#tag
export const ClickableTags = ({ tags = "", emptyText = "None set" }) => {
const tagArray = getTagsArray(tags);

  return (
    <div style={{ margin: "0.5% 0" }}>
      {/* Debug line — shows raw input and parsed array */}
      <p style={{ color: "#888", fontSize: "0.7em", margin: "0 0 0.5% 0" }}>
        Debug: Raw = "{tags || '(empty)'}" | Parsed = [{tagArray.join(", ") || "none"}]
      </p>

      {tagArray.length === 0 ? (
        <span style={{ color: "#666" }}>{emptyText}</span>
      ) : (
        <>
          {tagArray.map((tag, i) => (
            <React.Fragment key={tag}>
              <a
                href={`/gallery#${encodeURIComponent(tag)}`}
                style={{
                  color: "#0066cc",
                  textDecoration: "none",
                  marginRight: "0.5%",
                }}
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = `/gallery#${encodeURIComponent(tag)}`;
                }}
              >
                {tag}
              </a>
              {i < tagArray.length - 1 && <span style={{ color: "#666" }}>, </span>}
            </React.Fragment>
          ))}
        </>
      )}
    </div>
  );
};