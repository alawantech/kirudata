import React, { createContext, useContext, useState } from "react";

// Lets a screen raise the floating WhatsApp button while it shows its own
// bottom action bar (e.g. Buy Data's "Pay now" bar) so they never overlap.
const OverlayContext = createContext({ bottomInset: 0, setBottomInset: () => {} });

export function OverlayProvider({ children }) {
  const [bottomInset, setBottomInset] = useState(0);
  return (
    <OverlayContext.Provider value={{ bottomInset, setBottomInset }}>
      {children}
    </OverlayContext.Provider>
  );
}

export function useOverlay() {
  return useContext(OverlayContext);
}
