import type { Dictionary } from './en'

/**
 * Mexican Spanish, kept deliberately plain — short sentences, no idioms,
 * "tú" rather than "usted" since this is family.
 *
 * NOT yet reviewed by a native speaker. Worth a read-through before this
 * spreads past Picks.
 */
export const es: Dictionary = {
  common: {
    save: 'Guardar',
    saving: 'Guardando…',
    cancel: 'Cancelar',
    edit: 'Editar',
    done: 'Listo',
    skip: 'Saltar',
    add: 'Agregar',
    back: 'Atrás',
  },

  person: {
    aboutMe: 'Sobre mí',
    aboutSomeone: 'Sobre {name}',
    interests: 'Intereses',
    recentActivity: 'Actividad reciente',
    location: 'Dónde vives',
    work: 'Trabajo',
    birthday: 'Cumpleaños',
    bio: 'Sobre ti',
    nothingAdded: 'Todavía no hay nada',
    bioSummary: 'Dónde vives, trabajo, cumpleaños',
    interestCount: '{count} intereses',
    interestOne: '1 interés',
    postCount: '{count} cosas recientes',
    postOne: '1 cosa reciente',
  },

  feed: {
    askedThisWeek: '{name} preguntó esta semana',
    answeredQuestion: 'contestó',
    yourTurnToAsk: 'Te toca preguntar',
    yourTurnToAskHint: 'Escoge una pregunta para la familia esta semana.',
    chooseQuestion: 'Escoger pregunta',
    weeklyQuestion: 'Esta semana',
    seeAllAnswers: 'Ver a todos',

    today: 'Hoy',
    yesterday: 'Ayer',

    emptyTitle: 'Todavía no hay nada',
    emptyHint: 'Sé el primero en contar qué estás haciendo.',
    emptyActivitiesTitle: 'No hay actividades',
    emptyActivitiesHint: 'Prueba Todas, o agrega algo que estés haciendo.',
    emptyAnswersTitle: 'Todavía no hay respuestas',
    emptyAnswersHint: 'Prueba Todas, o contesta una pregunta sobre ti.',
  },

  connect: {
    title: 'Connect',
    libraryHint: 'Todo lo que la familia ha contestado.',
    weeklyBadge: 'Pregunta de la semana',
    interestBadge: 'De tus intereses',
    filterAll: 'Todas',
    filterWeekly: 'De la semana',
    filterInterests: 'De intereses',
  },

  settings: {
    title: 'Ajustes',
    appearance: 'Apariencia',
    language: 'Idioma',
    themeNight: 'Noche',
    themeDay: 'Día',
    themeAuto: 'Auto',
    notifications: 'Notificaciones',
    notificationsHint: 'Cómo activarlas y de qué te avisamos',
    family: 'Familia',
    familyHint: 'Tu grupo familiar',
    copyInvite: 'Copiar liga de invitación',
    inviteCopied: '¡Liga copiada!',
    logOut: 'Cerrar sesión',
    loggingOut: 'Cerrando sesión…',
  },

  picks: {
    title: 'Cosas que me gustan',
    summaryNone: 'Todavía no hay nada',
    summaryOne: '1 respuesta',
    summaryMany: '{count} respuestas',

    editorIntro:
      'Estas preguntas salen de tus intereses. Contesta las que vayan contigo.',
    noInterests:
      'Primero agrega tus intereses y luego te van a salir preguntas sobre ellos.',
    addInterests: 'Agregar intereses',

    answerPlaceholder: 'Escribe tu respuesta',
    skipped: 'No es para mí',
    unskip: 'Contestar esta',
    skipThis: 'No es para mí',

    emptyOther: '{name} todavía no ha contestado ninguna.',
    emptyMine: 'Todavía no has contestado ninguna.',

    yourTurn: 'Te toca',
    promptCardHint: 'Nadie sabe esto de ti todavía.',

    feedAnswered: 'contestó',
    feedChanged: 'cambió una respuesta',

    familyTitle: 'Cosas que nos gustan',
    answeredOf: '{answered} de {total}',
    notAnsweredYet: 'No ha contestado',
    browseEmpty: 'Todavía no hay respuestas',
    browseEmptyHint: 'Cuando empiecen a contestar, aquí van a aparecer sus respuestas juntas.',
    previousQuestion: 'Pregunta anterior',
    nextQuestion: 'Siguiente pregunta',
    mine: 'Tú',
  },
}
