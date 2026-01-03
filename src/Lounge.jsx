import React from "react";
import Auth, { useAuth, Login } from "./Auth"; // Adjust path if needed
import Collapse from "./Utility";
import Upload from "./Upload";
import Gallery from "./Gallery";

const Lounge = () => {
  const { user } = useAuth();

  return (
    <div style={{ textAlign: "center" }}>
      this is area is a work in progress where eventually it should be where you
      can view all of my content. <br />
      {!user ? (
        <div style={{ fontSize: "1.3em", textAlign: "center" }}>
          This is a private area. Log in below and subscribe to remove the blurring.
          <h5> subscription is currently a manual process. please reach out to Lune for more datails.</h5>
          <Login />
        </div>
      ) : (!is_subscriber ?(
                <div style={{ fontSize: "1em", textAlign: "center" }}>
          Welcome back, <a href="/Profile">{user.username}!</a>please subscribe to remove the blurring.
          <h5> subscription is currently a manual process. please reach out to Lune for more datails.</h5>
          <Login /> 
        </div>:
        <div style={{ fontSize: "1em", textAlign: "center", }}>
          Welcome back, <a href="/Profile">{user.username}!</a> Enjoy the exclusive content.
          <Login /> 
        </div>
      ))}
      {/* Upload section only for admin */}
      {user?.is_admin && (
        <div style={{}}>
          <Collapse trigger={<h2>Upload New Content</h2>}>
            <Upload />
          </Collapse>
        </div>
      )}
      <Gallery />
    </div>
  );
};

export default Lounge;
