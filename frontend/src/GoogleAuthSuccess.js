import React, { useEffect } from 'react';

const GoogleAuthSuccess = () => {
  useEffect(() => {
    // This component handles the Google auth success redirect
    // The actual logic is in App.js handleGoogleAuthSuccess
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error) {
      // Handle error cases
      let errorMessage = 'Authentication failed';
      switch (error) {
        case 'google_auth_failed':
          errorMessage = 'Google authentication failed. Please try again.';
          break;
        case 'auth_failed':
          errorMessage = 'Authentication failed. Please check your credentials.';
          break;
        case 'insufficient_permissions':
          errorMessage = 'Your account does not have SuperAdmin permissions.';
          break;
        case 'callback_error':
          errorMessage = 'Authentication callback error. Please try again.';
          break;
        default:
          errorMessage = 'An unknown error occurred during authentication.';
      }
      
      // Redirect to login with error
      window.location.href = `/login?error=${encodeURIComponent(errorMessage)}`;
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Completing Authentication...
          </h2>
          <p className="text-gray-600">
            Please wait while we complete your Google authentication.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoogleAuthSuccess;