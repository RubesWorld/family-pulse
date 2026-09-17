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
  },

  settings: {
    appearance: 'Apariencia',
    language: 'Idioma',
    themeNight: 'Noche',
    themeDay: 'Día',
    themeAuto: 'Auto',
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
  },
}
