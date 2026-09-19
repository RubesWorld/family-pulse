/**
 * English is the source dictionary — its shape defines the `Dictionary` type,
 * so every other locale is checked against it at compile time and a missing
 * key is a build error rather than a blank label on someone's phone.
 *
 * Ship 1 covers Picks plus the Profile settings that control language and
 * appearance. The rest of the app is still hardcoded English and will be
 * migrated into here next.
 */
export const en = {
  common: {
    save: 'Save',
    saving: 'Saving…',
    cancel: 'Cancel',
    edit: 'Edit',
    done: 'Done',
    skip: 'Skip',
    add: 'Add',
    back: 'Back',
  },

  person: {
    aboutMe: 'About me',
    aboutSomeone: 'About {name}',
    interests: 'Interests',
    recentActivity: 'Recent activity',
    location: 'Location',
    work: 'Work',
    birthday: 'Birthday',
    bio: 'Bio',
    nothingAdded: 'Nothing added yet',
    bioSummary: 'Location, work, birthday, bio',
    interestCount: '{count} interests',
    interestOne: '1 interest',
    postCount: '{count} recent posts',
    postOne: '1 recent post',
  },

  nav: {
    feed: 'Feed',
    connect: 'Connect',
    family: 'Family',
    profile: 'Profile',
    add: 'Add',
  },

  auth: {
    tagline: "See what everyone's up to — without the group chat.",
    yourName: 'Your name',
    namePlaceholder: 'What should we call you?',
    email: 'Email',
    password: 'Password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    logIn: 'Log in',
    createAccount: 'Create account',
    pleaseWait: 'Please wait…',
    newHere: 'New here?',
    alreadyHave: 'Already have an account?',
    createAccountLink: 'Create an account',

    startLine1: 'Start your',
    startLine2: 'family',
    setupHint: "Let's set up your profile and create your family.",
    nameHint: "Give it a name. You'll get an invite link to share.",
    familyName: 'Family name',
    familyNamePlaceholder: 'The Ramirez Crew, Our Family, etc.',
    createFamily: 'Create family',
    creating: 'Creating…',
    logOutStartOver: 'Log out and start over',

    invitedTo: "You're invited to",
    joinHint: "Join to see what everyone's up to and share what you're doing.",
    join: 'Join {name}',
    joining: 'Joining…',
    linkBroken: "That link didn't work",
    createOwn: 'Create your own family',
  },

  family: {
    everyone: 'Everyone',
    freshAnswers: 'Fresh answers',
    quietTitle: 'Quiet last 24 hours',
    quietHint: 'Share a favorite from your profile to get things going.',
    nothingShared: 'Nothing shared yet',
    nothingSharedHint: '{name} has not added interests or answers yet.',
    textPerson: 'Text {name}',
    text: 'Text',
    memberOne: '1 member',
    memberCount: '{count} members',
    back: 'Family',
  },

  add: {
    eyebrow: 'Share',
    titleLine1: 'What are you',
    titleLine2: 'up to?',
    thing: 'The thing',
    thingPlaceholder: 'Taking a sewing class, going to a concert…',
    tellMore: 'Tell us more',
    tellMorePlaceholder: "What's it about? Why are you doing it?",
    when: 'When',
    where: 'Where',
    wherePlaceholder: "Downtown, Mom's house, the park…",
    noteForFamily: 'Note for family',
    notePlaceholder: 'Call me if you want to join!',
    optional: 'optional',
    posting: 'Posting…',
    share: 'Share with family',
  },

  calendar: {
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    scheduledOne: '1 scheduled activity',
    scheduledCount: '{count} scheduled activities',
    nothingThisDay: 'Nothing scheduled for this day.',
    nothingScheduled: 'Nothing scheduled yet. Tap a day to add something.',
  },

  feed: {
    // Weekly-question events now flow through the feed rather than living
    // only in Connect.
    askedThisWeek: '{name} asked this week',
    answeredQuestion: 'answered',
    yourTurnToAsk: 'Your turn to ask',
    yourTurnToAskHint: 'Pick a question for the family this week.',
    chooseQuestion: 'Choose a question',
    weeklyQuestion: 'This week',
    seeAllAnswers: 'See everyone',

    invite: 'Invite',
    copied: 'Copied!',
    viewFeed: 'Feed',
    viewCalendar: 'Calendar',
    filterAll: 'All',
    filterActivities: 'Activities',
    filterAnswers: 'Answers',

    todayAt: 'Today at {time}',
    tomorrowAt: 'Tomorrow at {time}',
    yesterdayAt: 'Yesterday at {time}',
    dateFormatLong: 'EEEE, MMMM d',
    dateFormatShort: 'EEE, MMM d',
    today: 'Today',
    yesterday: 'Yesterday',

    emptyTitle: 'Nothing here yet',
    emptyHint: "Be the first to share what you're up to.",
    emptyActivitiesTitle: 'No activities',
    emptyActivitiesHint: 'Try All, or add something you are doing.',
    emptyAnswersTitle: 'No answers yet',
    emptyAnswersHint: 'Try All, or answer a question about yourself.',
  },

  connect: {
    title: 'Connect',
    libraryHint: 'Everything the family has answered.',
    weeklyBadge: 'Weekly question',
    interestBadge: 'From interests',
    filterAll: 'All',
    filterWeekly: 'Weekly',
    filterInterests: 'Interests',
  },

  connectUi: {
    noQuestionYet: 'No question yet',
    askFirst: 'Ask the first question',
    viewPast: 'View past questions',
    historyBack: 'Connect',
    historyTitle: 'Question history',
    backToConnect: 'Connect',
    noPastQuestions: 'No past questions yet',
    noPastHint: 'History shows up here once the week turns over.',
    loadingAnswers: 'Loading answers…',
    noAnswersForThis: 'No answers for this one.',
    askedBy: 'Asked by {name}',

    yourTurn: 'Your turn',
    pickThisWeek: "Pick this week's question",
    suggested: 'Suggested',
    useThisOne: 'Use this one',
    writeMyOwn: 'Write my own',
    yourQuestion: 'Your question',
    questionPlaceholder: 'What would you like to ask your family this week?',
    askThis: 'Ask this',
    setting: 'Setting…',
    enterQuestion: 'Please enter a question',
    activateFailed: 'Could not set the question. Please try again.',
  },

  history: {
    seeHistory: 'See history',
    description: 'How this has changed over time',
    now: 'Now',
    before: 'Before',
    noPrevious: 'No previous answers',
    noPreviousHint: 'This is the first one.',
    loading: 'Loading…',
    changed: 'Changed {when}',
  },

  interestsEditor: {
    choose: 'Choose an interest',
    createCustom: 'Or add your own',
    addCustom: 'Add',
    customPlaceholder: 'Name your interest',
    describe: 'What do you like about it?',
    tags: 'Tags',
    addTag: 'Add a tag…',
    specifics: 'Specifics (e.g. jazz, hiking, baking)',
    customPlaceholderEg: 'e.g. Baking, Astronomy, Yoga…',
    saveInterests: 'Save interests',
  },

  bio: {
    location: 'Where you live',
    locationPlaceholder: 'e.g. Brooklyn, NY',
    occupation: 'Work',
    occupationPlaceholder: 'e.g. Teacher',
    birthday: 'Birthday',
    phone: 'Phone number',
    phonePlaceholder: 'e.g. (555) 123-4567',
    phoneHint: 'Family can use this to text you from the app.',
    bio: 'About you',
    bioPlaceholder: 'Tell your family a bit about yourself…',
    saveProfile: 'Save profile',
  },

  notify: {
    // Enable / status
    pushTitle: 'Push notifications',
    pushOffHint: 'Get told when something happens',
    pushOn: 'On',
    enable: 'Turn on',
    disable: 'Turn off',
    enabling: 'Turning on…',
    disabling: 'Turning off…',
    notSupported: 'Push notifications are not supported',
    notSupportedHint: 'This browser cannot receive them.',
    blocked: 'Notifications are blocked',
    blockedHint: 'You blocked them. Turn them back on in your browser settings.',
    enabledTitle: 'Push notifications are on',
    enabledHint: "You'll hear about important family updates.",
    disabledTitle: 'Turn on push notifications',
    disabledHint: 'Hear when it is your turn to ask, when family answer, and more.',

    // Guide
    bestResults: 'For best results',
    tipAllow: 'Allow notifications when your phone asks',
    tipInstall:
      'Add Family Pulse to your Home Screen — required on iPhone and iPad, recommended everywhere else',
    tipClosed: 'Once installed, notifications arrive even when the app is closed',
    installedAsApp: 'Installed as an app',
    installPrompt: 'Add to Home Screen (recommended)',
    installedHint:
      "You're running the installed app, so notifications work even when it's closed. Nothing else to do.",
    installBenefits: 'Adding Family Pulse to your Home Screen gives you:',
    benefitIcon: 'An icon on your Home Screen',
    benefitFullscreen: 'Full screen, without the browser bars',
    benefitReliable: 'Notifications that arrive even when the browser is closed',
    benefitFaster: 'It opens faster',
    iosWarning:
      'iPhone and iPad: notifications only work from the installed app. Turning them on in a Safari tab will not work, whatever the tab says.',
    iosLoginWarning:
      'Heads up: the installed app has its own separate login, so you will sign in once more the first time you open it. Your account and data do not change.',
    managePreferences: 'Notification settings',
    addFirst: 'Add Family Pulse to your Home Screen first',
    addFirstHint:
      'On iPhone and iPad, notifications only work once the app is installed. They cannot be turned on from a Safari tab.',
    alreadyAdded:
      'Already added it? Make sure you opened Family Pulse from the Home Screen icon and not from Safari.',

    // Install steps
    iosLabel: 'iPhone / iPad (Safari)',
    androidLabel: 'Android (Chrome)',
    desktopLabel: 'Computer (Chrome / Edge)',

    // Settings screen
    title: 'Notifications',
    whatAbout: 'What to tell me about',
    whatAboutHint: 'Choose what you want to hear about',
    critical: 'Important',
    engagement: 'Family',
    optional: 'Everything else',
    yourTurn: 'Your turn to ask',
    yourTurnHint: 'When it is your turn to choose the weekly question',
    pendingReminder: 'Reminder to ask',
    pendingReminderHint: 'A nudge when the question is still waiting on you',
    lastToAnswer: 'Last to answer',
    lastToAnswerHint: 'When you are the only one who has not answered',
    weeklyDigest: 'Weekly summary',
    weeklyDigestHint: 'What the family did this week',
    newActivities: 'New activities',
    newActivitiesHint: 'When family share something they are doing',
    newAnswers: 'New answers',
    newAnswersHint: 'When family answer a question',
    newPicks: 'New favorites',
    newPicksHint: 'When family update what they like',
    quietHours: 'Quiet hours',
    quietHoursHint: 'Do not send anything during these hours',
    enableQuietHours: 'Turn on quiet hours',
    enableQuietHoursHint: 'Pause notifications overnight',
    startTime: 'From',
    endTime: 'Until',
    howToReach: 'How to reach me',
    howToReachHint: 'Choose how you want to be told',
    pushMethod: 'Push notifications',
    pushMethodHint: 'On this device',
    emailMethod: 'Email',
    emailMethodHint: 'Coming soon',
    smsMethod: 'Text message',
    smsMethodHint: 'Coming soon',
  },

  settings: {
    title: 'Settings',
    appearance: 'Appearance',
    language: 'Language',
    themeNight: 'Night',
    themeDay: 'Day',
    themeAuto: 'Auto',
    notifications: 'Notifications',
    notificationsHint: 'Push setup and what you get told about',
    family: 'Family',
    familyHint: 'Your family group',
    copyInvite: 'Copy invite link',
    inviteCopied: 'Link copied!',
    logOut: 'Log out',
    loggingOut: 'Logging out…',
  },

  picks: {
    title: 'Things I like',
    // Shown on the collapsed Profile section
    summaryNone: 'Nothing added yet',
    summaryOne: '1 answer',
    summaryMany: '{count} answers',

    editorIntro:
      'These come from the interests you picked. Answer the ones that fit you.',
    noInterests:
      'Add some interests first, then you will get questions about them.',
    addInterests: 'Add interests',

    answerPlaceholder: 'Type your answer',
    skipped: 'Not for me',
    unskip: 'Answer this one',
    skipThis: 'Not for me',

    emptyOther: '{name} has not answered any yet.',
    emptyMine: 'You have not answered any yet.',

    // Feed prompt card — the nudge that stops this being a form you must
    // go and find.
    yourTurn: 'Your turn',
    promptCardHint: 'Nobody knows this about you yet.',

    // Feed entries for answers other people gave
    feedAnswered: 'answered',
    feedChanged: 'changed an answer',

    // Question-first browse
    familyTitle: 'Things we like',
    answeredOf: '{answered} of {total}',
    notAnsweredYet: 'Has not answered',
    browseEmpty: 'Nothing answered yet',
    browseEmptyHint: 'Once people start answering, their answers show up here side by side.',
    previousQuestion: 'Previous question',
    nextQuestion: 'Next question',
    mine: 'You',
  },
}

// Deliberately not `as const`: that would pin each value to its literal English
// string, and every translation would fail to typecheck against it. Widened to
// `string`, the shape still enforces that no key is missing from a locale.
export type Dictionary = typeof en
