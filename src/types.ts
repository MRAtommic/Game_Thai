export type TimePeriod = 'dawn' | 'morning' | 'noon' | 'evening' | 'night';

export type WeatherType = 'clear' | 'windy' | 'rain' | 'storm';

export type EndingType = 'true' | 'normal' | 'bad';

export type FloorIndex = 0 | 1 | 2 | 3;

export type RoomId = 'outside' | 'storage' | 'room202' | 'bathroom2' | 'room204' | 'room304' | 'seven24' | 'rooftop' | 'sia_mansion';

export interface ItemDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  usable?: boolean;
  consumable?: boolean;
}

export interface ClueDef {
  id: string;
  title: string;
  detail: string;
  category: 'victim' | 'suspect' | 'occult' | 'dorm';
}

export interface DialogueChoice {
  label: string;
  nextId?: string;
  action?: () => void;
  condition?: () => boolean;
}

export interface DialogueLine {
  speaker: string;
  role: string;
  portrait: 'player' | 'uncle' | 'tom' | 'vendor' | 'worker' | 'prim' | 'narrator';
  text: string;
  choices?: DialogueChoice[];
  onFinish?: () => void;
}

export interface InteractableDef {
  id: string;
  label: string;
  floor: FloorIndex;
  room?: RoomId;
  x: number;
  range?: number;
  condition?: () => boolean;
  getLabel?: () => string;
  onInteract: () => void;
}

export interface GameFlags {
  talkedToUncleIntro: boolean;
  gotRoom202Key: boolean;
  checkedMailbox: boolean;
  mailboxUnlocked: boolean;
  gotStorageKey: boolean;
  storageUnlocked: boolean;
  gaveUncleCoffee: boolean;
  uncleSecretRevealed: boolean;
  offeredRedFanta: boolean;
  sawBathroomGhost: boolean;
  confrontedTomDay: boolean;
  confrontedTomNight: boolean;
  breakerTripped: boolean;
  breakerFixedCount: number;
  gotHolyThread: boolean;
  gotScrewdriver: boolean;
  room204BoxUnlocked: boolean;
  checkedRoom304Chair: boolean;
  gotCctvCard: boolean;
  gotPrimDiary: boolean;
  gotVoiceRecorder: boolean;
  gotTalisman: boolean;
  unlockedFloor3: boolean;
  unlockedRoom304: boolean;
  insideRoom304: boolean;
  endingReached: EndingType | null;
  talkedWinMoto?: boolean;
  checkedLaundry?: boolean;
  checkedPoliceBox?: boolean;
  checkedCanalBridge?: boolean;
  talkedElectrician?: boolean;
  playedBasketball?: boolean;
  unlockedRooftop?: boolean;
  checkedRooftop?: boolean;
  fixedGeneratorMiniGame?: boolean;
  uncleTrueConfession?: boolean;
  uncoveredDoubleTwist?: boolean;
  gotMansionEv1?: boolean;
  gotMansionEv2?: boolean;
  gotMansionEv3?: boolean;
  arrestedSia?: boolean;
}

export interface SaveState {
  version: number;
  gameMinutes: number; // 0..1440 (minutes in day)
  day: number;
  weather: WeatherType;
  floor: FloorIndex;
  x: number;
  sanity: number;
  flashlightOn: boolean;
  inventory: string[];
  clues: string[];
  flags: GameFlags;
}
