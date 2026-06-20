import React from "react";
import Auth, { useAuth, Login } from "src/Profile/Auth.jsx"; // Adjust path if needed
import Collapse from "src/Utility/Utility.jsx";
import Upload from "src/Lounge/upload.jsx";
import gallery from "src/Lounge/gallery.jsx";

const Lounge = () => {
    const { isSubscriber, isLoggedIn, isAdmin, user, walletBalance } = useAuth();

  return (
  <div  style={{ textAlign: "center" }}>
    <p className="notice" style={{width:"100%"}}>
    Send me a $10 tip and your username here and i will give you access for a month. </p>,
    {!user ? (
      <div style={{ fontSize: "1.3em", textAlign: "center" }}>
        This is a private area. subscribe to remove the blurring.
        <Login />
      </div>
    ) : !isSubscriber ? (
      <div style={{ fontSize: "1em", textAlign: "center" }}>
        Welcome back, <a href="/Profile">{user.username}!</a> Please subscribe to remove the blurring.
                <Login />
      </div>
    ) : (
      <div style={{ fontSize: "1em", textAlign: "center" }}>
       <p>Welcome back <a href="/Profile">{user.username}!</a> Enjoy the exclusive content.
        <Login /></p>
            {/* Upload section only for admin */}
      {user?.is_admin && (
            <Collapse trigger={<h3>Upload</h3>}>
            <Upload />
            </Collapse>
      )}
       </div>
    )}
      <gallery />
    </div>
  );
};

export default Lounge;
