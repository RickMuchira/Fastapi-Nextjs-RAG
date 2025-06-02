# speller.py
import unicodedata
import difflib
from spellchecker import SpellChecker

class SpellingCorrector:
    def __init__(self, language: str = 'en'):
        """
        Initialize the spell checker and prepare a known-word list for fallback corrections.
        :param language: Language for the dictionary (default 'en' for English).
        """
        # Primary spellchecker
        self.spell = SpellChecker(language=language)
        # Build a list of known words from the spellchecker's frequency dictionary
        self.known_words = list(self.spell.word_frequency.keys())

    def _normalize_unicode(self, text: str) -> str:
        """
        Normalize Unicode text (e.g., decompose ligatures) to their compatibility forms.
        This converts characters like “ﬁ” to "fi".
        """
        return unicodedata.normalize("NFKC", text)

    def correct_sentence(self, sentence: str) -> str:
        """
        Corrects the spelling of each word in the input sentence.
        Steps:
        1. Normalize Unicode (decompose ligatures, etc.).
        2. Use SpellChecker for a primary correction.
        3. If SpellChecker returns the same word or no suggestion, fall back to difflib
           against the known-word list with a moderate similarity cutoff.
        4. Preserve original casing (title case or uppercase) where applicable.
        Skips correction for very short words (length <= 2).

        :param sentence: The input sentence to correct.
        :return: The corrected sentence.
        """
        # Step 1: Normalize Unicode ligatures (e.g. “ofﬁce” → "office")
        sentence = self._normalize_unicode(sentence)

        words = sentence.split()
        corrected_words = []

        for word in words:
            lower = word.lower()
            # Skip very short words or words already recognized
            if len(lower) <= 2 or lower in self.spell:
                corrected_words.append(word)
                continue

            # Step 2: Primary SpellChecker correction
            primary = self.spell.correction(lower)
            if primary and primary != lower:
                # Preserve original casing
                if word.istitle():
                    primary = primary.capitalize()
                elif word.isupper():
                    primary = primary.upper()
                corrected_words.append(primary)
                continue

            # Step 3: Fallback via difflib with a moderate cutoff
            matches = difflib.get_close_matches(lower, self.known_words, n=1, cutoff=0.5)
            if matches:
                best = matches[0]
                if word.istitle():
                    best = best.capitalize()
                elif word.isupper():
                    best = best.upper()
                corrected_words.append(best)
            else:
                corrected_words.append(word)

        return " ".join(corrected_words)
