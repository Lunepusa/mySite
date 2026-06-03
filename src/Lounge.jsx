import React from "react";
import Auth, { useAuth, Login } from "./Auth"; // Adjust path if needed
import Collapse from "./Utility";
import Upload from "./Upload";
import Gallery from "./Gallery";

const Lounge = () => {
    const { isSubscriber, isLoggedIn, isAdmin, user, walletBalance } = useAuth();

  return (
  <div  style={{ textAlign: "center" }}>
    <h4 class="notice" style={{width:"100%"}}>
    this is area is a work in progress, but has more of .y cobtent then anywhere else. send me a $10 tip and your username here and i will give you access for a month. </h4>,
    
    {!user ? (
      <div style={{ fontSize: "1.3em", textAlign: "center" }}>
        This is a private area. Log in below and subscribe to remove the blurring.
        <h5>subscription is currently a manual process. please reach out to Lune for more details.</h5>
        <Login />
      </div>
    ) : !isSubscriber ? (
      <div style={{ fontSize: "1em", textAlign: "center" }}>
        Welcome back, <a href="/Profile">{user.username}!</a> Please subscribe to remove the blurring.
        <h5>subscription is currently a manual process. please reach out to Lune for more details.</h5>
        <Login />
      </div>
    ) : (
      <div style={{ fontSize: "1em", textAlign: "center" }}>
       <p>Welcome back, <a href="/Profile">{user.username}!</a> Enjoy the exclusive content.
        <Login /></p>
            {/* Upload section only for admin */}
      {user?.is_admin && (
            <Upload />
      )}
       </div>
    )}
      <Gallery />
    </div>
  );
};

export default Lounge;
