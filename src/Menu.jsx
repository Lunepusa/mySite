import React, { useState, useEffect } from "react";
import "./styles.css"; // Your global styles untouched
import Collapse from "./Utility";
import loungepreview from "./Images/Preview/lounge.jpg";
import dmpreview from "./Images/Preview/dm.jpg";
import headerimg from "./Images/Preview/headerimg.png";
import fepreview from "./Images/Preview/FE.jpg";
import pgfepreview from "./Images/Preview/PGFE.jpg";
import custompicpreview from "./Images/Preview/custompic.jpg";
import customvidpreview from "./Images/Preview/custvid.jpg";
import gfepreview from "./Images/Preview/gfe.jpg";
import meetpreview from "./Images/Preview/Meet.jpg";
import textratepreview from "./Images/Preview/textrate.jpg";
import vidratepreview from "./Images/Preview/vidrate.jpg";
import vidcallpreview from "./Images/Preview/vidcall.png";
import sextpreview from "./Images/Preview/sext.jpg";
import { SpendFromWallet } from "./Utility";
import { useAuth, apiFetch, Login } from "./Auth";
import { ClickableTags } from "./Tags";

// ──────────────────────────────────────────────────────────────────────────────
// 1. CONTROL PANEL (VARIABLES)
// ──────────────────────────────────────────────────────────────────────────────
export const PRICING = {
  CONTENT_PERMINUTE: 3.0, 
  PREPOST_HOURLY: 20.0, 
  DISCUSSION_HOURLY: 10.0, 
  EDITING_HOURLY: 20.0, 
  LUBE_COST: 2.0,
  CONDOM_COST: 1.0,
  PANTYHOSE_COST: 5.0,
  MARKUP_RATE: 0.5,
  DISCOUNT_RATE: 0.25,
  VIDEO_MIN: 3,
  VIDEO_MAX: 15,
  PHOTO_MIN: 5,
  PHOTO_MAX: 20,
  CALL_MIN: 5,
  CALL_MAX: 30,
  SEXTING_MIN: 15,
  SEXTING_MAX: 60,
  BASE_DISCUSSION: 15, 
  BASE_SETUP_VID: 30, 
  BASE_SETUP_PIC: 15, 
  BASE_SETUP_CALL: 60, 
  BASE_SETUP_SEXT: 0, 
  BASE_SETUP_VID_RATING: 15, 
  BASE_DISC_TEXT_RATING: 30, 
  EXTRA_PREP_TAG_MINS: 30, 
};

export const BLURBS = {
  INTRO: "My content is raw, unedited, and feels like you just asked your girlfriend to do a thing for you to enjoy. No studio polish: just me, my phone, and way too many toys and lingerie.",
  CUSTOMS: "Use the builder below or DM me your fantasy. I film when the mood strikes, so there’s no set schedule or upfront payment*. I'll message you when it’s done; pay then, and then I’ll send the files, plus anything else I made if I got inspired~",
  LIVE: "I only do live calls and sexting when I can give you my full attention and really have fun. Join my VIP mailer to catch me when I'm in the mood. Payment required upfront.",
  RATING: "Detailed ratings, same-day turnaround typically. message me first to confirm. Payment required upfront.",
};

