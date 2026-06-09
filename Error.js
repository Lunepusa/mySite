// A shared dictionary of minimal codes mapped to user-friendly messages
const ERROR_DICTIONARY = {
  'AUTH_FAILED': { title: 'Access Denied', message: 'You need to be logged in to do this.', fixer: 'user' },
  'BAD_INPUT': { title: 'Invalid Data', message: 'Please check your information and try again.', fixer: 'user' },
  'DB_TIMEOUT': { title: 'Database Timeout', message: 'The database took too long to respond.', fixer: 'cloudflare' },
  'NETWORK_DOWN': { title: 'Network Disconnected', message: 'Please check your internet connection.', fixer: 'user' },
  'UNKNOWN': { title: 'Unexpected Error', message: 'Something broke on our end.', fixer: 'developer' }
};

/**
 * Translates a lightweight error code into a full display object.
 * Attaches raw details only if the user is authorized.
 */
export function classifyError(errorCode, rawErrorDetails = null, username = 'anonymous') {
  // Look up the profile, default to UNKNOWN if the code isn't in the dictionary
  const errorProfile = ERROR_DICTIONARY[errorCode] || ERROR_DICTIONARY['UNKNOWN'];
  
  const response = {
    title: errorProfile.title,
    message: errorProfile.message,
    fixer: errorProfile.fixer
  };

  // Only attach the heavy data if it's LunePusa debugging
  if (username === 'LunePusa' && rawErrorDetails) {
    response.rawError = rawErrorDetails;
  }
  return response;
}