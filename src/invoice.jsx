import React, { useState } from "react"; // Removed unused StrictMode and useEffect
import "./styles.css";

export default function Invoice() {
  // Individual state for each service
  const [discussionQty, setDiscussionQty] = useState(0);
  const [setupCleanupQty, setSetupCleanupQty] = useState(45);
  const [contentCreationQty, setContentCreationQty] = useState(5);
  const [editingQty, setEditingQty] = useState(0);
  // Individual state for each consumable
  const [cumLubeQty, setCumLubeQty] = useState(0);
  const [condomQty, setCondomQty] = useState(0);
  const [pantyhoseQty, setPantyhoseQty] = useState(0);
  const [customItemName, setCustomItemName] = useState("Custom Item");
  const [customItemCost, setCustomItemCost] = useState(0);
  const [customItemQty, setCustomItemQty] = useState(0);

  // State for markups and discounts
  const [exclusiveQty, setExclusiveQty] = useState(1);
  const [rushQty, setRushQty] = useState(0);
  const [extremeQty, setExtremeQty] = useState(1);
  const [jerkQty, setjerkQty] = useState(0);
  const [bulkQty, setBulkQty] = useState(0);
  const [easyQty, setEasyQty] = useState(0);
  const [otherQty, setOtherQty] = useState(0);

 // State for invoice description
  const [invoiceDescription, setInvoiceDescription] = useState("5m video call");
  const presetOptions = [
    "5m Video Call",
    "Custom Photoset",
    "Custom Video",
    "Text Rating",
    "Video Rating",
    "15m Sexting Session",
    "1 week Friend Experience",
    "1 week GirlFriend Experience",
    "1 week Premium GirlFriend Experience",
    "other",
  ];
  const q15=[0,15,30,45,60,75,90,105,120]
  const q60=[190,240, 300, 360, 420, 480, 540, 600,660, 720, 780, 840, 900, 960, 1020, 1080, 1140, 1200]
  const q1=[0,1,2,3,4,5,6,7,8,9,10]
  const q5=[15,20,25,30,35,40,45,50,55,60]

  // Preset configurations for quantities
  const presetQuantities = {
    "Custom Photoset": {
      discussionQty: 15,
      setupCleanupQty: 15,
      contentCreationQty: 3,
      editingQty: 0,
      cumLubeQty: 0,
      condomQty: 0,
      pantyhoseQty: 0,
      customItemQty: 0,
      exclusiveQty: 0,
      rushQty: 0,
      extremeQty: 0,
      bulkQty: 0,
      easyQty: 0,
      otherQty: 0,
    },
    "Custom Video": {
      discussionQty: 15,
      setupCleanupQty: 30,
      contentCreationQty: 3,
      editingQty: 0,
      cumLubeQty: 0,
      condomQty: 0,
      pantyhoseQty: 0,
      customItemQty: 0,
      exclusiveQty: 0,
      rushQty: 0,
      extremeQty: 0,
      bulkQty: 0,
      easyQty: 0,
      otherQty: 0,
    },
    "Text Rating": {
      discussionQty: 30,
      setupCleanupQty: 0,
      contentCreationQty: 0,
      editingQty: 0,
      cumLubeQty: 0,
      condomQty: 0,
      pantyhoseQty: 0,
      customItemQty: 0,
      exclusiveQty: 0,
      rushQty: 0,
      extremeQty: 0,
      bulkQty: 0,
      easyQty: 0,
      otherQty: 0,
    },
    "Video Rating": {
      discussionQty: 0,
      setupCleanupQty: 30,
      contentCreationQty: 5,
      editingQty: 0,
      cumLubeQty: 2,
      condomQty: 0,
      pantyhoseQty: 0,
      customItemQty: 0,
      exclusiveQty: 1,
      rushQty: 0,
      extremeQty: 0,
      bulkQty: 0,
      easyQty: 1,
      otherQty: 0,
    },
    "15m Sexting Session": {
      discussionQty: 10,
      setupCleanupQty: 30,
      contentCreationQty: 5,
      editingQty: 0,
      cumLubeQty: 0,
      condomQty: 0,
      pantyhoseQty: 0,
      customItemQty: 0,
      exclusiveQty: 0,
      rushQty: 0,
      extremeQty: 0,
      bulkQty: 0,
      easyQty: 0,
      otherQty: 0,
    },
      "5m Video Call": {
      discussionQty: 0,
      setupCleanupQty: 45,
      contentCreationQty: 5,
      editingQty: 0,
      cumLubeQty: 0,
      condomQty: 0,
      pantyhoseQty: 0,
      customItemQty: 0,
      exclusiveQty: 1,
      rushQty: 0,
      extremeQty: 1,
      bulkQty: 0,
      easyQty: 0,
      otherQty: 0,
    },
     "1 week Friend Experience": {
      discussionQty: 300,
      setupCleanupQty: 0,
      contentCreationQty: 0,
      editingQty: 0,
      cumLubeQty: 0,
      condomQty: 0,
      pantyhoseQty: 0,
      customItemQty: 0,
      exclusiveQty: 0,
      rushQty: 0,
      extremeQty: 0,
      bulkQty: 1,
      easyQty: 1,
      otherQty: 0,
    },
   "1 week GirlFriend Experience": {
      discussionQty: 600,
      setupCleanupQty: 0,
      contentCreationQty: 10,
      editingQty: 0,
      cumLubeQty: 0,
      condomQty: 0,
      pantyhoseQty: 0,
      customItemQty: 0,
      exclusiveQty: 0,
      rushQty: 0,
      extremeQty: 0,
      bulkQty: 1,
      easyQty: 0,
      otherQty: 0,
    },
    "1 week Premium GirlFriend Experience": {
      discussionQty: 600,
      setupCleanupQty: 60,
      contentCreationQty: 180,
      editingQty: 0,
      cumLubeQty: 0,
      condomQty: 0,
      pantyhoseQty: 0,
      customItemQty: 0,
      exclusiveQty: 0,
      rushQty: 0,
      extremeQty: 0,
      bulkQty: 1,
      easyQty: 0,
      otherQty: 0,
    },
    "other": {
      discussionQty: 0,
      setupCleanupQty: 0,
      contentCreationQty: 0,
      editingQty: 0,
      cumLubeQty: 0,
      condomQty: 0,
      pantyhoseQty: 0,
      customItemQty: 0,
      exclusiveQty: 0,
      rushQty: 0,
      extremeQty: 0,
      bulkQty: 0,
      easyQty: 0,
      otherQty: 0,
    },
  };

  // Function to apply preset quantities based on input value
  const applyPreset = (value) => {
    const matchedPreset = presetOptions.find((preset) =>
      preset.toLowerCase() === value.toLowerCase()
    );
    if (matchedPreset) {
      const quantities = presetQuantities[matchedPreset] || presetQuantities["5m video call"];
      setDiscussionQty(quantities.discussionQty);
      setSetupCleanupQty(quantities.setupCleanupQty);
      setContentCreationQty(quantities.contentCreationQty);
      setEditingQty(quantities.editingQty);
      setCumLubeQty(quantities.cumLubeQty);
      setCondomQty(quantities.condomQty);
      setPantyhoseQty(quantities.pantyhoseQty);
      setCustomItemQty(quantities.customItemQty);
      setExclusiveQty(quantities.exclusiveQty);
      setRushQty(quantities.rushQty);
      setExtremeQty(quantities.extremeQty);
      setBulkQty(quantities.bulkQty);
      setEasyQty(quantities.easyQty);
      setOtherQty(quantities.otherQty);
      setInvoiceDescription(matchedPreset);
    } else {
      setInvoiceDescription(value); // Allow custom text
    }
  };


  // Calculate costs
  const discussionCost = discussionQty * 0.17;
  const setupCleanupCost = setupCleanupQty * 0.33;
  const contentCreationCost = contentCreationQty * 3;
  const editingCost = editingQty * 0.33;
  const servicesSubtotal =
    discussionCost + setupCleanupCost + contentCreationCost + editingCost;

  const cumLubeTotal = 2.0 * cumLubeQty;
  const condomTotal = 1.0 * condomQty;
  const pantyhoseTotal = 5.0 * pantyhoseQty;
  const customItemTotal = customItemCost * customItemQty;
  const consumablesSubtotal =
    cumLubeTotal + condomTotal + pantyhoseTotal + customItemTotal;
  const servicesAndSuppliesSubtotal = servicesSubtotal + consumablesSubtotal;

  const exclusiveTotal = (servicesSubtotal * 0.5 * exclusiveQty).toFixed(2);
  const rushTotal = (servicesSubtotal * 0.5 * rushQty).toFixed(2);
  const extremeTotal = (servicesSubtotal * 0.5 * extremeQty).toFixed(2);
  const jerkTotal = (servicesSubtotal * 0.5 * jerkQty).toFixed(2);
  const markupsSubtotal =
    parseFloat(exclusiveTotal) +
    parseFloat(rushTotal) +
    parseFloat(extremeTotal) +
    parseFloat(jerkTotal);

  const bulkTotal = (servicesSubtotal * 0.25 * bulkQty).toFixed(2);
  const easyTotal = (servicesSubtotal * 0.25 * easyQty).toFixed(2);
  const otherTotal = (servicesSubtotal * 0.25 * otherQty).toFixed(2);
  const discountsSubtotal =
    parseFloat(bulkTotal) + parseFloat(easyTotal) + parseFloat(otherTotal);
  const finalTotal =
    servicesAndSuppliesSubtotal +
    parseFloat(markupsSubtotal) -
    parseFloat(discountsSubtotal);

  return (
    <div className="invoice" style={{ border: "2px dashed white" }}>
      <div
        style={{
          background: "white",
          opacity: 0.9,
          border: "1px solid white",
          width: "100%",
        }}
      >
        <h2 style={{ color: "black" }}>Lunepusa Invoice</h2>
        <label htmlFor="for" style={{ color: "black" }}>
          Invoice for:
        </label>
        <select
          id="for"
          value={invoiceDescription}
          onChange={(e) => applyPreset(e.target.value)}
          style={{
            display: "inline-block",
            width: "25%",
            color: "black",
          }}>
             {presetOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
            </select><br />
            <textarea style={{width:"80%", color:"black"}} rows={1} wrap="hard"></textarea>
         
      </div>

      {/* Combined Services and Consumables Table */}
      <table>
        <colgroup>
          <col style={{ width: "50%" }} />
          <col style={{ width: "calc(50% / 3)" }} />
          <col style={{ width: "calc(50% / 3)" }} />
          <col style={{ width: "calc(50% / 3)" }} />
        </colgroup>
        <thead>
          <tr>
            <th>Service</th>
            <th>$ per minute</th>
            <th># of minutes</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="info">
              ⏬Discussion
              <div className="infotext">
                Time we spend messaging back and forth for whatever reason
              </div>
            </td>
            <td>$0.17</td>
            <td>
              <input
                type="number"
                step={15}
                value={discussionQty}
                onChange={(e) => setDiscussionQty(e.target.value)}
              /> 
            </td>
            <td>${discussionCost.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="info">
              ⏬Set up & Clean up
              <div className="infotext">
                Time spent cleaning area for filming, showering, getting
                dressed, or doing any other preporation required. Plus the time
                spent cleaning up after.
              </div>
            </td>
            <td>$0.33</td>
            <td>
              <input
                type="number"
                step={15}
                value={setupCleanupQty}
                onChange={(e) => setSetupCleanupQty(e.target.value)}
              />
            </td>
            <td>${setupCleanupCost.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="info">
              ⏬Content Creation
              <div className="infotext">time spent in front of the camera</div>
            </td>
            <td>$3.00</td>
            <td>
              <input
                type="number"
                step={5}
                value={contentCreationQty}
                onChange={(e) => setContentCreationQty(e.target.value)}
              />
            </td>
            <td>${contentCreationCost.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="info">
              ⏬ Editing
              <div className="infotext">
                time spent cutting the content into clips, combining clips into
                one, or otherwise editing the content after recording
              </div>
            </td>
            <td>$0.33</td>
            <td>
              <input
                type="number"
                step={15}
                value={editingQty}
                onChange={(e) => setEditingQty(e.target.value)}
              />
            </td>
            <td>${editingCost.toFixed(2)}</td>
          </tr>
        </tbody>
        <thead>
          <tr>
            <th className="info">
              Consumables⏬
              <div
                className="infotext"
                style={{
                  fontSize: ".8em",
                  fontWeight: "normal",
                  backgroundColor: "inherit",
                }}
              >
                Things that get used or destroyed during filming.
                <br /> Cost is the cost to replace the thing
              </div>
            </th>
            <th>Cost</th>
            <th>Quantity</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>10 ml Cum Lube</td>
            <td>$2.00</td>
            <td>
              <input
                type="number"
                value={cumLubeQty}
                onChange={(e) => setCumLubeQty(e.target.value)}
              />
            </td>
            <td>${cumLubeTotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Condom</td>
            <td>$1.00</td>
            <td>
              <input
                type="number"
                value={condomQty}
                onChange={(e) => setCondomQty(e.target.value)}
              />
            </td>
            <td>${condomTotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Pantyhose</td>
            <td>$5.00</td>
            <td>
              <input
                type="number"
                value={pantyhoseQty}
                onChange={(e) => setPantyhoseQty(e.target.value)}
              />
            </td>
            <td>${pantyhoseTotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td>
              <input
                type="text"
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                placeholder="Custom Item"
              />
            </td>
            <td>
              <input
                type="number"
                value={customItemCost}
                onChange={(e) => setCustomItemCost(e.target.value)}
                placeholder="0.00"
              />
            </td>
            <td>
              <input
                type="number"
                value={customItemQty}
                onChange={(e) => setCustomItemQty(e.target.value)}
              />
            </td>
            <td>${customItemTotal.toFixed(2)}</td>
          </tr>
          <tr
            style={{
              background: "white",
              opacity: 0.9,
            }}
          >
            <td
              colSpan="4"
              style={{
                color: "black",
                fontSize: "1em",
                textAlign: "center",
                border: "5px solid black",
              }}
            >
              Services & Consumables Subtotal: $
              {servicesAndSuppliesSubtotal.toFixed(2)}
            </td>
          </tr>
        </tbody>
        <thead>
          <tr>
            <th>Markup</th>
            <th>% of markup</th>
            <th>Quantity</th>
            <th>Markup</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="info">
              ⏬Exclusive
              <div className="infotext">
                {" "}
                you want the media I make to be only seen by you and never
                posted anywhere else(all calls must include this)
              </div>
            </td>
            <td>50%</td>
            <td>
              <input
                type="number"
                value={exclusiveQty}
                onChange={(e) => setExclusiveQty(e.target.value)}
              />
            </td>
            <td>${exclusiveTotal}</td>
          </tr>
          <tr>
            <td className="info">
              ⏬Rush
              <div className="infotext">
                you want the content to happen sooner then the time I estimated.
                this can be applied multiple times depending on the amount
                rush(if 1 estimated 1 week, 3 days may be 1 quantity, meanwhile
                1 day may be 2 quantity)
              </div>
            </td>
            <td>50%</td>
            <td>
              <input
                type="number"
                value={rushQty}
                onChange={(e) => setRushQty(e.target.value)}
              />
            </td>
            <td>${rushTotal}</td>
          </tr>
          <tr>
            <td className="info">
              ⏬Extreme/taboo/difficult
              <div className="infotext">
                The content is particularly tabboo,{" "}
                <a href="/about#collapse-lovesandlimits" target="_blank">
                  is something on my list of soft limits,
                </a>
                or otherwise is more difficult to resell such as name use.
              </div>
            </td>
            <td>50%</td>
            <td>
              <input
                type="number"
                value={extremeQty}
                onChange={(e) => setExtremeQty(e.target.value)}
              />
            </td>
            <td>${extremeTotal}</td>
          </tr>
          <tr>
            <td className="info">
              ⏬Jerk
              <div className="infotext">
                you have been a particular jerk, not reading what I have sent
                you, not respecting my stance on things, or have just been rude
                without my agreeing to that.
              </div>
            </td>
            <td>50%</td>
            <td>
              <input
                type="number"
                value={jerkQty}
                onChange={(e) => setjerkQty(e.target.value)}
              />
            </td>
            <td>${jerkTotal}</td>
          </tr>
        </tbody>
        <thead>
          <tr>
            <th>Discount</th>
            <th>% of discount</th>
            <th>Quantity</th>
            <th>discount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="info">
              ⏬Bulk
              <div className="infotext">
                You buy a lot of things at once. This can be applied multiple
                times.(all "experiences" include this by default)
              </div>
            </td>
            <td>25%</td>
            <td>
              <input
                type="number"
                value={bulkQty}
                onChange={(e) => setBulkQty(e.target.value)}
              />
            </td>
            <td>${bulkTotal}</td>
          </tr>
          <tr>
            <td className="info">
              ⏬Easy
              <div className="infotext">
                You are wanting something that is incredibly easy to do or make,
                such as a custom video of me shaking my tits.
              </div>
            </td>
            <td>25%</td>
            <td>
              <input
                type="number"
                value={easyQty}
                onChange={(e) => setEasyQty(e.target.value)}
              />
            </td>
            <td>${easyTotal}</td>
          </tr>
          <tr>
            <td className="info">
              ⏬Other
              <div className="infotext">
                Other reasons I may decide you deserve a discount, such as a
                birthday sale or whatever
              </div>
            </td>
            <td>25%</td>
            <td>
              <input
                type="number"
                value={otherQty}
                onChange={(e) => setOtherQty(e.target.value)}
              />
            </td>
            <td>${otherTotal}</td>
          </tr>
          <tr
            style={{
              background: "white",
              opacity: 0.9,
            }}
          >
            <td
              colSpan="4"
              style={{
                color: "black",
                fontSize: "1em",
                textAlign: "center",
                border: "5px solid black",
              }}
            >
              Fees & Discounts Subtotal: $
              {(markupsSubtotal - discountsSubtotal).toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Final Total */}
      <table
        style={{
          border: "10px double black",
        }}
      >
        <tbody>
          <tr
            style={{
              background: "white",
              opacity: 0.9,
            }}
          >
            <td
              colSpan="4"
              style={{
                color: "black",
                fontSize: "1em",
                textAlign: "center",
                fontWeight: "normal",
              }}
            >
              ${servicesAndSuppliesSubtotal.toFixed(2)}+$
              {(markupsSubtotal - discountsSubtotal).toFixed(2)}=$
              {finalTotal.toFixed(2)}
            </td>
          </tr>
          <tr
            style={{
              background: "white",
              opacity: 0.9,
            }}
          >
            <td
              colSpan="4"
              style={{
                color: "black",
                fontSize: "1.5em",
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              Final Total: ${(Math.floor(finalTotal / 5) * 5).toFixed(2)}
              <p
                style={{
                  color: "black",
                  fontSize: ".6em",
                  fontWeight: "normal",
                  backgroundColor: "inherit",
                }}
              >
                {" "}
                rounded down to the nearest $5
              </p>
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        No content sent until payment is sent.
        <br /> I reserve the right to refuse any request prior to payment. That
        said, am a pervert so ask.
      </p>
    </div>
  );
}
