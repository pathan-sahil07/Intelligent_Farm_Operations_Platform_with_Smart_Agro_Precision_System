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
    brandName: 'FarmVerse',
    brandCaption: 'Precision Farm Operations',

    // Language Toggle
    switchLang: 'हिन्दी',
    currentLang: 'English',

    // Titles & Subtitles
    loginEyebrow: 'Welcome back',
    loginTitle: 'Sign in to your workspace',
    loginDescription: 'Access real farm operations, crop stages, and precision management.',
    signupEyebrow: 'FarmVerse Registration',
    signupTitle: 'Create your workspace account',
    signupDescription: 'Join the platform to track fields, crops, and precision irrigation.',

    // Five-Phase Registration Indicators & Step Info
    phase1Title: 'Role Selection',
    phase2Title: 'Account Info',
    phase3Title: 'Farm Info',
    phase4Title: 'Professional',
    phase5Title: 'Review & Submit',
    phase1Sub: 'Select your operational role',
    phase2Sub: 'Personal login credentials',
    phase3Sub: 'Farm or territory scope',
    phase4Sub: 'Specialization & contacts',
    phase5Sub: 'Review and create account',

    // Phase 1 - Account Information
    fullNameLabel: 'Full name',
    fullNamePlaceholder: 'Your name',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@example.com',
    mobileLabel: 'Mobile number',
    mobilePlaceholder: '10-digit mobile number',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    confirmPasswordLabel: 'Confirm password',
    confirmPasswordPlaceholder: '••••••••',
    passwordStrength: 'Password strength',
    strengthWeak: 'Weak',
    strengthFair: 'Fair',
    strengthGood: 'Good',
    strengthStrong: 'Strong',
    passwordHint: 'At least 12 characters, with uppercase and lowercase letters, a number, and a special character.',

    // Phase 2 - Role Selection
    roleSelectionSubtitle: 'Select your operational FarmVerse role. Permissions are strictly verified by backend authorization.',
    roleOwnerTitle: 'Farm Owner',
    roleOwnerDesc: 'Owns and manages farm operations, capital investments, and overall land holdings.',
    roleOwnerBadge: 'Ownership',
    roleManagerTitle: 'Farm Manager',
    roleManagerDesc: 'Manages daily farm activities, equipment scheduling, and field workforce operations.',
    roleManagerBadge: 'Operations',
    roleFarmerTitle: 'Farmer',
    roleFarmerDesc: 'Manages assigned farm activities, records crop growth, and invites field workers.',
    roleFarmerBadge: 'Farm',
    roleWorkerTitle: 'Farm Worker',
    roleWorkerDesc: 'Performs assigned field activities, ground tasks, and day-to-day farm operations.',
    roleWorkerBadge: 'Field',
    errSelectRole: 'Please select a role to proceed.',

    // Phase 3 - Farm Information
    farmSectionTitle: 'Operational & Farm Details',
    farmSectionDesc: 'Provide details about your farm holdings, operational facility, or advisory region.',
    farmNameLabel: 'Farm / Estate Name',
    farmNamePlaceholder: 'e.g. Green Valley Farm',
    orgNameLabel: 'Organization / Advisory Practice Name',
    orgNamePlaceholder: 'e.g. AgroPrecision Advisory Services',
    assignedFarmLabel: 'Assigned Farm / Facility Name',
    assignedFarmPlaceholder: 'e.g. Northern Agro Station',
    adminDivLabel: 'Administrative Organization / Department',
    adminDivPlaceholder: 'e.g. FarmVerse Central Operations',
    stateLabel: 'State / Province',
    statePlaceholder: 'e.g. Maharashtra, Punjab, California',
    districtLabel: 'District / County',
    districtPlaceholder: 'e.g. Pune, Ludhiana, Fresno',
    villageLabel: 'Village / Town / Location',
    villagePlaceholder: 'e.g. Baramati, Khanna',
    farmSizeLabel: 'Total Farm / Operational Area',
    farmSizePlaceholder: 'e.g. 50',
    unitAcre: 'Acres',
    unitHectare: 'Hectares',
    ownershipTypeLabel: 'Ownership Structure',
    ownershipSole: 'Sole Owner / Individual',
    ownershipFamily: 'Family Farm',
    ownershipCoop: 'Agricultural Cooperative',
    ownershipCorp: 'Commercial Enterprise',
    errEnterFarmName: 'Enter the farm or organization name.',
    errEnterState: 'Enter your state or province.',
    errEnterDistrict: 'Enter your district.',

    // Phase 4 - Professional Information
    profSectionTitle: 'Professional Profile & Contact Preferences',
    profSectionDesc: 'Tell us about your background and how you prefer to receive operational alerts.',
    designationLabel: 'Designation / Job Title',
    designationPlaceholder: 'e.g. Chief Agronomist, Lead Grower, Operations Head',
    specializationLabel: 'Primary Agricultural Specialization',
    specGeneral: 'General Farming & Crop Production',
    specIrrigation: 'Precision Irrigation & Water Systems',
    specSoil: 'Soil Health, Nutrition & Fertilizers',
    specPest: 'Pest Management & Crop Protection',
    specHorticulture: 'Horticulture & Greenhouse Cultivation',
    specOrganic: 'Organic & Sustainable Agriculture',
    experienceLabel: 'Years of Agricultural Experience',
    expUnder2: 'Under 2 years',
    exp2to5: '2 to 5 years',
    exp5to10: '5 to 10 years',
    expOver10: 'Over 10 years',
    altContactLabel: 'Alternative Phone / Emergency Contact (Optional)',
    altContactPlaceholder: 'e.g. +91 98765 43210',
    commPrefLabel: 'Preferred Channel for Operational Alerts',
    commWhatsapp: 'WhatsApp Notifications',
    commEmail: 'Email Alerts',
    commPhone: 'Direct Phone Call',

    // Phase 5 - Review & Create Account
    reviewSectionTitle: 'Review Registration Summary',
    reviewSectionDesc: 'Confirm your details before creating your FarmVerse account. You can return to any step to make changes.',
    reviewPersonalCard: 'Personal Information',
    reviewRoleCard: 'Selected Role',
    reviewFarmCard: 'Farm & Location',
    reviewProfCard: 'Professional Profile',
    editSectionBtn: 'Edit',
    termsLabel: 'I accept the FarmVerse Terms of Service and Privacy Policy, and agree to receive operational platform notices.',
    errAcceptTerms: 'You must agree to the Terms of Service to complete registration.',
    btnPrevious: 'Previous',
    btnContinue: 'Continue',
    btnCreateAccount: 'Create FarmVerse Account',
    btnCreatingAccount: 'Creating Account…',
    jwtNotice: 'FarmVerse session authentication is issued and verified by the backend.',

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
    newToApp: 'New to FarmVerse?',
    createAccountLink: 'Create an account',
    alreadyHaveAccount: 'Already have an account?',
    signInLink: 'Sign in',

    // Validation messages
    errEnterName: 'Enter your full name.',
    errEnterEmail: 'Enter your email address.',
    errValidEmail: 'Enter a valid email address.',
    errEnterMobile: 'Enter your mobile number.',
    errValidMobile: 'Enter a valid 10-digit mobile number.',
    errEnterPassword: 'Enter your password.',
    errCreatePassword: 'Create a password.',
    errPasswordLength: 'Password must be at least 12 characters.',
    errPasswordComplexity: 'Password must include uppercase and lowercase letters, a number, and a special character, and cannot be commonly used.',
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
    msgVerifyEmail: 'Check your email for a verification link. You must verify your address before signing in.',
    msgVerifyEmailLocal: 'Account created. Open the backend terminal and use the single-use verification link printed there. Verify your email, then sign in.',
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
    brandName: 'फार्मवर्स',
    brandCaption: 'सटीक कृषि संचालन प्रणाली',

    // Language Toggle
    switchLang: 'English',
    currentLang: 'हिन्दी',

    // Titles & Subtitles
    loginEyebrow: 'पुनः स्वागत है',
    loginTitle: 'अपने कार्यक्षेत्र में साइन इन करें',
    loginDescription: 'वास्तविक कृषि संचालन, फसल चक्र और सटीक प्रबंधन तक पहुंचें।',
    signupEyebrow: 'फार्मवर्स पंजीकरण',
    signupTitle: 'अपना कार्यक्षेत्र खाता बनाएं',
    signupDescription: 'खेतों, फसलों और सटीक सिंचाई की निगरानी के लिए प्लेटफॉर्म से जुड़ें।',

    // Five-Phase Registration Indicators & Step Info
    phase1Title: 'भूमिका चयन',
    phase2Title: 'खाता विवरण',
    phase3Title: 'खेत विवरण',
    phase4Title: 'व्यावसायिक प्रोफ़ाइल',
    phase5Title: 'समीक्षा एवं पुष्टि',
    phase1Sub: 'अपनी फार्मवर्स भूमिका चुनें',
    phase2Sub: 'व्यक्तिगत लॉगिन विवरण',
    phase3Sub: 'खेत अथवा संचालन क्षेत्र',
    phase4Sub: 'विशेषज्ञता एवं संपर्क',
    phase5Sub: 'विवरण की पुष्टि करें',

    // Phase 1 - Account Information
    fullNameLabel: 'पूरा नाम',
    fullNamePlaceholder: 'आपका नाम',
    emailLabel: 'ईमेल पता',
    emailPlaceholder: 'you@example.com',
    mobileLabel: 'मोबाइल नंबर',
    mobilePlaceholder: '10 अंकों का मोबाइल नंबर',
    passwordLabel: 'पासवर्ड',
    passwordPlaceholder: '••••••••',
    confirmPasswordLabel: 'पासवर्ड की पुष्टि करें',
    confirmPasswordPlaceholder: '••••••••',
    passwordStrength: 'पासवर्ड मजबूती',
    strengthWeak: 'कमजोर',
    strengthFair: 'सामान्य',
    strengthGood: 'अच्छा',
    strengthStrong: 'मजबूत',
    passwordHint: 'कम से कम 12 वर्ण, जिनमें बड़े और छोटे अक्षर, एक अंक और एक विशेष चिह्न हो।',

    // Phase 2 - Role Selection
    roleSelectionSubtitle: 'फार्मवर्स में अपनी मुख्य भूमिका चुनें। अनुमतियाँ बैकएंड प्रमाणीकरण द्वारा सत्यापित की जाती हैं।',
    roleOwnerTitle: 'खेत मालिक (Farm Owner)',
    roleOwnerDesc: 'खेत संचालन, भूमि स्वामित्व और दीर्घकालिक निवेश का स्वामित्व एवं प्रबंधन करते हैं।',
    roleOwnerBadge: 'स्वामित्व',
    roleManagerTitle: 'फार्म प्रबंधक (Farm Manager)',
    roleManagerDesc: 'दैनिक कृषि गतिविधियों, उपकरण आवंटन और कार्यबल का संचालन करते हैं।',
    roleManagerBadge: 'संचालन',
    roleFarmerTitle: 'किसान (Farmer)',
    roleFarmerDesc: 'निर्धारित खेत गतिविधियों का प्रबंधन, फसल वृद्धि का रिकॉर्ड और खेत मजदूरों को आमंत्रित करते हैं।',
    roleFarmerBadge: 'खेत',
    roleWorkerTitle: 'खेत मजदूर (Farm Worker)',
    roleWorkerDesc: 'खेत में निर्धारित कार्य, सिंचाई संचालन और दैनिक रखरखाव कार्य करते हैं।',
    roleWorkerBadge: 'फील्ड',
    errSelectRole: 'कृपया आगे बढ़ने के लिए एक भूमिका चुनें।',

    // Phase 3 - Farm Information
    farmSectionTitle: 'खेत एवं संचालन संबंधी जानकारी',
    farmSectionDesc: 'अपने खेत, सुविधा केंद्र या सलाहकार क्षेत्र का विवरण दर्ज करें।',
    farmNameLabel: 'खेत / एस्टेट का नाम',
    farmNamePlaceholder: 'उदा. ग्रीन वैली फार्म',
    orgNameLabel: 'संगठन / परामर्श संस्था का नाम',
    orgNamePlaceholder: 'उदा. एग्रो प्रिसिजन कंसल्टेंट्स',
    assignedFarmLabel: 'आवंटित खेत / केंद्र का नाम',
    assignedFarmPlaceholder: 'उदा. उत्तरी फार्म स्टेशन',
    adminDivLabel: 'प्रशासनिक प्रभाग / मुख्यालय',
    adminDivPlaceholder: 'उदा. फार्मवर्स केंद्रीय नियंत्रण',
    stateLabel: 'राज्य / प्रांत',
    statePlaceholder: 'उदा. महाराष्ट्र, पंजाब, उत्तर प्रदेश',
    districtLabel: 'जिला',
    districtPlaceholder: 'उदा. पुणे, लुधियाना, वाराणसी',
    villageLabel: 'गाँव / कस्बा / स्थान',
    villagePlaceholder: 'उदा. बारामती, खन्ना',
    farmSizeLabel: 'कुल क्षेत्रफल / आकार',
    farmSizePlaceholder: 'उदा. 50',
    unitAcre: 'एकड़',
    unitHectare: 'हेक्टेयर',
    ownershipTypeLabel: 'स्वामित्व का प्रकार',
    ownershipSole: 'एकल स्वामित्व / व्यक्तिगत',
    ownershipFamily: 'पारिवारिक खेत',
    ownershipCoop: 'कृषि सहकारी समिति',
    ownershipCorp: 'व्यावसायिक उपक्रम',
    errEnterFarmName: 'कृपया खेत या संस्था का नाम दर्ज करें।',
    errEnterState: 'कृपया राज्य का नाम दर्ज करें।',
    errEnterDistrict: 'कृपया जिला दर्ज करें।',

    // Phase 4 - Professional Information
    profSectionTitle: 'व्यावसायिक प्रोफ़ाइल एवं संपर्क प्राथमिकताएँ',
    profSectionDesc: 'अपनी कृषि पृष्ठभूमि और अलर्ट प्राप्त करने का पसंदीदा माध्यम बताएं।',
    designationLabel: 'पदनाम / पद',
    designationPlaceholder: 'उदा. मुख्य कृषि विशेषज्ञ, फार्म हेड',
    specializationLabel: 'प्राथमिक कृषि विशेषज्ञता',
    specGeneral: 'सामान्य कृषि एवं फसल उत्पादन',
    specIrrigation: 'सटीक सिंचाई एवं जल प्रबंधन',
    specSoil: 'मृदा स्वास्थ्य, पोषण एवं उर्वरक',
    specPest: 'कीट प्रबंधन एवं फसल संरक्षण',
    specHorticulture: 'बागवानी एवं ग्रीनहाउस खेती',
    specOrganic: 'जैविक एवं टिकाऊ कृषि',
    experienceLabel: 'कृषि अनुभव (वर्षों में)',
    expUnder2: '2 वर्ष से कम',
    exp2to5: '2 से 5 वर्ष',
    exp5to10: '5 से 10 वर्ष',
    expOver10: '10 वर्ष से अधिक',
    altContactLabel: 'वैकल्पिक फोन / आपातकालीन संपर्क (वैकल्पिक)',
    altContactPlaceholder: 'उदा. +91 98765 43210',
    commPrefLabel: 'संचालन अलर्ट प्राप्त करने का माध्यम',
    commWhatsapp: 'व्हाट्सएप सूचनाएं',
    commEmail: 'ईमेल सूचनाएं',
    commPhone: 'सीधे फोन कॉल',

    // Phase 5 - Review & Create Account
    reviewSectionTitle: 'पंजीकरण सारांश की समीक्षा करें',
    reviewSectionDesc: 'खाता बनाने से पहले अपने विवरण की पुष्टि करें। संशोधन के लिए किसी भी चरण पर वापस जा सकते हैं।',
    reviewPersonalCard: 'व्यक्तिगत जानकारी',
    reviewRoleCard: 'चयनित भूमिका',
    reviewFarmCard: 'खेत एवं स्थान',
    reviewProfCard: 'व्यावसायिक प्रोफ़ाइल',
    editSectionBtn: 'संशोधन करें',
    termsLabel: 'मैं फार्मवर्स की सेवा की शर्तों और गोपनीयता नीति को स्वीकार करता/करती हूँ।',
    errAcceptTerms: 'पंजीकरण पूरा करने के लिए सेवा की शर्तों को स्वीकार करना अनिवार्य है।',
    btnPrevious: 'पिछला',
    btnContinue: 'आगे बढ़ें',
    btnCreateAccount: 'फार्मवर्स खाता बनाएं',
    btnCreatingAccount: 'खाता बनाया जा रहा है…',
    jwtNotice: 'फार्मवर्स सत्र प्रमाणीकरण बैकएंड द्वारा सुरक्षित रूप से जारी किया जाता है।',

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
    newToApp: 'फार्मवर्स में नए हैं?',
    createAccountLink: 'खाता बनाएं',
    alreadyHaveAccount: 'क्या आपके पास पहले से खाता है?',
    signInLink: 'साइन इन करें',

    // Validation messages
    errEnterName: 'कृपया अपना पूरा नाम दर्ज करें।',
    errEnterEmail: 'कृपया अपना ईमेल पता दर्ज करें।',
    errValidEmail: 'कृपया एक मान्य ईमेल पता दर्ज करें।',
    errEnterMobile: 'कृपया अपना मोबाइल नंबर दर्ज करें।',
    errValidMobile: 'कृपया एक मान्य 10-अंकीय मोबाइल नंबर दर्ज करें।',
    errEnterPassword: 'कृपया अपना पासवर्ड दर्ज करें।',
    errCreatePassword: 'कृपया एक पासवर्ड बनाएं।',
    errPasswordLength: 'पासवर्ड कम से कम 12 वर्णों का होना चाहिए।',
    errPasswordComplexity: 'पासवर्ड में बड़े और छोटे अक्षर, एक अंक और एक विशेष चिह्न होना चाहिए और यह आम पासवर्ड नहीं होना चाहिए।',
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
    msgVerifyEmail: 'सत्यापन लिंक के लिए अपना ईमेल देखें। साइन इन करने से पहले ईमेल सत्यापित करना आवश्यक है।',
    msgVerifyEmailLocal: 'खाता बन गया। बैकएंड टर्मिनल में छपे एक बार उपयोग होने वाले सत्यापन लिंक को खोलें। ईमेल सत्यापित करने के बाद साइन इन करें।',
    msgLoginSuccess: 'सफलतापूर्वक साइन इन किया गया! डैशबोर्ड खुल रहा है…',

    // Overview greeting
    goodMorning: 'शुभ प्रभात',
    goodAfternoon: 'शुभ दोपहर',
    goodEvening: 'शुभ संध्या',
    goodNight: 'शुभ रात्रि',
    farmTeam: 'कृषि टीम',
  },
} as const
