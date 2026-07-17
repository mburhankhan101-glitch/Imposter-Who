export interface WordCategory {
  category: string;
  words: string[];
}

export const WORD_BANK: WordCategory[] = [
  {
    category: "Food",
    words: [
      "Pizza",
      "Sushi",
      "Biryani",
      "Mango",
      "Ice Cream",
      "Burger",
      "Pancakes",
      "Tacos",
      "Popcorn",
      "Chocolate",
    ],
  },
  {
    category: "Animals",
    words: [
      "Elephant",
      "Penguin",
      "Kangaroo",
      "Octopus",
      "Cheetah",
      "Owl",
      "Dolphin",
      "Camel",
      "Peacock",
      "Fox",
    ],
  },
  {
    category: "Places",
    words: [
      "Beach",
      "Airport",
      "Library",
      "Mountain",
      "Hospital",
      "Stadium",
      "Museum",
      "Desert",
      "Castle",
      "Classroom",
    ],
  },
  {
    category: "Objects",
    words: [
      "Umbrella",
      "Telescope",
      "Guitar",
      "Backpack",
      "Mirror",
      "Candle",
      "Bicycle",
      "Camera",
      "Wallet",
      "Ladder",
    ],
  },
  {
    category: "Professions",
    words: [
      "Firefighter",
      "Chef",
      "Astronaut",
      "Teacher",
      "Pilot",
      "Dentist",
      "Photographer",
      "Farmer",
      "Detective",
      "Barber",
    ],
  },
];

export function pickRandomWord(): { category: string; word: string } {
  const category = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
  const word = category.words[Math.floor(Math.random() * category.words.length)];
  return { category: category.category, word };
}
