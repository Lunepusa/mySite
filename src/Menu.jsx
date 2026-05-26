import React, { useState, useEffect } from "react";
import { useAuth } from "./Auth";
import { ClickableTags } from "Tags.jsx";

// ──────────────────────────────────────────────────────────────────────────────
// 1. CONTROL PANEL (VARIABLES)
// ──────────────────────────────────────────────────────────────────────────────
export const PRICING = {
  // --- INVOICE RATES ---
  CONTENT_PERMINUTE: 3.0, // $180/hr = $3.00/min
  PREPOST_HOURLY: 20.0, // $20/hr = ~$0.33/min
  DISCUSSION_HOURLY: 10.0, // $10/hr = ~$0.17/min
  EDITING_HOURLY: 20.0, // $20/hr = ~$0.33/min

  // --- INVOICE CONSUMABLES ---
  LUBE_COST: 2.0,
  CONDOM_COST: 1.0,
  PANTYHOSE_COST: 5.0,

  // --- MARKUPS & DISCOUNTS (Decimals) ---
  MARKUP_RATE: 0.5,
  DISCOUNT_RATE: 0.25,

  // --- SERVICE MIN/MAX LIMITS ---
  VIDEO_MIN: 3,
  VIDEO_MAX: 15,
  PHOTO_MIN: 5,
  PHOTO_MAX: 20,
  CALL_MIN: 5,
  CALL_MAX: 30,
  SEXTING_MIN: 15,
  SEXTING_MAX: 60,

  // --- BASELINE ASSUMPTIONS (Minutes) ---
  BASE_DISCUSSION: 15, // Default across most customs
  BASE_SETUP_VID: 30, // Default prep for videos
  BASE_SETUP_PIC: 15, // Default prep for photos
  BASE_SETUP_CALL: 60, // 1 hour prep for calls
  BASE_SETUP_SEXT: 0, // No prep for sexting
  BASE_SETUP_VID_RATING: 15, // Max 15m prep for vid rating
  BASE_DISC_TEXT_RATING: 30, // Flat 30m discussion for text rating
  EXTRA_PREP_TAG_MINS: 30, // Mins added per extra prep tag
};

export const BLURBS = {
  INTRO:
    "My content isn't professional, polished, or studio-grade. It’s just me, my 1280p phone camera, and my frankly ridiculous amount of toys and lingerie to choose from 🤣 It’s raw, unedited, and usually a bit silly or awkward. It honestly just feels like you asked your girlfriend to do a thing for you to enjoy.",
  CUSTOMS:
    "For customs, you can use the builder below to help explain it, or just send me the details in your own words. That said, I don’t film on a schedule. I film when the mood strikes. Since I don't have a standard turnaround time, I don’t take money upfront (unless it's something I can't post to my lounge...) Once I finish the video, I'll let you know! Then as soon as you pay, you will get all of it (and anything else I made if I got ~inspired~).",
  LIVE: "Since Live content is so intimate and interactive, I only open my availability for calls and sexting when I’m having one of those perfect, high-energy times where I can actually be fully present and enjoy the vibe with you.\n\nWhen I’m in the mood to connect, I’ll send a heads-up to my VIP mailer. If you want to catch me when I’m feeling it, that’s the place to be. Payment for these is required upfront.",
  RATING:
    "Ratings are in a bit of a middle ground. I try to get them done same day, but they won't be done immediately. They also require payment upfront.",
};

// ──────────────────────────────────────────────────────────────────────────────
// 2. THE PRICING ENGINE
// ──────────────────────────────────────────────────────────────────────────────
/*
  SUBTOTAL (S):
  S = (discussionQty * (DISCUSSION_HOURLY/60)) + 
      (prePostQty * (PREPOST_HOURLY/60)) + 
      (contentQty * CONTENT_PERMINUTE) + 
      (editingQty * (EDITING_HOURLY/60)) + 
      (consumables)

  FINAL TOTAL (P):
  P = (S * (1 + MarkupPercentage)^MarkupQty) * (1 - DiscountPercentage)^DiscountQty
  * Rounded down to nearest $5.
*/

export const calculatePrice = ({
  discussionQty = 0,
  prePostQty = 0,
  contentQty = 0,
  editingQty = 0,
  consumables = 0,
  markupQty = 0,
  discountQty = 0,
}) => {
  const base =
    discussionQty * (PRICING.DISCUSSION_HOURLY / 60) +
    prePostQty * (PRICING.PREPOST_HOURLY / 60) +
    contentQty * PRICING.CONTENT_PERMINUTE +
    editingQty * (PRICING.EDITING_HOURLY / 60) +
    consumables;

  let currentMarkupBase = base;
  let totalMarkup = 0;
  for (let i = 0; i < markupQty; i++) {
    const amt = currentMarkupBase * PRICING.MARKUP_RATE;
    totalMarkup += amt;
    currentMarkupBase += amt;
  }

  let currentDiscountBase = base;
  let totalDiscount = 0;
  for (let i = 0; i < discountQty; i++) {
    const amt = currentDiscountBase * PRICING.DISCOUNT_RATE;
    totalDiscount += amt;
    currentDiscountBase -= amt;
  }

  const finalPrice = base + totalMarkup - totalDiscount;
  return Math.floor(finalPrice / 5) * 5;
};

