
export const openAuthPopup = (authUrl: string) => {
  // Create popup with specific features for better compatibility
  const popup = window.open(
    authUrl,
    'sso-auth',
    'width=500,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no,left=' + 
    (window.screen.width / 2 - 250) + ',top=' + (window.screen.height / 2 - 350)
  );

  if (!popup) {
    return null;
  }

  // Monitor popup for closure and focus
  popup.focus();
  
  return popup;
};

export const openLoginPopup = () => {
  const popup = window.open(
    '/',
    'happycoins-login',
    'width=500,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no,left=' + 
    (window.screen.width / 2 - 250) + ',top=' + (window.screen.height / 2 - 350)
  );

  if (!popup) {
    return null;
  }
  
  popup.focus();
  return popup;
};

export const monitorPopupClosure = (
  popup: Window,
  onClose: () => void
) => {
  const checkClosed = setInterval(() => {
    if (popup.closed) {
      clearInterval(checkClosed);
      onClose();
    }
  }, 1000);

  return checkClosed;
};
