import React, { useEffect } from "react";

/**
 * FacebookConnectButton component
 * 
 * Props:
 *   - onToken: function to receive the Facebook access token string
 *   - appId: your Facebook App ID (string, required)
 *   - children: button content (optional, defaults to "Connect with Facebook")
 */
export default function FacebookConnectButton({ onToken, appId, children }) {
  useEffect(() => {
    // Only initialize if FB isn't already set up
    if (!window.FB) return;
    window.FB.init({
      appId: appId,
      cookie: true,
      xfbml: false,
      version: "v18.0",
    });
  }, [appId]);

  const handleFBLogin = () => {
    if (!window.FB) {
      alert("Facebook SDK not loaded. Please try again later.");
      return;
    }
    window.FB.login(
      function (response) {
        if (response.authResponse && response.authResponse.accessToken) {
          onToken(response.authResponse.accessToken);
        } else {
          alert("Facebook login was not successful.");
        }
      },
      { scope: "public_profile,email" }
    );
  };

  return (
    <button
      type="button"
      className="bg-blue-700 text-white px-4 py-2 rounded"
      onClick={handleFBLogin}
    >
      {children || "Connect with Facebook"}
    </button>
  );
}