// ──────────────────────────────────────────────────────────────────────────────
// 2. THE PRICING ENGINE
// ──────────────────────────────────────────────────────────────────────────────
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
// 3. MAIN PAGE WRAPPER
// ──────────────────────────────────────────────────────────────────────────────
export default function MenuPage() {
  const { isAdmin } = useAuth();

  return (
    <div className="menu-page-wrapper">
      <div className="main-container">
        {/* Left Side: Blurbs */}
        <PublicMessage />
        
        {/* Right Side: Builder */}
        <CustomQuiz />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. PUBLIC SECTION (BLURBS)
// ──────────────────────────────────────────────────────────────────────────────
function PublicMessage() {
  // Min Calculations
  const picMin = calculatePrice({ discussionQty: PRICING.BASE_DISCUSSION, prePostQty: PRICING.BASE_SETUP_PIC, contentQty: PRICING.PHOTO_MIN * 0.5 });
  const vidMin = calculatePrice({ discussionQty: PRICING.BASE_DISCUSSION, prePostQty: PRICING.BASE_SETUP_VID, contentQty: PRICING.VIDEO_MIN });
  const sextMin = calculatePrice({ discussionQty: PRICING.SEXTING_MIN * 0.5, prePostQty: PRICING.BASE_SETUP_SEXT, contentQty: PRICING.SEXTING_MIN * 0.5 });
  const callMin = calculatePrice({ discussionQty: 0, prePostQty: PRICING.BASE_SETUP_CALL, contentQty: PRICING.CALL_MIN, markupQty: 1 });
  const txtRating = calculatePrice({ discussionQty: PRICING.BASE_DISC_TEXT_RATING });
  const vidRating = calculatePrice({ discussionQty: PRICING.BASE_DISCUSSION, prePostQty: PRICING.BASE_SETUP_VID_RATING, contentQty: 5, markupQty: 1, discountQty: 1 });

  // Max Calculations (Assuming max of 2 extra prep tags for calculation purposes)
  const maxExtraPrepTime = 2 * PRICING.EXTRA_PREP_TAG_MINS;
  const picMax = calculatePrice({ discussionQty: PRICING.BASE_DISCUSSION, prePostQty: PRICING.BASE_SETUP_PIC + maxExtraPrepTime, contentQty: PRICING.PHOTO_MAX * 0.5, markupQty: 1 });
  const vidMax = calculatePrice({ discussionQty: PRICING.BASE_DISCUSSION, prePostQty: PRICING.BASE_SETUP_VID + maxExtraPrepTime, contentQty: PRICING.VIDEO_MAX, markupQty: 1 });
  const sextMax = calculatePrice({ discussionQty: PRICING.SEXTING_MIN * 0.5, prePostQty: PRICING.BASE_SETUP_SEXT + maxExtraPrepTime, contentQty: PRICING.SEXTING_MAX * 0.5, markupQty: 1 });
  const callMax = calculatePrice({ discussionQty: 0, prePostQty: PRICING.BASE_SETUP_CALL + maxExtraPrepTime, contentQty: PRICING.CALL_MAX, markupQty: 1 });

  return (
    <section className="menu-section">
      <h1>Menu</h1>
      <p>{BLURBS.INTRO}</p>

      {/* ITEM 1: CUSTOMS */}
      <div className="menu-item">
        <div className="menu-header">
          <span className="summary-title">Customs</span>
          <span className="summary-price">pics: ${picMin} - ${picMax}<br /> vids: ${vidMin} - ${vidMax}</span>
        </div>
        <div className="menu-flex">
          <img src={customvidpreview} alt="Customs Preview" className="preview-img" />
          <div className="text-container">
            <p>{BLURBS.CUSTOMS}</p>
          </div>
        </div>
      </div>

      {/* ITEM 2: RATINGS */}
      <div className="menu-item">
        <div className="menu-header">
          <span className="summary-title">Ratings</span>
          <span className="summary-price">text: ${txtRating}<br /> vid: ${vidRating}</span>
        </div>
        <div className="menu-flex">
          <div className="text-container">
            <p>{BLURBS.RATING}</p>
          </div>
          <img src={dmpreview} alt="Ratings Preview" className="preview-img" />
        </div>
      </div>

      {/* ITEM 3: LIVE */}
      <div className="menu-item">
        <div className="menu-header">
          <span className="summary-title">Live</span>
          <span className="summary-price">sexting: ${sextMin} - ${sextMax}<br /> calls: ${callMin} - ${callMax}+</span>
        </div>
        <div className="menu-flex">
          <img src={vidratepreview} alt="Live Preview" className="preview-img" />
          <div className="text-container">
            <p>{BLURBS.LIVE}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. THE BUILDER QUIZ
// ──────────────────────────────────────────────────────────────────────────────
function CustomQuiz() {
  const { isLoggedIn, savedPairs } = useAuth();
  const hasEmail = savedPairs && savedPairs.some((pair) => pair.platform && pair.platform.toLowerCase() === "email");

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
    "Specific Toy", "Specific Outfit", "Roleplay", "Femdom (I Dominate)", "Doggystyle",
    "Ramblefap", "Realistic Toy", "Fantasy Toy", "Vibrator", "Lingerie", "Day Clothes",
    "Nude", "Submissive (I Submit)", "Humiliation", "Pegging / Strap-On", "Riding",
    "Missionary", "Blowjob", "Tit Job", "Edging", "Teasing",
  ];

  const prepActivities = [
    "Extra Camera Angle", "Bondage", "Piss", "Anal", "Fake Cum", "oil",
    "Editing", "Custom Editing", "Sex Machine",
  ];

  // --- DYNAMIC CONTENT LIMITS ---
  let contentMinutes = quantity;
  if (subType === "photo") contentMinutes = quantity * 0.5;
  if (subType === "sexting") contentMinutes = quantity * 0.5;
  if (category === "rating") contentMinutes = 5;

  const maxKinks = Math.max(2, Math.floor(contentMinutes / 2.5));
  const currentKinksCount = selectedPrep.length + selectedStandard.length;

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    if (cat === "custom") { setSubType("video"); setQuantity(PRICING.VIDEO_MIN); }
    if (cat === "rating") { setSubType("text"); setQuantity(1); }
    if (cat === "live") { setSubType("call"); setQuantity(PRICING.CALL_MIN); }
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
    if (selectedStandard.includes("Specific Outfit")) prompts.push("What exact outfit are you picturing?");
    if (selectedStandard.includes("Specific Toy")) prompts.push("Which specific toy should I use?");
    if (selectedStandard.includes("Roleplay")) prompts.push("What is the scenario/setting?");
    if (selectedStandard.includes("Femdom (I Dominate)") || selectedStandard.includes("Humiliation"))
      prompts.push("What rules or instructions do you want me to give you?");
    if (prompts.length === 1) return "Describe your fantasy... What should I wear? What exactly do you want to happen?";
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

    if (category === "rating") {
      if (subType === "text") {
        discussion = PRICING.BASE_DISC_TEXT_RATING; setup = 0; content = 0;
      } else if (subType === "vid_rating") {
        discussion = PRICING.BASE_DISCUSSION; setup = PRICING.BASE_SETUP_VID_RATING;
        content = 5; markups = 1; discounts = 1; 
      }
    } else if (category === "live") {
      if (subType === "call") {
        discussion = 0; setup = PRICING.BASE_SETUP_CALL; content = quantity; markups = 1;
      } else if (subType === "sexting") {
        discussion = quantity * 0.5; setup = PRICING.BASE_SETUP_SEXT; content = quantity * 0.5;
      }
    } else {
      if (subType === "photo") { setup = PRICING.BASE_SETUP_PIC; content = quantity * 0.5; }
      if (isExclusive) markups += 1;
    }

    setup += selectedPrep.length * PRICING.EXTRA_PREP_TAG_MINS;

    const finalEstimate = calculatePrice({
      discussionQty: discussion, prePostQty: setup, contentQty: content,
      markupQty: markups, discountQty: discounts,
    });
    setEstimate(finalEstimate);
  }, [category, subType, quantity, isExclusive, selectedPrep.length]);

  const visibleStandard = showAllStandard ? standardActivities : standardActivities.slice(0, 5);
  const visiblePrep = showAllPrep ? prepActivities : prepActivities.slice(0, 5);

  // --- SUBMISSION STATES ---
  if (showEmailWarning) {
    return (
      <section className="builder-box" style={{ textAlign: "center" }}>
        <h2 style={{ letterSpacing: "1px" }}>⚠️ Missing Email</h2>
        <p style={{ fontSize: "1.05em", lineHeight: "1" }}>
          You don't have an email associated with your account. While it's not required, it makes it much harder for me to notify you when your content is ready or if I have questions!
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button onClick={confirmSubmit} className="btn-suggest" style={{ width: "auto" }}>Submit Anyway</button>
          <button onClick={() => setShowEmailWarning(false)} className="btn-submit" style={{ width: "auto" }}>Go Back</button>
        </div>
      </section>
    );
  }

  if (submitStatus === "custom") {
    return (
      <section className="builder-box" style={{ textAlign: "center" }}>
        <h2>Request Sent!</h2>
        <p style={{ fontSize: "1.05em", lineHeight: "1" }}>
          Thanks! I’ve added this to my queue. I’ll reach out if I have questions, and send an invoice once it's done.
        </p>
        <button onClick={() => setSubmitStatus("idle")} className="btn-suggest" style={{ width: "auto"}}>Back</button>
      </section>
    );
  }

  if (submitStatus === "suggestion") {
    const combinedTags = [...selectedStandard, ...selectedPrep].join(",");
    return (
      <section className="builder-box" style={{ textAlign: "center" }}>
        <h2>Suggestion Added!</h2>
        <p style={{ fontSize: "1.05em", lineHeight: "1" }}>
          Thanks for submitting! I use this box for inspiration. If I ever end up making this concept, you'll be the first to get an email notification!
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px",  alignItems: "center" }}>
          <button className="btn-submit">Vote on other Suggestions</button>
          <div style={{ padding: "12px", width: "100%", background: "transparent", border: "1px dashed #fff", color: "#fff", boxSizing: "border-box" }}>
            <p style={{ fontSize: "0.85em", textTransform: "uppercase" }}>See what I already have with these tags:</p>
            <ClickableTags tags={combinedTags} emptyText="No specific tags selected." />
          </div>
          <button
            onClick={() => { setSubmitStatus("idle"); setSelectedStandard([]); setSelectedPrep([]); }}
            className="btn-suggest">
          </button>
            Build Another Request
        </div>
      </section>
    );
  }

  // --- MAIN BUILDER RETURN ---
  return (
    <section className="builder-box">
      <h3 style={{ textAlign: "center", textTransform: "uppercase", letterSpacing: "1px" }}>Custom Builder</h3>

      <div style={{ display: "flex", gap: "1%"}}>
        <TabButton active={category === "custom"} onClick={() => handleCategoryChange("custom")} label="Customs" />
        <TabButton active={category === "rating"} onClick={() => handleCategoryChange("rating")} label="Ratings" />
        <TabButton active={category === "live"} onClick={() => handleCategoryChange("live")} label="Live" />
      </div>

      <div>
        <h4 style={{ textTransform: "uppercase" }}>1. Format</h4>
        <div style={{ display: "flex", gap: "1%", flexWrap: "wrap" }}>
          {category === "custom" && (
            <>
              <SelectionButton active={subType === "video"} onClick={() => handleSubTypeChange("video", PRICING.VIDEO_MIN)} label="Video" />
              <SelectionButton active={subType === "photo"} onClick={() => handleSubTypeChange("photo", PRICING.PHOTO_MIN)} label="Photo Set" />
            </>
          )}
          {category === "rating" && (
            <>
              <SelectionButton active={subType === "text"} onClick={() => handleSubTypeChange("text", 1)} label="Text Rating" />
              <SelectionButton active={subType === "vid_rating"} onClick={() => handleSubTypeChange("vid_rating", 1)} label="Video Rating" />
            </>
          )}
          {category === "live" && (
            <>
              <SelectionButton active={subType === "call"} onClick={() => handleSubTypeChange("call", PRICING.CALL_MIN)} label="Video Call" />
              <SelectionButton active={subType === "sexting"} onClick={() => handleSubTypeChange("sexting", PRICING.SEXTING_MIN)} label="Sexting" />
            </>
          )}
        </div>
      </div>

      {category !== "rating" && (
        <div className="range-row">
          <span style={{ fontWeight: "bold", minWidth: "60px", color: "#fff" }}>
            {quantity} {subType === "photo" ? "pics" : "min"}
          </span>
          <input
            type="range"
            min={subType === "photo" ? PRICING.PHOTO_MIN : subType === "video" ? PRICING.VIDEO_MIN : subType === "call" ? PRICING.CALL_MIN : PRICING.SEXTING_MIN}
            max={subType === "photo" ? PRICING.PHOTO_MAX : subType === "video" ? PRICING.VIDEO_MAX : subType === "call" ? PRICING.CALL_MAX : PRICING.SEXTING_MAX}
            step={subType === "call" ? 5 : subType === "sexting" ? 15 : 1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            style={{ flexGrow: 1,}}
          />
        </div>
      )}

      <div>
        <h4 style={{ textTransform: "uppercase" }}>Select up to {maxKinks}. ({currentKinksCount}/{maxKinks} selected</h4>
        <p style={{ fontSize: "0.85em", textTransform: "uppercase" }}>Standard (Included)</p>
        <div style={{ display: "inline-block", marginBottom: "10px" }}>
          {visibleStandard.map((kink) => (
            <KinkPill
              key={kink} label={kink}
              active={selectedStandard.includes(kink)}
              disabled={!selectedStandard.includes(kink) && currentKinksCount >= maxKinks}
              onClick={() => toggleKink(kink, "standard")}
            />
          ))}
          <button onClick={() => setShowAllStandard(!showAllStandard)} className="btn-suggest" style={{ padding: "4px 4px", width: "auto", display: "inline-block", margin: "3px" }}>
            {showAllStandard ? "Hide" : `All (${standardActivities.length})...`}
          </button>
        </div>

        <p style={{ fontSize: "0.85em", textTransform: "uppercase" }}>
          Extra Time/Setup (+${PRICING.EXTRA_PREP_TAG_MINS * (PRICING.PREPOST_HOURLY / 60)} each)
        </p>
        <div style={{ display: "inline-block" }}>
          {visiblePrep.map((kink) => (
            <KinkPill
              key={kink} label={kink}
              active={selectedPrep.includes(kink)}
              disabled={!selectedPrep.includes(kink) && currentKinksCount >= maxKinks}
              onClick={() => toggleKink(kink, "prep")}
            />
          ))}
          <button onClick={() => setShowAllPrep(!showAllPrep)} className="btn-suggest" style={{ padding: "4px 4px", width: "auto", display: "inline-block", margin: "3px" }}>
            {showAllPrep ? "Hide" : `All (${prepActivities.length})...`}
          </button>
        </div>
        <label>{getDynamicPlaceholder()}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="4"
          style={{ width: "100%", padding: "2%", background: "#111", color: "#fff", border: "1px dashed #444", resize: "vertical", boxSizing: "border-box", fontSize: "0.9em", fontFamily: "inherit" }}
        />

        <div>
          {category === "custom" && (
            <ToggleRow
              label={`Exclusive Content (+${PRICING.MARKUP_RATE * 100}% Markup, Includes Name Use)`}
              active={isExclusive}
              onClick={() => setIsExclusive(!isExclusive)}
            />
          )}
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #fff", textAlign: "center" }}>
        <p style={{ margin: "0", fontSize: "0.9em", textTransform: "uppercase" }}>Est. Total</p>
        <h2 style={{ fontSize: "2.5em" }}>${estimate.toFixed(0)}</h2>
        <p style={{ fontSize: "0.75em", color: "white", fontStyle: "italic",}}>*Subject to review and final invoice.</p>
        
        {isLoggedIn ? (
          <>
            <button 
              disabled={true} 
              className="btn-submit"
              onClick={() => handleAttemptSubmit("custom")} 
              style={category === "live" ? { background: "transparent", color: "#fff" } : {}}
            >
              {category === "live" ? "Join Priority Waitlist" : "Request this Custom"}
            </button>
            <button 
              disabled={true} 
              className="btn-suggest"
              onClick={() => handleAttemptSubmit("suggestion")} 
            >
              Add to Public Suggestion Box (Free)
            </button>
            <p style={{ fontSize: "0.85em", color: "red", fontStyle: "italic" }}>
              *Submissions are temporarily disabled while I connect the new backend!
            </p>
          </>
        ) : (
          <div style={{ padding: "4%", border: "1px dashed #777", color: "##ffffff"}}>
            <p style={{  fontSize: "0.9em" }}>Log in or create an account to submit requests and suggestions!</p>
            <button className="btn-submit" style={{ width: "auto", padding: "2%", margin: "0" }}>Sign In / Register</button>
          </div>
        )}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. MICRO-COMPONENTS
// ──────────────────────────────────────────────────────────────────────────────
function TabButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: "10px", background: active ? "#fff" : "#000", color: active ? "#000" : "#fff",
        border: "1px dashed #fff", cursor: "pointer", fontWeight: "bold", fontSize: "1rem", fontFamily: "inherit"
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
        flex: 1, padding: "8px 8px", background: active ? "#fff" : "#222", color: active ? "#000" : "#fff",
        border: `1px dashed ${active ? "#fff" : "#444"}`, cursor: "pointer", fontWeight: "bold", fontSize: "0.9rem", fontFamily: "inherit"
      }}
    >
      {label}
    </button>
  );
}

function KinkPill({ active, onClick, label, disabled }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        padding: "4px 4px", background: active ? "#fff" : disabled ? "#484444" : "#000", color: active ? "#000" : "#fff",
        border: `1px dashed ${active ? "#fff" : disabled ? "red" : "#fff"}`, textDecoration: disabled ? "line-through red" : "none",
        cursor: disabled ? "not-allowed" : "pointer", fontSize: "0.85rem", display: "inline-block", margin: "3px", fontFamily: "inherit"
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
        display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px",
        background: "#222", border: `1px dashed #444`, cursor: "pointer",
      }}
    >
      <span style={{ color: "#fff", fontSize: "0.9rem" }}>{label}</span>
      <div style={{ width: "36px", height: "18px", background: active ? "#fff" : "#333", border: "1px solid #fff", position: "relative" }}>
        <div style={{ position: "absolute", top: "1px", left: active ? "19px" : "1px", width: "14px", height: "14px", background: active ? "#000" : "#aaa", transition: "all 0.2s" }}></div>
      </div>
    </div>
  );
}