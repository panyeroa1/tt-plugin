
export type AppMode = "idle" | "speaking" | "listening";
export type ListenPreference = "raw" | "translated";
export type AudioSource = "mic" | "system";

export type EmotionType = "neutral" | "joy" | "sadness" | "anger" | "fear" | "calm" | "excited";

export interface SpeakerInfo {
  userId: string;
  userName: string;
  sessionId: string;
  since: number;
}

export interface QueueEntry {
  userId: string;
  userName: string;
  requestedAt: number;
}

export interface RoomState {
  activeSpeaker: SpeakerInfo | null;
  raiseHandQueue: QueueEntry[];
  lockVersion: number;
}

export interface Caption {
  id: string;
  text: string;
  sourceLang: string;
  speakerUserId: string;
  speakerName: string;
  timestamp: number;
  isFinal: boolean;
  emotion?: EmotionType;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface TranslationResult {
  translatedText: string;
  detectedLanguage: string;
  emotion: EmotionType;
  pronunciationGuide: string;
}

export const AUTO_DETECT: Language = { code: 'auto', name: 'Auto Detect', flag: '✨' };

export const LANGUAGES: Language[] = [
  AUTO_DETECT,

  // --- English World ---
  { code: 'en-US', name: 'English (United States)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (United Kingdom)', flag: '🇬🇧' },
  { code: 'en-CA', name: 'English (Canada)', flag: '🇨🇦' },
  { code: 'en-AU', name: 'English (Australia)', flag: '🇦🇺' },
  { code: 'en-NZ', name: 'English (New Zealand)', flag: '🇳🇿' },
  { code: 'en-IE', name: 'English (Ireland)', flag: '🇮🇪' },
  { code: 'en-ZA', name: 'English (South Africa)', flag: '🇿🇦' },
  { code: 'en-IN', name: 'English (India)', flag: '🇮🇳' },
  { code: 'en-PH', name: 'English (Philippines)', flag: '🇵🇭' },
  { code: 'en-SG', name: 'English (Singapore)', flag: '🇸🇬' },
  { code: 'en-MY', name: 'English (Malaysia)', flag: '🇲🇾' },
  { code: 'en-HK', name: 'English (Hong Kong)', flag: '🇭🇰' },
  { code: 'en-KE', name: 'English (Kenya)', flag: '🇰🇪' },
  { code: 'en-GH', name: 'English (Ghana)', flag: '🇬🇭' },
  { code: 'en-NG', name: 'English (Nigeria)', flag: '🇳🇬' },
  { code: 'en-PK', name: 'English (Pakistan)', flag: '🇵🇰' },

  // --- Spanish World ---
  { code: 'es-ES', name: 'Spanish (Spain)', flag: '🇪🇸' },
  { code: 'es-MX', name: 'Spanish (Mexico)', flag: '🇲🇽' },
  { code: 'es-US', name: 'Spanish (United States)', flag: '🇺🇸' },
  { code: 'es-AR', name: 'Spanish (Argentina)', flag: '🇦🇷' },
  { code: 'es-BO', name: 'Spanish (Bolivia)', flag: '🇧🇴' },
  { code: 'es-CL', name: 'Spanish (Chile)', flag: '🇨🇱' },
  { code: 'es-CO', name: 'Spanish (Colombia)', flag: '🇨🇴' },
  { code: 'es-CR', name: 'Spanish (Costa Rica)', flag: '🇨🇷' },
  { code: 'es-CU', name: 'Spanish (Cuba)', flag: '🇨🇺' },
  { code: 'es-DO', name: 'Spanish (Dominican Republic)', flag: '🇩🇴' },
  { code: 'es-EC', name: 'Spanish (Ecuador)', flag: '🇪🇨' },
  { code: 'es-SV', name: 'Spanish (El Salvador)', flag: '🇸🇻' },
  { code: 'es-GT', name: 'Spanish (Guatemala)', flag: '🇬🇹' },
  { code: 'es-HN', name: 'Spanish (Honduras)', flag: '🇭🇳' },
  { code: 'es-NI', name: 'Spanish (Nicaragua)', flag: '🇳🇮' },
  { code: 'es-PA', name: 'Spanish (Panama)', flag: '🇵🇦' },
  { code: 'es-PY', name: 'Spanish (Paraguay)', flag: '🇵🇾' },
  { code: 'es-PE', name: 'Spanish (Peru)', flag: '🇵🇪' },
  { code: 'es-PR', name: 'Spanish (Puerto Rico)', flag: '🇵🇷' },
  { code: 'es-UY', name: 'Spanish (Uruguay)', flag: '🇺🇾' },
  { code: 'es-VE', name: 'Spanish (Venezuela)', flag: '🇻🇪' },

  // --- Portuguese World ---
  { code: 'pt-PT', name: 'Portuguese (Portugal)', flag: '🇵🇹' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷' },
  { code: 'pt-AO', name: 'Portuguese (Angola)', flag: '🇦🇴' },
  { code: 'pt-MZ', name: 'Portuguese (Mozambique)', flag: '🇲🇿' },

  // --- French World ---
  { code: 'fr-FR', name: 'French (France)', flag: '🇫🇷' },
  { code: 'fr-CA', name: 'French (Canada)', flag: '🇨🇦' },
  { code: 'fr-BE', name: 'French (Belgium)', flag: '🇧🇪' },
  { code: 'fr-CH', name: 'French (Switzerland)', flag: '🇨🇭' },
  { code: 'fr-LU', name: 'French (Luxembourg)', flag: '🇱🇺' },
  { code: 'fr-SN', name: 'French (Senegal)', flag: '🇸🇳' },
  { code: 'fr-CI', name: "French (Côte d'Ivoire)", flag: '🇨🇮' },

  // --- Germanic (Core) ---
  { code: 'de-DE', name: 'German (Germany)', flag: '🇩🇪' },
  { code: 'de-AT', name: 'German (Austria)', flag: '🇦🇹' },
  { code: 'de-CH', name: 'German (Switzerland)', flag: '🇨🇭' },
  { code: 'nl-NL', name: 'Dutch (Netherlands)', flag: '🇳🇱' },
  { code: 'nl-BE', name: 'Dutch (Belgium / Flemish Standard)', flag: '🇧🇪' },

  // --- Belgium Regional Languages / Dialects ---
  { code: 'vls-BE', name: 'West Flemish (Belgium)', flag: '🇧🇪' },
  { code: 'zea-BE', name: 'Zeelandic (Belgium)', flag: '🇧🇪' },
  { code: 'lim-BE', name: 'Limburgish (Belgium)', flag: '🇧🇪' },
  { code: 'wa-BE', name: 'Walloon (Belgium)', flag: '🇧🇪' },
  { code: 'de-BE', name: 'German (Belgium)', flag: '🇧🇪' },
  { code: 'pcd-BE', name: 'Picard (Belgium)', flag: '🇧🇪' },

  // --- Italy & Neighbors ---
  { code: 'it-IT', name: 'Italian (Italy)', flag: '🇮🇹' },
  { code: 'it-CH', name: 'Italian (Switzerland)', flag: '🇨🇭' },
  { code: 'rm-CH', name: 'Romansh (Switzerland)', flag: '🇨🇭' },

  // --- Nordics ---
  { code: 'sv-SE', name: 'Swedish', flag: '🇸🇪' },
  { code: 'da-DK', name: 'Danish', flag: '🇩🇰' },
  { code: 'nb-NO', name: 'Norwegian Bokmål', flag: '🇳🇴' },
  { code: 'nn-NO', name: 'Norwegian Nynorsk', flag: '🇳🇴' },
  { code: 'fi-FI', name: 'Finnish', flag: '🇫🇮' },
  { code: 'is-IS', name: 'Icelandic', flag: '🇮🇸' },
  { code: 'fo-FO', name: 'Faroese', flag: '🇫🇴' },

  // --- Western & Central Europe ---
  { code: 'ga-IE', name: 'Irish', flag: '🇮🇪' },
  { code: 'gd-GB', name: 'Scottish Gaelic', flag: '🏴' },
  { code: 'cy-GB', name: 'Welsh', flag: '🏴' },
  { code: 'br-FR', name: 'Breton', flag: '🇫🇷' },
  { code: 'eu-ES', name: 'Basque', flag: '🇪🇸' },
  { code: 'ca-ES', name: 'Catalan', flag: '🇪🇸' },
  { code: 'gl-ES', name: 'Galician', flag: '🇪🇸' },
  { code: 'oc-FR', name: 'Occitan', flag: '🇫🇷' },
  { code: 'lb-LU', name: 'Luxembourgish', flag: '🇱🇺' },
  { code: 'mt-MT', name: 'Maltese', flag: '🇲🇹' },

  // --- Balkans & Eastern Europe ---
  { code: 'pl-PL', name: 'Polish', flag: '🇵🇱' },
  { code: 'cs-CZ', name: 'Czech', flag: '🇨🇿' },
  { code: 'sk-SK', name: 'Slovak', flag: '🇸🇰' },
  { code: 'hu-HU', name: 'Hungarian', flag: '🇭🇺' },
  { code: 'ro-RO', name: 'Romanian', flag: '🇷🇴' },
  { code: 'bg-BG', name: 'Bulgarian', flag: '🇧🇬' },
  { code: 'sl-SI', name: 'Slovenian', flag: '🇸🇮' },
  { code: 'hr-HR', name: 'Croatian', flag: '🇭🇷' },
  { code: 'sr-RS', name: 'Serbian (Serbia)', flag: '🇷🇸' },
  { code: 'bs-BA', name: 'Bosnian', flag: '🇧🇦' },
  { code: 'mk-MK', name: 'Macedonian', flag: '🇲🇰' },
  { code: 'sq-AL', name: 'Albanian', flag: '🇦🇱' },
  { code: 'el-GR', name: 'Greek', flag: '🇬🇷' },
  { code: 'ru-RU', name: 'Russian', flag: '🇷🇺' },
  { code: 'uk-UA', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'be-BY', name: 'Belarusian', flag: '🇧🇾' },
  { code: 'et-EE', name: 'Estonian', flag: '🇪🇪' },
  { code: 'lv-LV', name: 'Latvian', flag: '🇱🇻' },
  { code: 'lt-LT', name: 'Lithuanian', flag: '🇱🇹' },

  // --- Caucasus & Central Asia ---
  { code: 'ka-GE', name: 'Georgian', flag: '🇬🇪' },
  { code: 'hy-AM', name: 'Armenian', flag: '🇦🇲' },
  { code: 'az-AZ', name: 'Azerbaijani', flag: '🇦🇿' },
  { code: 'kk-KZ', name: 'Kazakh', flag: '🇰🇿' },
  { code: 'ky-KG', name: 'Kyrgyz', flag: '🇰🇬' },
  { code: 'uz-UZ', name: 'Uzbek', flag: '🇺🇿' },
  { code: 'tk-TM', name: 'Turkmen', flag: '🇹🇲' },
  { code: 'tg-TJ', name: 'Tajik', flag: '🇹🇯' },

  // --- Middle East (Semitic/Iranic/Turkic) ---
  { code: 'tr-TR', name: 'Turkish', flag: '🇹🇷' },
  { code: 'he-IL', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'fa-IR', name: 'Persian (Iran)', flag: '🇮🇷' },
  { code: 'fa-AF', name: 'Dari (Afghanistan)', flag: '🇦🇫' },
  { code: 'ps-AF', name: 'Pashto (Afghanistan)', flag: '🇦🇫' },
  { code: 'ku-TR', name: 'Kurdish (Kurmanji)', flag: '🇹🇷' },
  { code: 'ckb-IQ', name: 'Kurdish (Sorani)', flag: '🇮🇶' },

  // Arabic regional variants (common)
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)', flag: '🇸🇦' },
  { code: 'ar-AE', name: 'Arabic (UAE)', flag: '🇦🇪' },
  { code: 'ar-QA', name: 'Arabic (Qatar)', flag: '🇶🇦' },
  { code: 'ar-KW', name: 'Arabic (Kuwait)', flag: '🇰🇼' },
  { code: 'ar-BH', name: 'Arabic (Bahrain)', flag: '🇧🇭' },
  { code: 'ar-OM', name: 'Arabic (Oman)', flag: '🇴🇲' },
  { code: 'ar-YE', name: 'Arabic (Yemen)', flag: '🇾🇪' },
  { code: 'ar-IQ', name: 'Arabic (Iraq)', flag: '🇮🇶' },
  { code: 'ar-JO', name: 'Arabic (Jordan)', flag: '🇯🇴' },
  { code: 'ar-LB', name: 'Arabic (Lebanon)', flag: '🇱🇧' },
  { code: 'ar-SY', name: 'Arabic (Syria)', flag: '🇸🇾' },
  { code: 'ar-EG', name: 'Arabic (Egypt)', flag: '🇪🇬' },
  { code: 'ar-SD', name: 'Arabic (Sudan)', flag: '🇸🇩' },
  { code: 'ar-DZ', name: 'Arabic (Algeria)', flag: '🇩🇿' },
  { code: 'ar-TN', name: 'Arabic (Tunisia)', flag: '🇹🇳' },
  { code: 'ar-MA', name: 'Arabic (Morocco)', flag: '🇲🇦' },

  // --- South Asia ---
  { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ur-PK', name: 'Urdu (Pakistan)', flag: '🇵🇰' },
  { code: 'ur-IN', name: 'Urdu (India)', flag: '🇮🇳' },
  { code: 'bn-BD', name: 'Bengali (Bangladesh)', flag: '🇧🇩' },
  { code: 'bn-IN', name: 'Bengali (India)', flag: '🇮🇳' },
  { code: 'pa-IN', name: 'Punjabi (India)', flag: '🇮🇳' },
  { code: 'pa-PK', name: 'Punjabi (Pakistan)', flag: '🇵🇰' },
  { code: 'gu-IN', name: 'Gujarati', flag: '🇮🇳' },
  { code: 'mr-IN', name: 'Marathi', flag: '🇮🇳' },
  { code: 'ta-IN', name: 'Tamil (India)', flag: '🇮🇳' },
  { code: 'ta-LK', name: 'Tamil (Sri Lanka)', flag: '🇱🇰' },
  { code: 'te-IN', name: 'Telugu', flag: '🇮🇳' },
  { code: 'kn-IN', name: 'Kannada', flag: '🇮🇳' },
  { code: 'ml-IN', name: 'Malayalam', flag: '🇮🇳' },
  { code: 'or-IN', name: 'Odia', flag: '🇮🇳' },
  { code: 'as-IN', name: 'Assamese', flag: '🇮🇳' },
  { code: 'ne-NP', name: 'Nepali', flag: '🇳🇵' },
  { code: 'si-LK', name: 'Sinhala', flag: '🇱🇰' },
  { code: 'my-MM', name: 'Burmese (Myanmar)', flag: '🇲🇲' },

  // --- East Asia (Sino-Tibetan, Japonic, Koreanic) ---
  { code: 'zh-Hans', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'zh-Hant', name: 'Chinese (Traditional)', flag: '🇹🇼' },
  { code: 'zh-CN', name: 'Chinese (Simplified, China)', flag: '🇨🇳' },
  { code: 'zh-SG', name: 'Chinese (Simplified, Singapore)', flag: '🇸🇬' },
  { code: 'zh-TW', name: 'Chinese (Traditional, Taiwan)', flag: '🇹🇼' },
  { code: 'zh-HK', name: 'Chinese (Traditional, Hong Kong)', flag: '🇭🇰' },
  { code: 'yue-HK', name: 'Cantonese (Hong Kong)', flag: '🇭🇰' },
  { code: 'zh-MO', name: 'Chinese (Traditional, Macau)', flag: '🇲🇴' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },

  // --- Southeast Asia ---
  { code: 'id-ID', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'jv-ID', name: 'Javanese', flag: '🇮🇩' },
  { code: 'su-ID', name: 'Sundanese', flag: '🇮🇩' },
  { code: 'ms-MY', name: 'Malay (Malaysia)', flag: '🇲🇾' },
  { code: 'ms-SG', name: 'Malay (Singapore)', flag: '🇸🇬' },
  { code: 'ms-BN', name: 'Malay (Brunei)', flag: '🇧🇳' },
  { code: 'vi-VN', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'th-TH', name: 'Thai', flag: '🇹🇭' },
  { code: 'km-KH', name: 'Khmer (Cambodia)', flag: '🇰🇭' },
  { code: 'lo-LA', name: 'Lao', flag: '🇱🇦' },
  { code: 'tl-PH', name: 'Tagalog (Filipino)', flag: '🇵🇭' },
  { code: 'fil-PH', name: 'Filipino (Standard)', flag: '🇵🇭' },

  // --- Philippines (Major Regional Languages) ---
  { code: 'ceb-PH', name: 'Cebuano', flag: '🇵🇭' },
  { code: 'ilo-PH', name: 'Ilocano', flag: '🇵🇭' },
  { code: 'hil-PH', name: 'Hiligaynon (Ilonggo)', flag: '🇵🇭' },
  { code: 'bcl-PH', name: 'Central Bikol', flag: '🇵🇭' },
  { code: 'war-PH', name: 'Waray-Waray', flag: '🇵🇭' },
  { code: 'pam-PH', name: 'Kapampangan', flag: '🇵🇭' },
  { code: 'pag-PH', name: 'Pangasinan', flag: '🇵🇭' },
  { code: 'mnd-PH', name: 'Maguindanao', flag: '🇵🇭' },
  { code: 'mrw-PH', name: 'Maranao', flag: '🇵🇭' },
  { code: 'tsg-PH', name: 'Tausug', flag: '🇵🇭' },
  { code: 'cbk-PH', name: 'Chavacano', flag: '🇵🇭' },
  { code: 'bto-PH', name: 'Rinconada Bikol', flag: '🇵🇭' },
  { code: 'krj-PH', name: 'Kinaray-a', flag: '🇵🇭' },
  { code: 'akl-PH', name: 'Aklanon', flag: '🇵🇭' },
  { code: 'msb-PH', name: 'Masbateño', flag: '🇵🇭' },
  { code: 'sur-PH', name: 'Surigaonon', flag: '🇵🇭' },

  // --- Africa (Pan) ---
  { code: 'sw-KE', name: 'Swahili (Kenya)', flag: '🇰🇪' },
  { code: 'sw-TZ', name: 'Swahili (Tanzania)', flag: '🇹🇿' },
  { code: 'am-ET', name: 'Amharic', flag: '🇪🇹' },
  { code: 'ti-ER', name: 'Tigrinya (Eritrea)', flag: '🇪🇷' },
  { code: 'ti-ET', name: 'Tigrinya (Ethiopia)', flag: '🇪🇹' },
  { code: 'ha-NG', name: 'Hausa (Nigeria)', flag: '🇳🇬' },
  { code: 'yo-NG', name: 'Yoruba (Nigeria)', flag: '🇳🇬' },
  { code: 'ig-NG', name: 'Igbo (Nigeria)', flag: '🇳🇬' },
  { code: 'zu-ZA', name: 'Zulu (South Africa)', flag: '🇿🇦' },
  { code: 'xh-ZA', name: 'Xhosa (South Africa)', flag: '🇿🇦' },
  { code: 'st-LS', name: 'Sesotho', flag: '🇱🇸' },
  { code: 'sn-ZW', name: 'Shona', flag: '🇿🇼' },
  { code: 'so-SO', name: 'Somali', flag: '🇸🇴' },
  { code: 'rw-RW', name: 'Kinyarwanda', flag: '🇷🇼' },
  { code: 'rn-BI', name: 'Kirundi', flag: '🇧🇮' },
  { code: 'mg-MG', name: 'Malagasy', flag: '🇲🇬' },
  { code: 'ny-MW', name: 'Chichewa', flag: '🇲🇼' },
  { code: 'ts-ZA', name: 'Xitsonga', flag: '🇿🇦' },
  { code: 'tn-ZA', name: 'Setswana', flag: '🇿🇦' },
  { code: 'ff-SN', name: 'Fula (Pulaar / Fulfulde)', flag: '🇸🇳' },

  // --- Cameroon (Expanded) ---
  { code: 'en-CM', name: 'English (Cameroon)', flag: '🇨🇲' },
  { code: 'fr-CM', name: 'French (Cameroon)', flag: '🇨🇲' },
  { code: 'wes-CM', name: 'Cameroon Pidgin', flag: '🇨🇲' },
  { code: 'ewo-CM', name: 'Ewondo', flag: '🇨🇲' },
  { code: 'dua-CM', name: 'Duala', flag: '🇨🇲' },
  { code: 'bas-CM', name: 'Basaa', flag: '🇨🇲' },
  { code: 'bum-CM', name: 'Bulu', flag: '🇨🇲' },
  { code: 'bkm-CM', name: 'Kom (Cameroon)', flag: '🇨🇲' },
  { code: 'fub-CM', name: 'Fulfulde (Cameroon)', flag: '🇨🇲' },

  // --- Americas (Non-English) ---
  { code: 'fr-HT', name: 'Haitian French', flag: '🇭🇹' },
  { code: 'ht-HT', name: 'Haitian Creole', flag: '🇭🇹' },
  { code: 'qu-PE', name: 'Quechua (Peru)', flag: '🇵🇪' },
  { code: 'gn-PY', name: 'Guarani (Paraguay)', flag: '🇵🇾' },
  { code: 'ay-BO', name: 'Aymara (Bolivia)', flag: '🇧🇴' },

  // --- East Africa / Horn ---
  { code: 'om-ET', name: 'Oromo (Ethiopia)', flag: '🇪🇹' },

  // --- Oceania ---
  { code: 'mi-NZ', name: 'Māori (New Zealand)', flag: '🇳🇿' },
  { code: 'sm-WS', name: 'Samoan', flag: '🇼🇸' },
  { code: 'to-TO', name: 'Tongan', flag: '🇹🇴' },
  { code: 'fj-FJ', name: 'Fijian', flag: '🇫🇯' },

  // --- Constructed / Other ---
  { code: 'eo', name: 'Esperanto', flag: '🌐' },
  { code: 'la', name: 'Latin', flag: '🌐' },
];