// ──────────────────────────────────────────────────────────────────────────────
// 3. MAIN COMPONENT (THE SPLIT)
// ──────────────────────────────────────────────────────────────────────────────
export default function MenuPage() {
  const { isAdmin } = useAuth();

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "15px",
        fontFamily: "inherit",
        color: "#fff",
        background: "#000",
      }}
    >
      {/* --- PUBLIC SECTION --- */}
      <PublicMessage />
      <CustomQuiz />

      {/* --- PRIVATE SECTION --- */}
      {isAdmin && (
        <div
          style={{
            marginTop: "50px",
            paddingTop: "20px",
            borderTop: "4px double #fff",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            Admin Private Zone
          </h2>
          <LegacyMenuItems />
          <Invoice />
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. PUBLIC SECTION COMPONENTS
// ──────────────────────────────────────────────────────────────────────────────
function PublicMessage() {
  // Dynamically calculate the baseline minimum prices using the engine
  const picMin = calculatePrice({
    discussionQty: PRICING.BASE_DISCUSSION,
    prePostQty: PRICING.BASE_SETUP_PIC,
    contentQty: PRICING.PHOTO_MIN * 0.5,
  });
  const vidMin = calculatePrice({
    discussionQty: PRICING.BASE_DISCUSSION,
    prePostQty: PRICING.BASE_SETUP_VID,
    contentQty: PRICING.VIDEO_MIN,
  });
  const sextMin = calculatePrice({
    discussionQty: PRICING.SEXTING_MIN * 0.5,
    prePostQty: PRICING.BASE_SETUP_SEXT,
    contentQty: PRICING.SEXTING_MIN * 0.5,
  });
  const callMin = calculatePrice({
    discussionQty: 0,
    prePostQty: PRICING.BASE_SETUP_CALL,
    contentQty: PRICING.CALL_MIN,
    markupQty: 1,
  });
  const txtRating = calculatePrice({
    discussionQty: PRICING.BASE_DISC_TEXT_RATING,
  });
  const vidRating = calculatePrice({
    discussionQty: PRICING.BASE_DISCUSSION,
    prePostQty: PRICING.BASE_SETUP_VID_RATING,
    contentQty: 5,
    markupQty: 1,
    discountQty: 1,
  });

  return (
    <div
      style={{
        marginBottom: "30px",
        padding: "20px",
        border: "1px solid #fff",
        lineHeight: "1.6",
        fontSize: "0.95em",
        whiteSpace: "pre-wrap",
      }}
    >
      <p style={{ margin: "0 0 20px 0" }}>{BLURBS.INTRO}</p>

      <p
        style={{
          margin: "0 0 10px 0",
          textTransform: "uppercase",
          fontWeight: "bold",
        }}
      >
        --- Customs ---
      </p>
      <p style={{ margin: "0 0 10px 0" }}>{BLURBS.CUSTOMS}</p>
      <ul
        style={{
          listStyleType: "none",
          padding: 0,
          margin: "0 0 20px 0",
          opacity: 0.9,
        }}
      >
        <li>Custom Pictures: ${picMin}+</li>
        <li>Custom Videos: ${vidMin}+</li>
      </ul>

      <p
        style={{
          margin: "0 0 10px 0",
          textTransform: "uppercase",
          fontWeight: "bold",
        }}
      >
        --- Live ---
      </p>
      <p style={{ margin: "0 0 10px 0" }}>{BLURBS.LIVE}</p>
      <ul
        style={{
          listStyleType: "none",
          padding: 0,
          margin: "0 0 20px 0",
          opacity: 0.9,
        }}
      >
        <li>Sexting: ${sextMin}+</li>
        <li>Calls: ${callMin}+</li>
      </ul>

      <p
        style={{
          margin: "0 0 10px 0",
          textTransform: "uppercase",
          fontWeight: "bold",
        }}
      >
        --- Ratings ---
      </p>
      <p style={{ margin: "0 0 10px 0" }}>{BLURBS.RATING}</p>
      <ul
        style={{ listStyleType: "none", padding: 0, margin: "0", opacity: 0.9 }}
      >
        <li>Text Ratings: ${txtRating}</li>
        <li>Video Ratings: ${vidRating}</li>
      </ul>
    </div>
  );
}

function CustomQuiz() {
  const { isLoggedIn, savedPairs } = useAuth();
  const hasEmail =
    savedPairs &&
    savedPairs.some(
      (pair) => pair.platform && pair.platform.toLowerCase() === "email",
    );

  const [submitStatus, setSubmitStatus] = useState("idle");
  const [showEmailWarning, setShowEmailWarning] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState(null);

  const [category, setCategory] = useState("custom");
  const [subType, setSubType] = useState("video");
  const [quantity, setQuantity] = useState(3);
  const [isExclusive, setIsExclusive] = useState(false);
  const [description, setDescription] = useState("");

  const [selectedPrep, setSelectedPrep] = useState([]);
  const [selectedStandard, setSelectedStandard] = useState([]);
  const [estimate, setEstimate] = useState(0);

  const [showAllStandard, setShowAllStandard] = useState(false);
  const [showAllPrep, setShowAllPrep] = useState(false);

  const standardActivities = [
    "Specific Toy",
    "Specific Outfit",
    "Roleplay",
    "Femdom (I Dominate)",
    "Doggystyle",
    "Realistic Toy",
    "Fantasy Toy",
    "Vibrator",
    "Lingerie",
    "Day Clothes",
    "Nude",
    "Submissive (I Submit)",
    "Humiliation",
    "Riding",
    "Missionary",
    "Masturbation",
    "Blowjob (Implied)",
    "Tit Job",
    "Edging",
    "Teasing",
    "Ramblefap",
  ];

  const prepActivities = [
    "Multiple Camera Angles",
    "Bondage",
    "Piss",
    "Anal",
    "Fake Cum",
    "Advanced Editing",
    "Squirting",
    "Double Penetration",
  ];

  // --- DYNAMIC CONTENT LIMITS (1 kink per 2.5 mins content) ---
  let contentMinutes = quantity;
  if (subType === "photo") contentMinutes = quantity * 0.5;
  if (subType === "sexting") contentMinutes = quantity * 0.5;
  if (category === "rating") contentMinutes = 5;

  const maxKinks = Math.max(2, Math.floor(contentMinutes / 2.5));
  const currentKinksCount = selectedPrep.length + selectedStandard.length;

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    if (cat === "custom") {
      setSubType("video");
      setQuantity(PRICING.VIDEO_MIN);
    }
    if (cat === "rating") {
      setSubType("text");
      setQuantity(1);
    }
    if (cat === "live") {
      setSubType("call");
      setQuantity(PRICING.CALL_MIN);
    }
    setSelectedPrep([]);
    setSelectedStandard([]);
    setIsExclusive(false);
  };

  const handleSubTypeChange = (type, defaultQty) => {
    setSubType(type);
    setQuantity(defaultQty);
    setSelectedPrep([]);
    setSelectedStandard([]);
  };

  const toggleKink = (kink, type) => {
    const list = type === "prep" ? selectedPrep : selectedStandard;
    const setList = type === "prep" ? setSelectedPrep : setSelectedStandard;
    if (list.includes(kink)) {
      setList(list.filter((k) => k !== kink));
    } else {
      if (currentKinksCount < maxKinks) setList([...list, kink]);
    }
  };

  const getDynamicPlaceholder = () => {
    let prompts = ["Describe your fantasy..."];
    if (selectedStandard.includes("Specific Outfit"))
      prompts.push("What exact outfit are you picturing?");
    if (selectedStandard.includes("Specific Toy"))
      prompts.push("Which specific toy should I use?");
    if (selectedStandard.includes("Roleplay"))
      prompts.push("What is the scenario/setting?");
    if (
      selectedStandard.includes("Femdom (I Dominate)") ||
      selectedStandard.includes("Humiliation")
    )
      prompts.push("What rules or instructions do you want me to give you?");
    if (prompts.length === 1)
      return "Describe your fantasy... What should I wear? What exactly do you want to happen?";
    return prompts.join(" ");
  };

  const handleAttemptSubmit = (type) => {
    if (!hasEmail) {
      setPendingSubmission(type);
      setShowEmailWarning(true);
    } else {
      setSubmitStatus(type);
    }
  };

  const confirmSubmit = () => {
    setShowEmailWarning(false);
    setSubmitStatus(pendingSubmission);
    setPendingSubmission(null);
  };

  // --- FEED THE ENGINE ---
  useEffect(() => {
    let discussion = PRICING.BASE_DISCUSSION;
    let setup = PRICING.BASE_SETUP_VID;
    let content = quantity;
    let markups = 0;
    let discounts = 0;

    // Apply baseline rules based on type
    if (category === "rating") {
      if (subType === "text") {
        discussion = PRICING.BASE_DISC_TEXT_RATING;
        setup = 0;
        content = 0;
      } else if (subType === "vid_rating") {
        discussion = PRICING.BASE_DISCUSSION;
        setup = PRICING.BASE_SETUP_VID_RATING;
        content = 5;
        markups = 1;
        discounts = 1; // Exclusive + Easy
      }
    } else if (category === "live") {
      if (subType === "call") {
        discussion = 0;
        setup = PRICING.BASE_SETUP_CALL;
        content = quantity;
        markups = 1; // Calls require exclusive markup
      } else if (subType === "sexting") {
        discussion = quantity * 0.5;
        setup = PRICING.BASE_SETUP_SEXT;
        content = quantity * 0.5;
      }
    } else {
      // Customs
      if (subType === "photo") {
        setup = PRICING.BASE_SETUP_PIC;
        content = quantity * 0.5;
      }
      if (isExclusive) markups += 1;
    }

    // Add extra prep time for complex tags
    setup += selectedPrep.length * PRICING.EXTRA_PREP_TAG_MINS;

    // Get exact rounded total
    const finalEstimate = calculatePrice({
      discussionQty: discussion,
      prePostQty: setup,
      contentQty: content,
      markupQty: markups,
      discountQty: discounts,
    });

    setEstimate(finalEstimate);
  }, [category, subType, quantity, isExclusive, selectedPrep.length]);

  const visibleStandard = showAllStandard
    ? standardActivities
    : standardActivities.slice(0, 5);
  const visiblePrep = showAllPrep ? prepActivities : prepActivities.slice(0, 5);

  if (showEmailWarning) {
    return (
      <div
        style={{
          padding: "30px",
          border: "1px solid #fff",
          textAlign: "center",
          background: "#000",
        }}
      >
        <h2 style={{ margin: "0 0 15px 0", letterSpacing: "1px" }}>
          ⚠️ Missing Email
        </h2>
        <p style={{ fontSize: "1.05em", lineHeight: "1.5" }}>
          You don't have an email associated with your account. While it's not
          required, it makes it much harder for me to notify you when your
          content is ready or if I have questions!
        </p>
        <div
          style={{
            marginTop: "25px",
            display: "flex",
            gap: "10px",
            justifyContent: "center",
          }}
        >
          <button
            onClick={confirmSubmit}
            style={{
              padding: "10px 20px",
              background: "transparent",
              border: "1px solid #fff",
              color: "#fff",
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            Submit Anyway
          </button>
          <button
            onClick={() => setShowEmailWarning(false)}
            style={{
              padding: "10px 20px",
              background: "#fff",
              border: "none",
              color: "#000",
              fontWeight: "bold",
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (submitStatus === "custom") {
    return (
      <div
        style={{
          padding: "30px",
          border: "1px solid #fff",
          textAlign: "center",
          background: "#000",
        }}
      >
        <h2 style={{ margin: "0 0 15px 0" }}>Request Sent!</h2>
        <p style={{ fontSize: "1.05em", lineHeight: "1.5" }}>
          Thanks! I’ve added this to my queue. I’ll reach out if I have
          questions, and send an invoice once it's done.
        </p>
        <button
          onClick={() => setSubmitStatus("idle")}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            background: "transparent",
            border: "1px solid #fff",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Back
        </button>
      </div>
    );
  }

if (submitStatus === "suggestion") {
  // Combine the user's selected tags into a comma-separated string
  const combinedTags = [...selectedStandard, ...selectedPrep].join(",");

  return (
    <div
      style={{
        padding: "30px",
        border: "1px solid #fff",
        textAlign: "center",
        background: "#000",
      }}
    >
      <h2 style={{ margin: "0 0 15px 0" }}>Suggestion Added!</h2>
      <p style={{ fontSize: "1.05em", lineHeight: "1.5" }}>
        Thanks for submitting! I use this box for inspiration. If I ever end up
        making this concept, you'll be the first to get an email notification!
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginTop: "25px",
          alignItems: "center",
        }}
      >
        <button
          style={{
            padding: "12px",
            width: "80%",
            background: "#fff",
            border: "none",
            color: "#000",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Vote on other Suggestions
        </button>

        {/* --- REPLACED BUTTON WITH CLICKABLE TAGS SECTION --- */}
        <div
          style={{
            padding: "12px",
            width: "80%",
            background: "transparent",
            border: "1px solid #fff",
            color: "#fff",
          }}
        >
          <p
            style={{
              margin: "0 0 5px 0",
              fontSize: "0.85em",
              textTransform: "uppercase",
            }}
          >
            See what I already have with these tags:
          </p>
          <ClickableTags
            tags={combinedTags}
            emptyText="No specific tags selected."
          />
        </div>

        <button
          onClick={() => {
            setSubmitStatus("idle");
            setSelectedStandard([]);
            setSelectedPrep([]);
          }}
          style={{
            padding: "10px",
            width: "80%",
            background: "transparent",
            border: "1px dashed #777",
            color: "#aaa",
            cursor: "pointer",
            marginTop: "10px",
          }}
        >
          Build Another Request
        </button>
      </div>
    </div>
  );
}

  return (
    <div
      style={{
        padding: "15px",
        border: "1px solid #fff",
        fontSize: "0.95em",
        background: "#000",
      }}
    >
      <h3
        style={{
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: "1px",
          margin: "0 0 20px 0",
        }}
      >
        Custom Builder
      </h3>

      <div style={{ display: "flex", gap: "5px", marginBottom: "15px" }}>
        <TabButton
          active={category === "custom"}
          onClick={() => handleCategoryChange("custom")}
          label="Customs"
        />
        <TabButton
          active={category === "rating"}
          onClick={() => handleCategoryChange("rating")}
          label="Ratings"
        />
        <TabButton
          active={category === "live"}
          onClick={() => handleCategoryChange("live")}
          label="Live"
        />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <h4 style={{ margin: "0 0 5px 0", textTransform: "uppercase" }}>
          1. Format
        </h4>
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          {category === "custom" && (
            <>
              <SelectionButton
                active={subType === "video"}
                onClick={() => handleSubTypeChange("video", PRICING.VIDEO_MIN)}
                label="Video"
              />
              <SelectionButton
                active={subType === "photo"}
                onClick={() => handleSubTypeChange("photo", PRICING.PHOTO_MIN)}
                label="Photo Set"
              />
            </>
          )}
          {category === "rating" && (
            <>
              <SelectionButton
                active={subType === "text"}
                onClick={() => handleSubTypeChange("text", 1)}
                label="Text Rating"
              />
              <SelectionButton
                active={subType === "vid_rating"}
                onClick={() => handleSubTypeChange("vid_rating", 1)}
                label="Video Rating"
              />
            </>
          )}
          {category === "live" && (
            <>
              <SelectionButton
                active={subType === "call"}
                onClick={() => handleSubTypeChange("call", PRICING.CALL_MIN)}
                label="Video Call"
              />
              <SelectionButton
                active={subType === "sexting"}
                onClick={() =>
                  handleSubTypeChange("sexting", PRICING.SEXTING_MIN)
                }
                label="Sexting"
              />
            </>
          )}
        </div>
      </div>

      {category !== "rating" && (
        <div
          style={{
            marginBottom: "15px",
            border: "1px solid #444",
            padding: "15px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontWeight: "bold", minWidth: "60px", color: "#fff" }}
            >
              {quantity} {subType === "photo" ? "pics" : "min"}
            </span>
            <input
              type="range"
              min={
                subType === "photo"
                  ? PRICING.PHOTO_MIN
                  : subType === "video"
                    ? PRICING.VIDEO_MIN
                    : subType === "call"
                      ? PRICING.CALL_MIN
                      : PRICING.SEXTING_MIN
              }
              max={
                subType === "photo"
                  ? PRICING.PHOTO_MAX
                  : subType === "video"
                    ? PRICING.VIDEO_MAX
                    : subType === "call"
                      ? PRICING.CALL_MAX
                      : PRICING.SEXTING_MAX
              }
              step={subType === "call" ? 5 : subType === "sexting" ? 15 : 1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              style={{ flexGrow: 1, marginLeft: "10px" }}
            />
          </div>
        </div>
      )}

      <div style={{ marginBottom: "15px" }}>
        <h4 style={{ margin: "0 0 5px 0", textTransform: "uppercase" }}>
          2. Specifics & Tags
        </h4>
        <p style={{ fontSize: "0.8em", color: "#aaa", margin: "0 0 10px 0" }}>
          Select up to {maxKinks}. ({currentKinksCount}/{maxKinks} selected)
        </p>

        <p
          style={{
            margin: "0 0 5px 0",
            fontSize: "0.85em",
            fontWeight: "bold",
          }}
        >
          Standard (Included)
        </p>
        <div style={{ display: "inline-block", marginBottom: "10px" }}>
          {visibleStandard.map((kink) => (
            <KinkPill
              key={kink}
              label={kink}
              active={selectedStandard.includes(kink)}
              disabled={
                !selectedStandard.includes(kink) &&
                currentKinksCount >= maxKinks
              }
              onClick={() => toggleKink(kink, "standard")}
            />
          ))}
          <button
            onClick={() => setShowAllStandard(!showAllStandard)}
            style={{
              padding: "4px 8px",
              background: "transparent",
              color: "#ccc",
              border: "1px dashed #777",
              cursor: "pointer",
              fontSize: "0.8em",
              display: "inline-block",
              margin: "3px",
            }}
          >
            {showAllStandard ? "Hide" : `All (${standardActivities.length})...`}
          </button>
        </div>

        <p
          style={{
            margin: "10px 0 5px 0",
            fontSize: "0.85em",
            fontWeight: "bold",
          }}
        >
          Extra Time/Setup (+$
          {PRICING.EXTRA_PREP_TAG_MINS * (PRICING.PREPOST_HOURLY / 60)} each)
        </p>
        <div style={{ display: "inline-block", marginBottom: "15px" }}>
          {visiblePrep.map((kink) => (
            <KinkPill
              key={kink}
              label={kink}
              active={selectedPrep.includes(kink)}
              disabled={
                !selectedPrep.includes(kink) && currentKinksCount >= maxKinks
              }
              onClick={() => toggleKink(kink, "prep")}
            />
          ))}
          <button
            onClick={() => setShowAllPrep(!showAllPrep)}
            style={{
              padding: "4px 8px",
              background: "transparent",
              color: "#ccc",
              border: "1px dashed #777",
              cursor: "pointer",
              fontSize: "0.8em",
              display: "inline-block",
              margin: "3px",
            }}
          >
            {showAllPrep ? "Hide" : `All (${prepActivities.length})...`}
          </button>
        </div>

        <textarea
          placeholder={getDynamicPlaceholder()}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="4"
          style={{
            width: "100%",
            padding: "10px",
            background: "#000",
            color: "#fff",
            border: "1px solid #fff",
            resize: "vertical",
            boxSizing: "border-box",
            fontSize: "0.9em",
            fontFamily: "inherit",
          }}
        />

        <div style={{ marginTop: "15px" }}>
          {category === "custom" && (
            <ToggleRow
              label={`Exclusive Content (+${PRICING.MARKUP_RATE * 100}% Markup, Includes Name Use)`}
              active={isExclusive}
              onClick={() => setIsExclusive(!isExclusive)}
            />
          )}
        </div>
      </div>

      <div style={{ padding: "15px", textAlign: "center", borderTop: "1px solid #fff" }}>
        <p style={{ margin: "0", fontSize: "0.9em", textTransform: "uppercase" }}>Ballpark Price</p>
        <h2 style={{ margin: "5px 0 0 0", fontSize: "2.5em" }}>${estimate.toFixed(0)}</h2>
        <p style={{ fontSize: "0.75em", color: "#888", fontStyle: "italic", margin: "0 0 20px 0" }}>*Subject to review and final invoice.</p>
        
        {isLoggedIn ? (
          <>
            <button 
              disabled={true} // <-- DISABLED
              onClick={() => handleAttemptSubmit("custom")} 
              style={{ 
                width: "100%", padding: "12px", marginBottom: "10px", fontWeight: "bold", textTransform: "uppercase",
                background: category === "live" ? "transparent" : "#fff", 
                border: category === "live" ? "1px solid #fff" : "none", 
                color: category === "live" ? "#fff" : "#000", 
                cursor: "not-allowed", // <-- CHANGED CURSOR
                opacity: 0.5 // <-- ADDED FADE
              }}
            >
              {category === "live" ? "Join Priority Waitlist" : "Request this Custom"}
            </button>
            <button 
              disabled={true} // <-- DISABLED
              onClick={() => handleAttemptSubmit("suggestion")} 
              style={{ 
                width: "100%", padding: "10px", background: "transparent", border: "1px dashed #777", 
                color: "#ccc", fontSize: "0.85em", textTransform: "uppercase",
                cursor: "not-allowed", // <-- CHANGED CURSOR
                opacity: 0.5 // <-- ADDED FADE
              }}
            >
              Add to Public Suggestion Box (Free)
            </button>
            {/* Added a temporary warning note so users know why they can't click */}
            <p style={{ margin: "15px 0 0 0", fontSize: "0.85em", color: "#ff69b4", fontStyle: "italic" }}>
              *Submissions are temporarily disabled while I connect the new backend!
            </p>
          </>
        ) : (
          <div style={{ padding: "15px", border: "1px dashed #777", color: "#ccc" }}>
            <p style={{ margin: "0 0 10px 0", fontSize: "0.9em" }}>Log in or create an account to submit requests and suggestions!</p>
            <button style={{ padding: "10px 20px", background: "#fff", border: "none", color: "#000", fontWeight: "bold", cursor: "pointer", textTransform: "uppercase" }}>Sign In / Register</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. PRIVATE SECTION COMPONENTS (Admin Only)
// ──────────────────────────────────────────────────────────────────────────────
function LegacyMenuItems() {
  return (
    <div
      style={{
        marginBottom: "30px",
        border: "1px dashed #444",
        padding: "20px",
        textAlign: "center",
        color: "#777",
      }}
    >
      <p style={{ margin: 0, textTransform: "uppercase", fontSize: "0.9em" }}>
        [ Paste any existing/legacy menu items here ]
      </p>
    </div>
  );
}

function Invoice() {
  const presetQuantities = {
    "Drive Access - Monthly": {
      discussionQty: 0,
      setupCleanupQty: 0,
      contentCreationQty: 0,
      editingQty: 0,
      cumLubeQty: 0,
      condomQty: 0,
      pantyhoseQty: 0,
      customItemQty: 1,
      customItemName: "1 Month Drive access",
      customItemCost: 10,
      exclusiveQty: 0,
      rushQty: 0,
      extremeQty: 0,
      bulkQty: 0,
      easyQty: 0,
      otherQty: 0,
    },
    "Drive Access - Yearly": {
      discussionQty: 0,
      setupCleanupQty: 0,
      contentCreationQty: 0,
      editingQty: 0,
      cumLubeQty: 0,
      condomQty: 0,
      pantyhoseQty: 0,
      customItemQty: 12,
      customItemName: "1 Month Drive access",
      customItemCost: 10,
      exclusiveQty: 0,
      rushQty: 0,
      extremeQty: 0,
      bulkQty: 1,
      easyQty: 1,
      otherQty: 0,
    },
    "Drive Access - Lifetime": {
      discussionQty: 0,
      setupCleanupQty: 0,
      contentCreationQty: 0,
      editingQty: 0,
      cumLubeQty: 0,
      condomQty: 0,
      pantyhoseQty: 0,
      customItemQty: 120,
      customItemName: "1 Month Drive access",
      customItemCost: 10,
      exclusiveQty: 0,
      rushQty: 0,
      extremeQty: 0,
      bulkQty: 3,
      easyQty: 1,
      otherQty: 0,
    },
    "Custom Photoset": {
      discussionQty: PRICING.BASE_DISCUSSION,
      setupCleanupQty: PRICING.BASE_SETUP_PIC,
      contentCreationQty: PRICING.PHOTO_MIN * 0.5,
      editingQty: 0,
      cumLubeQty: 0,
      condomQty: 0,
      pantyhoseQty: 0,
      customItemQty: 0,
      customItemName: "Custom Item",
      customItemCost: 0,
      exclusiveQty: 0,
      rushQty: 0,
      extremeQty: 0,
      bulkQty: 0,
      easyQty: 0,
      otherQty: 0,
    },
    "Custom Video": {
      discussionQty: PRICING.BASE_DISCUSSION,
      setupCleanupQty: PRICING.BASE_SETUP_VID,
      contentCreationQty: PRICING.VIDEO_MIN,
      editingQty: 0,
      cumLubeQty: 0,
      condomQty: 0,
      pantyhoseQty: 0,
      customItemQty: 0,
      customItemName: "Custom Item",
      customItemCost: 0,
      exclusiveQty: 0,
      rushQty: 0,
      extremeQty: 0,
      bulkQty: 0,
      easyQty: 0,
      otherQty: 0,
    },
    "Text Rating": {
      discussionQty: PRICING.BASE_DISC_TEXT_RATING,
      setupCleanupQty: 0,
      contentCreationQty: 0,
      editingQty: 0,
      cumLubeQty: 0,
      condomQty: 0,
      pantyhoseQty: 0,
      customItemQty: 0,
      customItemName: "Custom Item",
      customItemCost: 0,
      exclusiveQty: 0,
      rushQty: 0,
      extremeQty: 0,
      bulkQty: 0,
      easyQty: 0,
      otherQty: 0,
    },
    "Video Rating": {
      discussionQty: PRICING.BASE_DISCUSSION,
      setupCleanupQty: PRICING.BASE_SETUP_VID_RATING,
      contentCreationQty: 5,
      editingQty: 0,
      cumLubeQty: 2,
      condomQty: 0,
      pantyhoseQty: 0,
      customItemQty: 0,
      customItemName: "Custom Item",
      customItemCost: 0,
      exclusiveQty: 1,
      rushQty: 0,
      extremeQty: 0,
      bulkQty: 0,
      easyQty: 1,
      otherQty: 0,
    },
    "15m Sexting Session": {
      discussionQty: PRICING.SEXTING_MIN * 0.5,
      setupCleanupQty: PRICING.BASE_SETUP_SEXT,
      contentCreationQty: PRICING.SEXTING_MIN * 0.5,
      editingQty: 0,
      cumLubeQty: 0,
      condomQty: 0,
      pantyhoseQty: 0,
      customItemQty: 0,
      customItemName: "Custom Item",
      customItemCost: 0,
      exclusiveQty: 0,
      rushQty: 0,
      extremeQty: 0,
      bulkQty: 0,
      easyQty: 0,
      otherQty: 0,
    },
    "5m Video Call": {
      discussionQty: 0,
      setupCleanupQty: PRICING.BASE_SETUP_CALL,
      contentCreationQty: PRICING.CALL_MIN,
      editingQty: 0,
      cumLubeQty: 0,
      condomQty: 0,
      pantyhoseQty: 0,
      customItemQty: 0,
      customItemName: "Custom Item",
      customItemCost: 0,
      exclusiveQty: 1,
      rushQty: 0,
      extremeQty: 1,
      bulkQty: 0,
      easyQty: 0,
      otherQty: 0,
    },
    other: {
      discussionQty: 0,
      setupCleanupQty: 0,
      contentCreationQty: 0,
      editingQty: 0,
      cumLubeQty: 0,
      condomQty: 0,
      pantyhoseQty: 0,
      customItemQty: 0,
      customItemName: "Custom Item",
      customItemCost: 0,
      exclusiveQty: 0,
      rushQty: 0,
      extremeQty: 0,
      bulkQty: 0,
      easyQty: 0,
      otherQty: 0,
    },
  };

  const [discussionQty, setDiscussionQty] = useState(0);
  const [setupCleanupQty, setSetupCleanupQty] = useState(0);
  const [contentCreationQty, setContentCreationQty] = useState(0);
  const [editingQty, setEditingQty] = useState(0);
  const [cumLubeQty, setCumLubeQty] = useState(0);
  const [condomQty, setCondomQty] = useState(0);
  const [pantyhoseQty, setPantyhoseQty] = useState(0);
  const [customItemName, setCustomItemName] = useState("Custom Item");
  const [customItemCost, setCustomItemCost] = useState(0);
  const [customItemQty, setCustomItemQty] = useState(0);
  const [exclusiveQty, setExclusiveQty] = useState(0);
  const [rushQty, setRushQty] = useState(0);
  const [extremeQty, setExtremeQty] = useState(0);
  const [jerkQty, setjerkQty] = useState(0);
  const [bulkQty, setBulkQty] = useState(0);
  const [easyQty, setEasyQty] = useState(0);
  const [otherQty, setOtherQty] = useState(0);
  const [invoiceDescription, setInvoiceDescription] = useState("5m Video Call");

  const presetOptions = Object.keys(presetQuantities);

  useEffect(() => {
    applyPreset(invoiceDescription);
  }, []);

  const applyPreset = (value) => {
    const matchedPreset = presetOptions.find(
      (preset) => preset.toLowerCase() === value.toLowerCase(),
    );
    if (matchedPreset) {
      const q =
        presetQuantities[matchedPreset] || presetQuantities["5m Video Call"];
      setDiscussionQty(q.discussionQty);
      setSetupCleanupQty(q.setupCleanupQty);
      setContentCreationQty(q.contentCreationQty);
      setEditingQty(q.editingQty);
      setCumLubeQty(q.cumLubeQty);
      setCondomQty(q.condomQty);
      setPantyhoseQty(q.pantyhoseQty);
      setCustomItemQty(q.customItemQty);
      setCustomItemName(q.customItemName);
      setCustomItemCost(q.customItemCost);
      setExclusiveQty(q.exclusiveQty);
      setRushQty(q.rushQty);
      setExtremeQty(q.extremeQty);
      setBulkQty(q.bulkQty);
      setEasyQty(q.easyQty);
      setOtherQty(q.otherQty);
      setInvoiceDescription(matchedPreset);
    } else {
      setInvoiceDescription(value);
    }
  };

  const discussionRate = PRICING.DISCUSSION_HOURLY / 60;
  const setupCleanupRate = PRICING.PREPOST_HOURLY / 60;
  const contentCreationRate = PRICING.CONTENT_PERMINUTE;
  const editingRate = PRICING.EDITING_HOURLY / 60;

  const discussionCost = discussionQty * discussionRate;
  const setupCleanupCost = setupCleanupQty * setupCleanupRate;
  const contentCreationCost = contentCreationQty * contentCreationRate;
  const editingCost = editingQty * editingRate;
  const servicesSubtotal =
    discussionCost + setupCleanupCost + contentCreationCost + editingCost;

  const cumLubeTotal = PRICING.LUBE_COST * cumLubeQty;
  const condomTotal = PRICING.CONDOM_COST * condomQty;
  const pantyhoseTotal = PRICING.PANTYHOSE_COST * pantyhoseQty;
  const customItemTotal = customItemCost * customItemQty;
  const consumablesSubtotal =
    cumLubeTotal + condomTotal + pantyhoseTotal + customItemTotal;

  const finalTotal = calculatePrice({
    discussionQty,
    prePostQty: setupCleanupQty,
    contentQty: contentCreationQty,
    editingQty,
    consumables: consumablesSubtotal,
    markupQty:
      Number(exclusiveQty) +
      Number(rushQty) +
      Number(extremeQty) +
      Number(jerkQty),
    discountQty: Number(bulkQty) + Number(easyQty) + Number(otherQty),
  });

  return (
    <div
      className="invoice"
      style={{
        border: "2px dashed white",
        fontFamily: "inherit",
        background: "#000",
        padding: "10px",
      }}
    >
      <div
        style={{
          background: "white",
          opacity: 0.9,
          border: "1px solid white",
          width: "100%",
          padding: "10px",
          boxSizing: "border-box",
        }}
      >
        <h2 style={{ color: "black", margin: "0 0 10px 0" }}>
          Lunepusa Invoice
        </h2>
        <label htmlFor="for" style={{ color: "black", marginRight: "10px" }}>
          Invoice for:
        </label>
        <select
          id="for"
          value={invoiceDescription}
          onChange={(e) => applyPreset(e.target.value)}
          style={{
            display: "inline-block",
            width: "fit-content",
            color: "black",
            fontFamily: "inherit",
          }}
        >
          {presetOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <br />
        <textarea
          style={{
            width: "80%",
            color: "black",
            marginTop: "10px",
            fontFamily: "inherit",
          }}
          rows={1}
          wrap="hard"
        ></textarea>
      </div>

      <table
        style={{ width: "100%", marginTop: "10px", borderCollapse: "collapse" }}
      >
        <colgroup>
          <col style={{ width: "45%" }} />
          <col style={{ width: "calc(55% / 3)" }} />
          <col style={{ width: "calc(55% / 3)" }} />
          <col style={{ width: "calc(55% / 3)" }} />
        </colgroup>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #fff" }}>
            <th>Service</th>
            <th>$ per min</th>
            <th># of min</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>⏬Discussion</td>
            <td>${discussionRate.toFixed(2)}</td>
            <td>
              <input
                type="number"
                step={15}
                value={discussionQty}
                onChange={(e) => setDiscussionQty(e.target.value)}
                style={{
                  width: "50px",
                  background: "#222",
                  color: "#fff",
                  border: "1px solid #fff",
                }}
              />
            </td>
            <td>${discussionCost.toFixed(2)}</td>
          </tr>
          <tr>
            <td>⏬Set up & Clean up</td>
            <td>${setupCleanupRate.toFixed(2)}</td>
            <td>
              <input
                type="number"
                step={15}
                value={setupCleanupQty}
                onChange={(e) => setSetupCleanupQty(e.target.value)}
                style={{
                  width: "50px",
                  background: "#222",
                  color: "#fff",
                  border: "1px solid #fff",
                }}
              />
            </td>
            <td>${setupCleanupCost.toFixed(2)}</td>
          </tr>
          <tr>
            <td>⏬Content Creation</td>
            <td>${contentCreationRate.toFixed(2)}</td>
            <td>
              <input
                type="number"
                step={5}
                value={contentCreationQty}
                onChange={(e) => setContentCreationQty(e.target.value)}
                style={{
                  width: "50px",
                  background: "#222",
                  color: "#fff",
                  border: "1px solid #fff",
                }}
              />
            </td>
            <td>${contentCreationCost.toFixed(2)}</td>
          </tr>
        </tbody>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #fff" }}>
            <th style={{ paddingTop: "15px" }}>Consumables</th>
            <th style={{ paddingTop: "15px" }}>Cost/Item</th>
            <th style={{ paddingTop: "15px" }}>Quantity</th>
            <th style={{ paddingTop: "15px" }}>Cost</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Cum Lube</td>
            <td>${PRICING.LUBE_COST.toFixed(2)}</td>
            <td>
              <input
                type="number"
                value={cumLubeQty}
                onChange={(e) => setCumLubeQty(e.target.value)}
                style={{
                  width: "50px",
                  background: "#222",
                  color: "#fff",
                  border: "1px solid #fff",
                }}
              />
            </td>
            <td>${cumLubeTotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td>
              <input
                type="text"
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                placeholder="Custom Item"
                style={{
                  width: "90%",
                  background: "#222",
                  color: "#fff",
                  border: "1px solid #fff",
                  fontFamily: "inherit",
                }}
              />
            </td>
            <td>
              <input
                type="number"
                value={customItemCost}
                onChange={(e) => setCustomItemCost(e.target.value)}
                placeholder="0.00"
                style={{
                  width: "50px",
                  background: "#222",
                  color: "#fff",
                  border: "1px solid #fff",
                }}
              />
            </td>
            <td>
              <input
                type="number"
                value={customItemQty}
                onChange={(e) => setCustomItemQty(e.target.value)}
                style={{
                  width: "50px",
                  background: "#222",
                  color: "#fff",
                  border: "1px solid #fff",
                }}
              />
            </td>
            <td>${customItemTotal.toFixed(2)}</td>
          </tr>
          <tr style={{ background: "white", opacity: 0.9 }}>
            <td
              colSpan="4"
              style={{
                color: "black",
                fontSize: ".9em",
                textAlign: "center",
                border: "2px solid black",
                padding: "5px",
                fontFamily: "inherit",
              }}
            >
              Services & Consumables Subtotal: $
              {(servicesSubtotal + consumablesSubtotal).toFixed(2)}
            </td>
          </tr>
        </tbody>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #fff" }}>
            <th style={{ paddingTop: "15px" }}>Modifiers</th>
            <th style={{ paddingTop: "15px" }}>% Base</th>
            <th style={{ paddingTop: "15px" }}>Quantity</th>
            <th style={{ paddingTop: "15px" }}>Applied</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Exclusive</td>
            <td>{PRICING.MARKUP_RATE * 100}%</td>
            <td>
              <input
                type="number"
                value={exclusiveQty}
                onChange={(e) => setExclusiveQty(e.target.value)}
                style={{
                  width: "50px",
                  background: "#222",
                  color: "#fff",
                  border: "1px solid #fff",
                }}
              />
            </td>
            <td>(+)</td>
          </tr>
          <tr>
            <td>Extreme/Taboo</td>
            <td>{PRICING.MARKUP_RATE * 100}%</td>
            <td>
              <input
                type="number"
                value={extremeQty}
                onChange={(e) => setExtremeQty(e.target.value)}
                style={{
                  width: "50px",
                  background: "#222",
                  color: "#fff",
                  border: "1px solid #fff",
                }}
              />
            </td>
            <td>(+)</td>
          </tr>
          <tr>
            <td>Easy</td>
            <td>{PRICING.DISCOUNT_RATE * 100}%</td>
            <td>
              <input
                type="number"
                value={easyQty}
                onChange={(e) => setEasyQty(e.target.value)}
                style={{
                  width: "50px",
                  background: "#222",
                  color: "#fff",
                  border: "1px solid #fff",
                }}
              />
            </td>
            <td>(-)</td>
          </tr>
        </tbody>
      </table>

      <table
        style={{ border: "5px double white", width: "100%", marginTop: "15px" }}
      >
        <tbody>
          <tr style={{ background: "white", opacity: 0.9 }}>
            <td
              colSpan="4"
              style={{
                color: "black",
                fontSize: "1.5em",
                textAlign: "center",
                fontWeight: "bold",
                padding: "10px",
              }}
            >
              Final Total: ${finalTotal.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// MICRO-COMPONENTS (For Custom Quiz)
// ──────────────────────────────────────────────────────────────────────────────
function TabButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "10px",
        background: active ? "#fff" : "transparent",
        color: active ? "#000" : "#ccc",
        border: "1px solid #fff",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "0.9em",
        textTransform: "uppercase",
        letterSpacing: "1px",
        fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  );
}
function SelectionButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 12px",
        background: active ? "#fff" : "transparent",
        color: active ? "#000" : "#ccc",
        border: `1px solid ${active ? "#fff" : "#555"}`,
        cursor: "pointer",
        fontWeight: "bold",
        flexGrow: 1,
        fontSize: "0.9em",
        fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  );
}
function KinkPill({ active, onClick, label, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "4px 8px",
        background: active ? "#fff" : "transparent",
        color: active ? "#000" : disabled ? "#444" : "#ccc",
        border: `1px solid ${active ? "#fff" : disabled ? "#444" : "#777"}`,
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: "0.8em",
        display: "inline-block",
        margin: "3px",
        fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  );
}
function ToggleRow({ active, onClick, label }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px",
        background: "transparent",
        border: `1px solid ${active ? "#fff" : "#444"}`,
        cursor: "pointer",
      }}
    >
      <span style={{ color: active ? "#fff" : "#ccc", fontSize: "0.85em" }}>
        {label}
      </span>
      <div
        style={{
          width: "36px",
          height: "18px",
          background: active ? "#fff" : "#333",
          border: "1px solid #fff",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "1px",
            left: active ? "19px" : "1px",
            width: "14px",
            height: "14px",
            background: active ? "#000" : "#aaa",
            transition: "all 0.2s",
          }}
        ></div>
      </div>
    </div>
  );
}
