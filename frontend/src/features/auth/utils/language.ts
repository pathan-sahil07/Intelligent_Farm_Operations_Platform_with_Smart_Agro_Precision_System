export type AppLanguage = 'en' | 'hi'

const LANG_STORAGE_KEY = 'farm_ui_lang'

export function getSavedLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'en'
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY)
    if (saved === 'hi' || saved === 'en') {
      return saved
    }
  } catch (err) {
    console.warn('Could not read saved language from localStorage:', err)
  }
  return 'en'
}

export function saveLanguage(lang: AppLanguage): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang)
  } catch (err) {
    console.warn('Could not save language to localStorage:', err)
  }
}

export const AUTH_TRANSLATIONS = {
  en: {
    // Brand
    brandName: 'Fieldwise',
    brandCaption: 'Farm operations',

    // Language Toggle
    switchLang: 'हिन्दी',
    currentLang: 'English',

    // Titles & Subtitles
    loginEyebrow: 'Welcome back',
    loginTitle: 'Sign in to your workspace',
    loginDescription: 'Access real farm operations, crop stages, and precision management.',
    signupEyebrow: 'Get started',
    signupTitle: 'Create your workspace account',
    signupDescription: 'Join the platform to track fields, crops, and precision irrigation.',

    // Labels & Placeholders
    fullNameLabel: 'Full name',
    fullNamePlaceholder: 'Your name',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    confirmPasswordLabel: 'Confirm password',
    confirmPasswordPlaceholder: '••••••••',

    // Password criteria hint
    passwordHint: 'At least 8 characters, with at least one letter, one number, and one special symbol.',

    // Buttons
    signInBtn: 'Sign in',
    signingInBtn: 'Signing in…',
    signUpBtn: 'Create account',
    signingUpBtn: 'Creating account…',
    logoutBtn: 'Logout',
    loggingOutBtn: 'Logging out…',

    // Toggle password
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    showConfirmPassword: 'Show confirmation password',
    hideConfirmPassword: 'Hide confirmation password',

    // Switch between pages
    newToApp: 'New to Fieldwise?',
    createAccountLink: 'Create an account',
    alreadyHaveAccount: 'Already have an account?',
    signInLink: 'Sign in',

    // Validation messages
    errEnterName: 'Enter your full name.',
    errEnterEmail: 'Enter your email address.',
    errValidEmail: 'Enter a valid email address.',
    errEnterPassword: 'Enter your password.',
    errCreatePassword: 'Create a password.',
    errPasswordLength: 'Password must be at least 8 characters.',
    errPasswordComplexity: 'Password must include a letter, a number, and a special symbol.',
    errConfirmPassword: 'Confirm your password.',
    errPasswordMismatch: 'Passwords do not match.',
    errFixHighlighted: 'Please correct the highlighted fields.',

    // Server error messages
    errInvalidCredentials: 'Invalid email or password.',
    errAccountConflict: 'An account with this email already exists.',
    errServerConnection: 'Unable to connect to the authentication server. Please check your connection.',
    errSessionExpired: 'Your session has expired. Please sign in again.',
    errLogoutFailed: 'Failed to complete logout on the server. Please try again.',

    // Success messages
    msgAccountCreated: 'Account created successfully! Logging you in…',
    msgAccountCreatedPleaseLogin: 'Account created successfully! Please sign in.',
    msgLoginSuccess: 'Signed in successfully! Opening dashboard…',

    // Overview greeting
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    goodNight: 'Good night',
    farmTeam: 'farm team',
  },
  hi: {
    // Brand
    brandName: 'फील्डवाइज़',
    brandCaption: 'कृषि संचालन प्रणाली',

    // Language Toggle
    switchLang: 'English',
    currentLang: 'हिन्दी',

    // Titles & Subtitles
    loginEyebrow: 'पुनः स्वागत है',
    loginTitle: 'अपने कार्यक्षेत्र में साइन इन करें',
    loginDescription: 'वास्तविक कृषि संचालन, फसल चक्र और सटीक प्रबंधन तक पहुंचें।',
    signupEyebrow: 'शुरुआत करें',
    signupTitle: 'अपना कार्यक्षेत्र खाता बनाएं',
    signupDescription: 'खेतों, फसलों और सटीक सिंचाई की निगरानी के लिए प्लेटफॉर्म से जुड़ें।',

    // Labels & Placeholders
    fullNameLabel: 'पूरा नाम',
    fullNamePlaceholder: 'आपका नाम',
    emailLabel: 'ईमेल पता',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'पासवर्ड',
    passwordPlaceholder: '••••••••',
    confirmPasswordLabel: 'पासवर्ड की पुष्टि करें',
    confirmPasswordPlaceholder: '••••••••',

    // Password criteria hint
    passwordHint: 'कम से कम 8 वर्ण, जिसमें कम से कम एक अक्षर, एक अंक और एक विशेष चिह्न होना चाहिए।',

    // Buttons
    signInBtn: 'साइन इन करें',
    signingInBtn: 'साइन इन हो रहा है…',
    signUpBtn: 'खाता बनाएं',
    signingUpBtn: 'खाता बनाया जा रहा है…',
    logoutBtn: 'लॉग आउट',
    loggingOutBtn: 'लॉग आउट हो रहा है…',

    // Toggle password
    showPassword: 'पासवर्ड दिखाएं',
    hidePassword: 'पासवर्ड छिपाएं',
    showConfirmPassword: 'पुष्टि पासवर्ड दिखाएं',
    hideConfirmPassword: 'पुष्टि पासवर्ड छिपाएं',

    // Switch between pages
    newToApp: 'फील्डवाइज़ में नए हैं?',
    createAccountLink: 'खाता बनाएं',
    alreadyHaveAccount: 'क्या आपके पास पहले से खाता है?',
    signInLink: 'साइन इन करें',

    // Validation messages
    errEnterName: 'कृपया अपना पूरा नाम दर्ज करें।',
    errEnterEmail: 'कृपया अपना ईमेल पता दर्ज करें।',
    errValidEmail: 'कृपया एक मान्य ईमेल पता दर्ज करें।',
    errEnterPassword: 'कृपया अपना पासवर्ड दर्ज करें।',
    errCreatePassword: 'कृपया एक पासवर्ड बनाएं।',
    errPasswordLength: 'पासवर्ड कम से कम 8 वर्णों का होना चाहिए।',
    errPasswordComplexity: 'पासवर्ड में एक अक्षर, एक अंक और एक विशेष चिह्न अनिवार्य है।',
    errConfirmPassword: 'कृपया पासवर्ड की पुष्टि करें।',
    errPasswordMismatch: 'पासवर्ड मेल नहीं खाते हैं।',
    errFixHighlighted: 'कृपया हाइलाइट किए गए क्षेत्रों को सही करें।',

    // Server error messages
    errInvalidCredentials: 'अमान्य ईमेल या पासवर्ड।',
    errAccountConflict: 'इस ईमेल से एक खाता पहले से मौजूद है।',
    errServerConnection: 'प्रमाणीकरण सर्वर से कनेक्ट करने में असमर्थ। कृपया पुनः प्रयास करें।',
    errSessionExpired: 'आपका सत्र समाप्त हो गया है। कृपया पुनः साइन इन करें।',
    errLogoutFailed: 'सर्वर पर लॉग आउट करने में असमर्थ। कृपया पुनः प्रयास करें।',

    // Success messages
    msgAccountCreated: 'खाता सफलतापूर्वक बन गया! लॉगिन किया जा रहा है…',
    msgAccountCreatedPleaseLogin: 'खाता सफलतापूर्वक बन गया! कृपया साइन इन करें।',
    msgLoginSuccess: 'सफलतापूर्वक साइन इन किया गया! डैशबोर्ड खुल रहा है…',

    // Overview greeting
    goodMorning: 'शुभ प्रभात',
    goodAfternoon: 'शुभ दोपहर',
    goodEvening: 'शुभ संध्या',
    goodNight: 'शुभ रात्रि',
    farmTeam: 'कृषि टीम',
  },
} as const

