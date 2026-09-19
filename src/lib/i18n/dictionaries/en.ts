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
