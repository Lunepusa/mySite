// A shared dictionary of minimal codes mapped to user-friendly messages
const ERROR_DICTIONARY = {
  'AUTH_FAILED': { title: 'Access Denied', message: 'You need to be logged in to do this.', fixer: 'user' },
  'BAD_INPUT': { title: 'Invalid Data', message: 'Please check what you entered and try again.', fixer: 'user' },
  'DB_TIMEOUT': { title: 'Database Timeout', message: 'The database took too long to respond.', fixer: 'cloudflare' },
  'NETWORK_DOWN': { title: 'Network Disconnected', message: 'Please check your internet connection.', fixer: 'user' },
  'UNKNOWN': { title: 'Unexpected Error', message: 'Something Broke. Tell Lune what you were doing and when and how it broke.', fixer: 'developer' },
  'BAD_CODE': { title: 'Unexpected Error', message: 'Something Broke. Tell Lune what you were doing and when and how it broke.', fixer: 'developer' },
};

export function apiError(errorCode, rawErrorDetails = null, username = 'anonymous') {
  const errorProfile = ERROR_DICTIONARY[errorCode] || ERROR_DICTIONARY['UNKNOWN'];
  
  const response = {
    title: errorProfile.title,
    message: errorProfile.message,
    fixer: errorProfile.fixer
  };

  // Safe lowercase check for the debug override
  const currentUser = username ? username.toLowerCase() : 'anonymous';
  if (currentUser === 'lunepusa' && rawErrorDetails) {
    response.rawError = rawErrorDetails;
  }

  return response;
}

export function browserError(errorObj) {
  if (!errorObj) return 'UNKNOWN';
  
  const errorName = errorObj.name;
  if (errorName === 'TypeError' || errorName === 'ReferenceError' || errorName === 'SyntaxError') {
    return 'BAD_CODE'; 
  } 
  if (errorName === 'QuotaExceededError' || errorName === 'SecurityError') {
    return 'BROWSER_LIMIT'; 
  }
  return 'UNKNOWN';
}