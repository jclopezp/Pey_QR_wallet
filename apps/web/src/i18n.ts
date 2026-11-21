export type Locale = 'es-MX' | 'en';

const messages = {
  'es-MX': {
    'bankAccount.title': 'Cuenta para recibir pagos',
    'bankAccount.alias': 'Alias',
    'bankAccount.holderName': 'Nombre del titular',
    'bankAccount.holderType': 'Tipo de titular',
    'bankAccount.person': 'Persona',
    'bankAccount.company': 'Empresa',
    'bankAccount.clabe': 'CLABE',
    'bankAccount.submit': 'Registrar cuenta',
    'bankAccount.pending': 'Banxico está registrando tu cuenta. Puede tardar hasta 5 días hábiles.',
    'bankAccount.active': 'Tu cuenta ya puede recibir pagos.',
    'bankAccount.invalid_clabe': 'Esa CLABE no es válida. Revisa los 18 dígitos.',
    'bankAccount.invalid_input': 'Revisa los datos de la cuenta e inténtalo de nuevo.',
    'bankAccount.bank_not_supported': 'Ese banco no puede recibir CoDi. Usa otra cuenta.',
    'bankAccount.account_already_registered': 'Ya hay una cuenta registrada.',
    'bankAccount.pey_unavailable': 'No pudimos hablar con Pey. Inténtalo de nuevo.',
    'bankAccount.pey_unknown': 'No pudimos registrar la cuenta. Inténtalo de nuevo.',
    'bankAccount.unauthenticated': 'Inicia sesión para registrar la cuenta.',
    'bankAccount.business_not_found': 'Primero guarda el perfil del negocio.',
    'bankAccount.loading': 'Cargando la cuenta…',
    'bankAccount.language': 'English',
    'bankAccount.masked': 'CLABE terminación',
    'bankAccount.open': 'Registrar cuenta bancaria',
  },
  en: {
    'bankAccount.title': 'Account that receives payments',
    'bankAccount.alias': 'Alias',
    'bankAccount.holderName': 'Account holder legal name',
    'bankAccount.holderType': 'Account holder type',
    'bankAccount.person': 'Person',
    'bankAccount.company': 'Company',
    'bankAccount.invalid_clabe': 'That CLABE is not valid. Check the 18 digits.',
    'bankAccount.invalid_input': 'Check the account details and try again.',
    'bankAccount.clabe': 'CLABE',
    'bankAccount.submit': 'Register account',
    'bankAccount.pending':
      'Banxico is registering your account. This can take up to 5 business days.',
    'bankAccount.active': 'Your account can receive payments.',
    'bankAccount.bank_not_supported': 'That bank cannot receive CoDi. Use another account.',
    'bankAccount.account_already_registered': 'An account is already registered.',
    'bankAccount.pey_unavailable': 'We could not reach Pey. Try again.',
    'bankAccount.pey_unknown': 'We could not register the account. Try again.',
    'bankAccount.unauthenticated': 'Sign in to register the account.',
    'bankAccount.business_not_found': 'Save the business profile first.',
    'bankAccount.loading': 'Loading the account…',
    'bankAccount.language': 'Español',
    'bankAccount.masked': 'CLABE ending',
    'bankAccount.open': 'Register bank account',
  },
} as const;

export type MessageKey = keyof (typeof messages)['es-MX'];

export function translate(locale: Locale, key: MessageKey): string {
  return messages[locale][key];
}
