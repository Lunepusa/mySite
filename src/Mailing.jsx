import React, { useState, useEffect } from "react"; // Removed unused StrictMode and useEffect
import "./styles.css";

export default function Mailing() {
  const [email, setEmail] = useState("");
  const [action, setAction] = useState("subscribe");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Replace with your actual GAS /exec URL
  const GAS_URL =
    "https://script.google.com/macros/s/AKfycby1aNJczyoL_3LqUK7ey9TNaPAjMAjvGLM1A4kFcTOMC02RmvRGsnyy5FzuWV3a39l0/exec";

  // Must match the EXPECTED_SECRET in GAS
  const SECRET = "lunepusapillowtalkmailinglist";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(GAS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          email: email.trim(),
          action: action, // 'subscribe' or 'unsubscribe'
          secret: SECRET,
        }),
      });

      // Even with text/plain, try to read the JSON response
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        // Fallback if parse fails
        result = { status: "success", message: "Submitted successfully!" };
      }

      if (result.status === "success") {
        setMessage(
          result.message ||
            (action === "subscribe"
              ? "You subscribed! Check your email for confirmation."
              : "You unsubscribed! Check your email for confirmation.")
        );
        setEmail(""); // Optional: clear form
      } else {
        setMessage("Error: " + (result.message || "Unknown error"));
      }
    } catch (err) {
      setMessage("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h1>LunePusa's Pillow Talk Mailing List</h1>
      <p>
        With the purification of the internet, I wanted to provide an
        alternative form of communication and way for you to know what I am up
        to.
        <br />I wont send emails often, but I do hope to send emails when I post
        new content anywhere with previews,or even when I am available for non
        scheduled sexting, calls, or customs!
        <br />
        ocasionally I may also send out rambles about my life or how I feel
        about something.
        <h4>
          {" "}
          <br /> So, what do you say?
        </h4>
      </p>
      <form
        onSubmit={handleSubmit}
        style={{
          verticalAlign: "middle",
          display: "inline-block",
          width: "100%",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <input
            type="radio"
            value="subscribe"
            checked={action === "subscribe"}
            onChange={(e) => setAction(e.target.value)}
            disabled={loading}
            style={{ width: "5%", verticalAlign: "middle" }}
          />
          <label for="subscribe">Join mailing list</label>
          <br />
          <label>
            <input
              type="radio"
              value="unsubscribe"
              checked={action === "unsubscribe"}
              onChange={(e) => setAction(e.target.value)}
              disabled={loading}
              style={{ width: "5%", verticalAlign: "middle" }}
            />
            Leave mailing list (do not mail)
          </label>
          <br />
        </div>
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            disabled={loading}
            style={{ width: "75%" }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ width: "25%", height: "100%", verticalAlign: "middle" }}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
        <h6>
          nsfw content will be shared to this email. by joining you agree that
          you are the only one who will see the emails sent here, and that you
          are 18+
        </h6>
        {message && <p>{message}</p>}
      </form>
    </div>
  );
}
// The compact footer component – same file, no problem
export const MailingFooter = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const GAS_URL =
    "https://script.google.com/macros/s/AKfycby1aNJczyoL_3LqUK7ey9TNaPAjMAjvGLM1A4kFcTOMC02RmvRGsnyy5FzuWV3a39l0/exec";
  const SECRET = "lunepusapillowtalkmailinglist";

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setMessage("");

    try {
      await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          email: email.trim(),
          action: "subscribe",
          secret: SECRET,
        }),
      });

      setMessage("You joined! Check your email for confirmation.");
      setEmail("");
    } catch (err) {
      setMessage("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        border: "4px double white",
        width: "100%",
        padding: "5px",
        verticalAlign: "middle",
      }}
    >
      <a href="/mailing" style={{ textAlign: "right", textDecoration: "none" }}>
        <h3>Join LunePusa's Pillow Talk Mailing List</h3>
        <h6>
          nsfw content will be shared to this email. by joining you agree that
          you are the only one who will see the emails sent here, and that you
          are 18+
        </h6>
      </a>
      <div>
        <form onSubmit={handleSubscribe}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            style={{ width: "75%", verticalAlign: "middle" }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ width: "25%", height: "100%" }}
          >
            {loading ? "Subscribing..." : "Subscribe"}
          </button>
        </form>
      </div>
      {message && <p>{message}</p>}
    </div>
  );
};
